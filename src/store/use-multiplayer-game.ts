import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import type { GameState, Player, Language } from '@/types/game'
import type { Message as PeerMessage } from '@/types/messages'
import type { PeerManager } from '@/webrtc/peer-manager'
import { selectWordsForGame } from '@/data/words'
import { applyLetterGuess, applyWordGuess, getNextPlayerId, createRoundIntroState } from './game-logic'

export function useMultiplayerGame(
  managerRef: { current: PeerManager | null },
  setLang?: (lang: Language) => void,
) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const gameStateRef = useRef<GameState | null>(null)
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  gameStateRef.current = gameState

  const startTurnTimer = useCallback((gs: GameState) => {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    turnTimerRef.current = setTimeout(() => {
      const current = gameStateRef.current
      if (!current || current.phase !== 'playing') return
      const nextTurn = getNextPlayerId(current.players, current.currentTurn)
      const updated: GameState = {
        ...current,
        currentTurn: nextTurn,
        turnEndsAt: Date.now() + current.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, gs.config.timeLimit * 1000)
  }, [managerRef])

  const advanceRound = useCallback((current: GameState) => {
    const nextRound = current.currentRound + 1
    if (nextRound >= current.totalRounds) {
      const final: GameState = { ...current, phase: 'game_over', currentTurn: '', turnEndsAt: null }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }
    const words = selectWordsForGame(current.config.themes, current.config.totalRounds, current.config.language)
    const nextWord = words[nextRound % words.length]
    if (!nextWord) {
      const final: GameState = { ...current, phase: 'game_over', currentTurn: '', turnEndsAt: null }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }
    const newState = createRoundIntroState(current, nextWord, nextRound)
    setGameState(newState)
    managerRef.current?.send({ type: 'state_sync', state: newState })
  }, [managerRef])

  const handleHostLetterGuess = useCallback((letter: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const result = applyLetterGuess(gs, letter)
    if (!result) return

    if (result.allRevealed) {
      const final: GameState = {
        ...gs,
        guessedLetters: result.guessedLetters,
        revealedTokens: result.revealedTokens,
        scores: result.scores,
        players: result.players,
        phase: 'round_end',
        roundWinner: gs.currentTurn,
        currentTurn: '',
        turnEndsAt: null,
      }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    const next = result.correct ? gs.currentTurn : getNextPlayerId(gs.players, gs.currentTurn)
    const updated: GameState = {
      ...gs,
      guessedLetters: result.guessedLetters,
      revealedTokens: result.revealedTokens,
      scores: result.scores,
      players: result.players,
      currentTurn: next,
      turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
    }
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }, [managerRef, startTurnTimer])

  const handleHostWordGuess = useCallback((word: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const result = applyWordGuess(gs, word)
    if (!result) return

    if (result.isFullMatch) {
      const final: GameState = {
        ...gs,
        revealedTokens: gs.currentTokens.map(() => true),
        scores: result.scores,
        players: result.players,
        phase: 'round_end',
        roundWinner: gs.currentTurn,
        currentTurn: '',
        turnEndsAt: null,
      }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    if (result.tokenIdx !== -1) {
      if (result.allRevealed) {
        const final: GameState = {
          ...gs,
          revealedTokens: result.revealedTokens,
          scores: result.scores,
          players: result.players,
          phase: 'round_end',
          roundWinner: gs.currentTurn,
          currentTurn: '',
          turnEndsAt: null,
        }
        setGameState(final)
        managerRef.current?.send({ type: 'state_sync', state: final })
        return
      }
      const updated: GameState = {
        ...gs,
        revealedTokens: result.revealedTokens,
        scores: result.scores,
        players: result.players,
        currentTurn: gs.currentTurn,
        turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
      return
    }

    const next = getNextPlayerId(gs.players, gs.currentTurn)
    const updated: GameState = {
      ...gs,
      currentTurn: next,
      turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
    }
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }, [managerRef, startTurnTimer])

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
  }, [managerRef, handleHostLetterGuess, handleHostWordGuess, setLang])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_intro') return
    const isHost = managerRef.current?.isHost ?? false
    if (!isHost) return

    const t = setTimeout(() => {
      const gs = gameStateRef.current
      if (!gs) return
      const firstPlayer = gs.players.find(p => !p.isHost) ?? gs.players[0]
      const updated: GameState = {
        ...gs,
        phase: 'playing',
        currentTurn: firstPlayer.id,
        turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, 3000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, managerRef, startTurnTimer])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_end') return
    const isHost = managerRef.current?.isHost ?? false
    if (!isHost) return

    const t = setTimeout(() => advanceRound(gameState), 4000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, managerRef, advanceRound])

  return {
    gameState,
    setGameState,
    players,
    setPlayers,
    handleHostLetterGuess,
    handleHostWordGuess,
    handlePeerMessage,
  }
}
