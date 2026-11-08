import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import type { GameState, Player, Language } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import type { Message as PeerMessage } from '@/types/messages'
import { PeerManager } from '@/webrtc/peer-manager'
import { selectWordsForGame } from '@/data/words'
import {
  applyLetterGuess, applyWordGuess, getNextTurnPlayer, getNextGuesser,
  buildRoundEndState, buildPlayingState, advanceToNextRound, createRoundIntroState,
  createPickingState, createRoundIntroStateFromPick,
} from './game-logic'

const DEFAULT_CONFIG = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
  mode: 'classic' as const,
}

export function useMultiplayerGame(
  playerName: string,
  roomCodeInput: string | undefined,
  lang: Language,
  setLang?: (lang: Language) => void,
) {
  const managerRef = useRef<PeerManager | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState(roomCodeInput || '')
  const gameStateRef = useRef<GameState | null>(null)
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  gameStateRef.current = gameState

  const startTurnTimer = useCallback((gs: GameState) => {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    turnTimerRef.current = setTimeout(() => {
      const current = gameStateRef.current
      if (!current || current.phase !== 'playing') return
      const nextTurn = getNextTurnPlayer(current, current.currentTurn)
      const updated: GameState = {
        ...current,
        currentTurn: nextTurn,
        turnEndsAt: Date.now() + current.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, gs.config.timeLimit * 1000)
  }, [])

  const advanceRound = useCallback((current: GameState) => {
    let newState: GameState
    if (current.config.mode === 'custom') {
      newState = advanceToNextRound(current)
    } else {
      const words = selectWordsForGame(current.config.themes, current.config.totalRounds, current.config.language)
      newState = advanceToNextRound(current, words)
    }
    setGameState(newState)
    managerRef.current?.send({ type: 'state_sync', state: newState })
  }, [])

  const handleHostLetterGuess = useCallback((letter: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const result = applyLetterGuess(gs, letter)
    if (!result) return

    if (result.allRevealed) {
      const final = buildRoundEndState(gs, {
        revealedTokens: result.revealedTokens,
        guessedLetters: result.guessedLetters,
        scores: result.scores,
        players: result.players,
      })
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    const next = result.correct ? gs.currentTurn : getNextTurnPlayer(gs, gs.currentTurn)
    const updated = buildPlayingState(gs, {
      revealedTokens: result.revealedTokens,
      guessedLetters: result.guessedLetters,
      scores: result.scores,
      players: result.players,
    }, next, Date.now() + gs.config.timeLimit * 1000)
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }, [startTurnTimer])

  const handleHostWordGuess = useCallback((word: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const result = applyWordGuess(gs, word)
    if (!result) return

    if (result.isFullMatch) {
      const final = buildRoundEndState(gs, {
        revealedTokens: gs.currentTokens.map(() => true),
        scores: result.scores,
        players: result.players,
      })
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    if (result.tokenIdx !== -1) {
      if (result.allRevealed) {
        const final = buildRoundEndState(gs, {
          revealedTokens: result.revealedTokens,
          scores: result.scores,
          players: result.players,
        })
        setGameState(final)
        managerRef.current?.send({ type: 'state_sync', state: final })
        return
      }
      const updated = buildPlayingState(gs, {
        revealedTokens: result.revealedTokens,
        scores: result.scores,
        players: result.players,
      }, gs.currentTurn, Date.now() + gs.config.timeLimit * 1000)
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
      return
    }

    const next = getNextTurnPlayer(gs, gs.currentTurn)
    const updated = buildPlayingState(gs, {}, next, Date.now() + gs.config.timeLimit * 1000)
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }, [startTurnTimer])

  const handleHostPickWord = useCallback((word: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'picking') return
    const trimmed = word.trim()
    if (!trimmed) return
    if (!/^[\p{L}\s]+$/u.test(trimmed)) return
    const tokens = trimmed.split(/\s+/)
    const newState = createRoundIntroStateFromPick(gs, trimmed, tokens, null, gs.currentRound)
    setGameState(newState)
    managerRef.current?.send({ type: 'state_sync', state: newState })
  }, [])

  const handlePeerMessage = useCallback((message: PeerMessage, senderId: string) => {
    const host = managerRef.current?.isHost ?? false

    if (message.type === 'join' && host) {
      const newPlayer: Player = { id: senderId, name: message.name, points: 0, isHost: false }
      setGameState((prev: GameState | null) => {
        if (!prev) return prev
        if (prev.players.some(p => p.id === senderId)) return prev
        const updated = {
          ...prev,
          players: [...prev.players, newPlayer],
          scores: { ...prev.scores, [senderId]: 0 },
        }
        managerRef.current?.sendTo(senderId, { type: 'state_sync', state: updated })
        managerRef.current?.send({ type: 'player-joined', player: newPlayer })
        return updated
      })
      setPlayers((prev: Player[]) => {
        if (prev.some(p => p.id === senderId)) return prev
        return [...prev, newPlayer]
      })
    }

    if (message.type === 'guess_letter' && host) {
      handleHostLetterGuess(message.letter)
    }

    if (message.type === 'guess_word' && host) {
      handleHostWordGuess(message.word)
    }

    if (message.type === 'pick_word' && host) {
      const gs = gameStateRef.current
      if (!gs || gs.phase !== 'picking') return
      if (gs.pickerId !== message.playerId) return
      handleHostPickWord(message.word)
    }

    if (message.type === 'state_sync' && !host) {
      setGameState(message.state)
      setPlayers(message.state.players)
      setLang?.(message.state.config.language)
    }

    if (message.type === 'player-joined' && !host) {
      setPlayers((prev: Player[]) => {
        if (prev.some(p => p.id === message.player.id)) return prev
        return [...prev, message.player]
      })
    }

    if (message.type === 'player-left' && host) {
      setGameState((prev: GameState | null) => {
        if (!prev) return prev
        return { ...prev, players: prev.players.filter(p => p.id !== message.playerId) }
      })
      setPlayers((prev: Player[]) => prev.filter(p => p.id !== message.playerId))
    }
  }, [handleHostLetterGuess, handleHostWordGuess, handleHostPickWord, setLang])

  const handlePeerMessageRef = useRef(handlePeerMessage)
  handlePeerMessageRef.current = handlePeerMessage

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const m = new PeerManager()
        const config = { ...DEFAULT_CONFIG, language: lang }
        let room: string

        m.onMessage((msg, id) => handlePeerMessageRef.current(msg, id))

        if (roomCodeInput) {
          await m.joinRoom(roomCodeInput, playerName)
          room = roomCodeInput
        } else {
          const result = await m.createRoom(playerName, config)
          room = result.roomCode
          if (!cancelled) {
            setGameState(result.state)
            setPlayers(result.state.players)
          }
        }

        if (cancelled) { m.disconnect(); return }

        managerRef.current = m
        setRoomCode(room)

        if (!roomCodeInput) {
          const url = `${window.location.origin}/guess-the-words/?room=${room}`
          window.history.replaceState(null, '', url)
        }
      } catch {
        if (!cancelled) {
          setError(lang === 'lt'
            ? (roomCodeInput ? 'Nepavyko prisijungti prie kambario' : 'Nepavyko sukurti kambario')
            : (roomCodeInput ? 'Failed to join room' : 'Failed to create room'))
        }
      } finally {
        if (!cancelled) setConnecting(false)
      }
    })()

    return () => {
      cancelled = true
      managerRef.current?.disconnect()
      managerRef.current = null
    }
  }, [])

  const isHost = managerRef.current?.isHost ?? false
  const peerId = managerRef.current?.id ?? ''

  const letterGuess = isHost
    ? handleHostLetterGuess
    : (l: string) => managerRef.current?.send({ type: 'guess_letter', playerId: peerId, letter: l })

  const wordGuess = isHost
    ? handleHostWordGuess
    : (w: string) => managerRef.current?.send({ type: 'guess_word', playerId: peerId, word: w })

  const pickWord = isHost
    ? handleHostPickWord
    : (w: string) => managerRef.current?.send({ type: 'pick_word', playerId: peerId, word: w })

  const handleStartGame = (mode: 'classic' | 'custom' = 'classic') => {
    const m = managerRef.current
    const gs = gameStateRef.current
    if (!m?.isHost || !gs) return
    const config = { ...gs.config, mode }
    const stateWithConfig = { ...gs, config }
    let newState: GameState
    if (mode === 'custom') {
      const picker = stateWithConfig.players[0] ?? null
      newState = createPickingState(stateWithConfig, picker?.id ?? null, 0)
    } else {
      const words = selectWordsForGame(config.themes, config.totalRounds, config.language)
      newState = createRoundIntroState(stateWithConfig, words[0], 0)
    }
    setGameState(newState)
    m.send({ type: 'state_sync', state: newState })
  }

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_intro') return
    const isHost = managerRef.current?.isHost ?? false
    if (!isHost) return

    const t = setTimeout(() => {
      const gs = gameStateRef.current
      if (!gs) return
      let firstPlayerId = ''
      if (gs.config.mode === 'custom' && gs.pickerId) {
        firstPlayerId = getNextGuesser(gs.players, gs.pickerId, gs.pickerId)
      } else {
        firstPlayerId = gs.players[gs.currentRound % gs.players.length]?.id ?? ''
      }
      const updated: GameState = {
        ...gs,
        phase: 'playing',
        currentTurn: firstPlayerId,
        turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, 3000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, startTurnTimer])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_end') return
    const isHost = managerRef.current?.isHost ?? false
    if (!isHost) return

    const t = setTimeout(() => advanceRound(gameState), 4000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, advanceRound])

  return {
    connecting,
    error,
    roomCode,
    gameState,
    players,
    isHost,
    peerId,
    letterGuess,
    wordGuess,
    pickWord,
    handleStartGame,
  }
}
