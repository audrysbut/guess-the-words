import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import { PeerManager } from '@/webrtc/peer-manager'
import HomeScreen from '@/pages/HomeScreen'
import Lobby from '@/pages/Lobby'
import GameScreen from '@/pages/GameScreen'
import type { GameState, GameConfig, Player, Language } from '@/types/game'
import type { Message as PeerMessage } from '@/types/messages'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'
import { I18nProvider } from '@/i18n/context'

const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
  language: 'lt',
}

export default function App() {
  const [initialRoomId, setInitialRoomId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('room')
  })
  const managerRef = useRef<PeerManager | null>(null)

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('guess-the-words-lang') as Language) || 'lt'
  })

  const [screen, setScreen] = useState<'home' | 'lobby' | 'game'>('home')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isHost, setIsHost] = useState(false)
  const [peerId, setPeerId] = useState<string | null>(null)

  const [soloGameState, setSoloGameState] = useState<GameState | null>(null)
  const soloWordListRef = useRef<ReturnType<typeof selectWordsForGame>>([])
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasPeers = managerRef.current ? managerRef.current.playerIds.length > 0 : false
  const isSolo = !isHost && !hasPeers
  const displayState = isHost || hasPeers ? gameState : soloGameState
  const displayPlayerId = peerId || soloGameState?.players[0]?.id || ''

  const effectiveLang: Language = displayState?.config?.language || lang

  useEffect(() => {
    localStorage.setItem('guess-the-words-lang', lang)
  }, [lang])

  /* ====== Multiplayer: Host game logic ====== */

  const getNextTurn = (gs: GameState): string => {
    const idx = gs.players.findIndex(p => p.id === gs.currentTurn)
    if (idx === -1) return gs.players[0]?.id ?? ''
    return gs.players[(idx + 1) % gs.players.length].id
  }

  const startTurnTimer = (gs: GameState) => {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    turnTimerRef.current = setTimeout(() => {
      const current = gameStateRef.current
      if (!current || current.phase !== 'playing') return
      const nextTurn = getNextTurn(current)
      const updated: GameState = {
        ...current, currentTurn: nextTurn,
        turnEndsAt: Date.now() + current.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, gs.config.timeLimit * 1000)
  }

  const gameStateRef = useRef<GameState | null>(null)
  gameStateRef.current = gameState

  const advanceRound = (current: GameState) => {
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
    const newState: GameState = {
      ...current, phase: 'round_intro', currentRound: nextRound,
      currentWord: nextWord.answer, currentTokens: nextWord.tokens,
      revealedTokens: nextWord.tokens.map(() => false), guessedLetters: [],
      theme: nextWord.theme, roundWinner: null, currentTurn: '', turnEndsAt: null,
    }
    setGameState(newState)
    managerRef.current?.send({ type: 'state_sync', state: newState })
  }

  const handleHostLetterGuess = (letter: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const lower = letter.toLowerCase()
    if (gs.guessedLetters.includes(lower)) return

    const newGuessed = [...gs.guessedLetters, lower]
    const correct = gs.currentWord.toLowerCase().includes(lower)
    const newRevealed = [...gs.revealedTokens]

    if (correct) {
      for (let ti = 0; ti < gs.currentTokens.length; ti++) {
        if (newRevealed[ti]) continue
        const tok = gs.currentTokens[ti].toLowerCase()
        if ([...tok].every(c => !/\p{L}/u.test(c) || newGuessed.includes(c))) {
          newRevealed[ti] = true
        }
      }
    }

    const allRevealed = newRevealed.every(Boolean)
    const newScores = { ...gs.scores }
    if (correct) newScores[gs.currentTurn] = (newScores[gs.currentTurn] || 0) + 1
    const updatedPlayers = gs.players.map(p => ({ ...p, points: newScores[p.id] || 0 }))

    if (allRevealed) {
      const final: GameState = {
        ...gs, guessedLetters: newGuessed, revealedTokens: newRevealed,
        scores: newScores, players: updatedPlayers, phase: 'round_end',
        roundWinner: gs.currentTurn, currentTurn: '', turnEndsAt: null,
      }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    const next = correct ? gs.currentTurn : getNextTurn(gs)
    const updated: GameState = {
      ...gs, guessedLetters: newGuessed, revealedTokens: newRevealed,
      scores: newScores, players: updatedPlayers,
      currentTurn: next, turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
    }
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }

  const handleHostWordGuess = (word: string) => {
    const gs = gameStateRef.current
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const wordLower = word.toLowerCase()
    const gsWordLower = gs.currentWord.toLowerCase()
    const isFull = wordLower === gsWordLower
    const tokenIdx = gs.currentTokens.findIndex((t, i) => !gs.revealedTokens[i] && t.toLowerCase() === wordLower)
    const correct = isFull || tokenIdx !== -1
    const newScores = { ...gs.scores }
    if (correct) newScores[gs.currentTurn] = (newScores[gs.currentTurn] || 0) + 10
    const updatedPlayers = gs.players.map(p => ({ ...p, points: newScores[p.id] || 0 }))

    if (isFull) {
      const final: GameState = {
        ...gs, revealedTokens: gs.currentTokens.map(() => true),
        scores: newScores, players: updatedPlayers, phase: 'round_end',
        roundWinner: gs.currentTurn, currentTurn: '', turnEndsAt: null,
      }
      setGameState(final)
      managerRef.current?.send({ type: 'state_sync', state: final })
      return
    }

    if (tokenIdx !== -1) {
      const newRevealed = [...gs.revealedTokens]
      newRevealed[tokenIdx] = true
      const allRevealed = newRevealed.every(Boolean)
      if (allRevealed) {
        const final: GameState = {
          ...gs, revealedTokens: newRevealed, scores: newScores,
          players: updatedPlayers, phase: 'round_end',
          roundWinner: gs.currentTurn, currentTurn: '', turnEndsAt: null,
        }
        setGameState(final)
        managerRef.current?.send({ type: 'state_sync', state: final })
        return
      }
      const updated: GameState = {
        ...gs, revealedTokens: newRevealed, scores: newScores, players: updatedPlayers,
        currentTurn: gs.currentTurn, turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
      return
    }

    const next = getNextTurn(gs)
    const updated: GameState = {
      ...gs, currentTurn: next, turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
    }
    setGameState(updated)
    managerRef.current?.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }

  const handlePeerMessage = (message: PeerMessage, senderId: string) => {
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
      setLang(message.state.config.language)
      if (message.state.phase !== 'lobby') {
        setScreen('game')
      }
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
  }

  /* ====== Room management ====== */

  const handleCreateRoom = async (name: string) => {
    setPlayerName(name)
    setError(null)
    try {
      const m = new PeerManager()
      const config = { ...DEFAULT_CONFIG, language: lang }
      const { roomCode: code, state } = await m.createRoom(name, config)
      managerRef.current = m
      m.onMessage(handlePeerMessage)
      setGameState(state)
      setPlayers(state.players)
      setIsHost(true)
      setPeerId(state.players[0].id)
      setConnected(true)
      setScreen('lobby')
      const url = `${window.location.origin}/guess-the-words/?room=${code}`
      window.history.replaceState(null, '', url)
    } catch {
      setError(lang === 'lt' ? 'Nepavyko sukurti kambario' : 'Failed to create room')
    }
  }

  const handleJoinRoom = async (name: string, roomId: string) => {
    setPlayerName(name)
    setError(null)
    try {
      const m = new PeerManager()
      await m.joinRoom(roomId, name)
      managerRef.current = m
      m.onMessage(handlePeerMessage)
      setIsHost(false)
      setPeerId(m.id)
      setConnected(true)
      setPlayers([])
      setGameState(null)
      setScreen('lobby')
    } catch {
      setError(lang === 'lt' ? 'Nepavyko prisijungti prie kambario' : 'Failed to join room')
    }
  }

  const handleStartGame = () => {
    const m = managerRef.current
    if (!m?.isHost) return
    const gs = gameStateRef.current
    if (!gs) return
    const words = selectWordsForGame(gs.config.themes, gs.config.totalRounds, gs.config.language)
    const firstWord = words[0]
    const newState: GameState = {
      ...gs, phase: 'round_intro', currentRound: 0,
      currentWord: firstWord.answer, currentTokens: firstWord.tokens,
      revealedTokens: firstWord.tokens.map(() => false), guessedLetters: [],
      theme: firstWord.theme, roundWinner: null, currentTurn: '', turnEndsAt: null,
    }
    setGameState(newState)
    m.send({ type: 'state_sync', state: newState })
    setScreen('game')
  }

  /* ====== Solo mode ====== */

  const handleStartSolo = (name: string) => {
    setPlayerName(name)
    const playerId = `solo-${Date.now()}`
    const soloConfig = { ...DEFAULT_CONFIG, language: lang }
    const words = selectWordsForGame(soloConfig.themes, soloConfig.totalRounds, lang)
    soloWordListRef.current = words
    const firstWord = words[0]
    const soloState: GameState = {
      phase: 'round_intro',
      players: [{ id: playerId, name, points: 0, isHost: true }],
      config: { ...soloConfig },
      currentRound: 0, totalRounds: soloConfig.totalRounds,
      currentTurn: '', currentWord: firstWord.answer,
      currentTokens: firstWord.tokens,
      revealedTokens: firstWord.tokens.map(() => false),
      guessedLetters: [], theme: firstWord.theme,
      scores: { [playerId]: 0 }, turnEndsAt: null, roundWinner: null,
    }
    setSoloGameState(soloState)
    setScreen('game')
  }

  const handleSoloLetter = (letter: string) => {
    setSoloGameState((prev: GameState | null) => {
      if (!prev || prev.phase !== 'playing') return prev
      const lower = letter.toLowerCase()
      if (prev.guessedLetters.includes(lower)) return prev
      const newGuessed = [...prev.guessedLetters, lower]
      const correct = prev.currentWord.toLowerCase().includes(lower)
      const newRevealed = [...prev.revealedTokens]
      if (correct) {
        for (let ti = 0; ti < prev.currentTokens.length; ti++) {
          if (newRevealed[ti]) continue
          const tok = prev.currentTokens[ti].toLowerCase()
          if ([...tok].every(c => !/\p{L}/u.test(c) || newGuessed.includes(c))) {
            newRevealed[ti] = true
          }
        }
      }
      const allRevealed = newRevealed.every(Boolean)
      const pid = prev.players[0]?.id ?? ''
      const pts = correct ? 1 : 0
      if (allRevealed) {
        return {
          ...prev, guessedLetters: newGuessed, revealedTokens: newRevealed,
          phase: 'round_end' as const, roundWinner: pid,
          scores: { ...prev.scores, [pid]: (prev.scores[pid] ?? 0) + pts },
          players: prev.players.map(p => ({ ...p, points: (prev.scores[p.id] ?? 0) + (p.id === pid ? pts : 0) })),
          currentTurn: '', turnEndsAt: null,
        }
      }
      return {
        ...prev, guessedLetters: newGuessed, revealedTokens: newRevealed,
        scores: { ...prev.scores, [pid]: (prev.scores[pid] ?? 0) + pts },
        players: prev.players.map(p => ({ ...p, points: (prev.scores[p.id] ?? 0) + (p.id === pid ? pts : 0) })),
        currentTurn: pid,
      }
    })
  }

  const handleSoloWord = (word: string) => {
    setSoloGameState((prev: GameState | null) => {
      if (!prev || prev.phase !== 'playing') return prev
      const wordLower = word.toLowerCase()
      const gsWordLower = prev.currentWord.toLowerCase()
      const isFull = wordLower === gsWordLower
      const tokenIdx = prev.currentTokens.findIndex((t, i) => !prev.revealedTokens[i] && t.toLowerCase() === wordLower)
      const correct = isFull || tokenIdx !== -1
      const pid = prev.players[0]?.id ?? ''
      if (isFull) {
        return {
          ...prev, revealedTokens: prev.currentTokens.map(() => true),
          phase: 'round_end' as const, roundWinner: pid,
          scores: { ...prev.scores, [pid]: (prev.scores[pid] ?? 0) + 10 },
          players: prev.players.map(p => ({ ...p, points: (prev.scores[p.id] ?? 0) + (p.id === pid ? 10 : 0) })),
          currentTurn: '', turnEndsAt: null,
        }
      }
      if (tokenIdx !== -1) {
        const newRevealed = [...prev.revealedTokens]
        newRevealed[tokenIdx] = true
        const allRevealed = newRevealed.every(Boolean)
        if (allRevealed) {
          return {
            ...prev, revealedTokens: newRevealed,
            phase: 'round_end' as const, roundWinner: pid,
            scores: { ...prev.scores, [pid]: (prev.scores[pid] ?? 0) + 10 },
            players: prev.players.map(p => ({ ...p, points: (prev.scores[p.id] ?? 0) + (p.id === pid ? 10 : 0) })),
            currentTurn: '', turnEndsAt: null,
          }
        }
        return {
          ...prev, revealedTokens: newRevealed,
          scores: { ...prev.scores, [pid]: (prev.scores[pid] ?? 0) + 10 },
          players: prev.players.map(p => ({ ...p, points: (prev.scores[p.id] ?? 0) + (p.id === pid ? 10 : 0) })),
          currentTurn: pid,
        }
      }
      return prev
    })
  }

  /* ====== Solo effects ====== */

  useEffect(() => {
    if (!soloGameState || soloGameState.phase !== 'round_intro') return
    const t = setTimeout(() => {
      setSoloGameState((prev: GameState | null) => {
        if (!prev) return prev
        return { ...prev, phase: 'playing', currentTurn: prev.players[0]?.id ?? '' }
      })
    }, 3000)
    return () => clearTimeout(t)
  }, [soloGameState?.phase, soloGameState?.currentRound])

  useEffect(() => {
    if (!soloGameState || soloGameState.phase !== 'round_end') return
    const t = setTimeout(() => {
      const nextRound = soloGameState.currentRound + 1
      if (nextRound >= soloGameState.totalRounds) {
        setSoloGameState((prev: GameState | null) => {
          if (!prev) return prev
          return { ...prev, phase: 'game_over' }
        })
        return
      }
      const nextWord = soloWordListRef.current[nextRound % soloWordListRef.current.length]
      if (!nextWord) {
        setSoloGameState((prev: GameState | null) => {
          if (!prev) return prev
          return { ...prev, phase: 'game_over' }
        })
        return
      }
      setSoloGameState((prev: GameState | null) => {
        if (!prev) return prev
        return {
          ...prev, phase: 'round_intro', currentRound: nextRound,
          currentWord: nextWord.answer, currentTokens: nextWord.tokens,
          revealedTokens: nextWord.tokens.map(() => false), guessedLetters: [],
          theme: nextWord.theme, roundWinner: null, currentTurn: '', turnEndsAt: null,
        }
      })
    }, 4000)
    return () => clearTimeout(t)
  }, [soloGameState?.phase, soloGameState?.currentRound])

  /* ====== Multiplayer effects ====== */

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_intro' || !isHost) return
    const t = setTimeout(() => {
      const gs = gameStateRef.current
      if (!gs) return
      const firstPlayer = gs.players.find(p => !p.isHost) ?? gs.players[0]
      const updated: GameState = {
        ...gs, phase: 'playing', currentTurn: firstPlayer.id,
        turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      }
      setGameState(updated)
      managerRef.current?.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, 3000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, isHost])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'round_end' || !isHost) return
    const t = setTimeout(() => advanceRound(gameState), 4000)
    return () => clearTimeout(t)
  }, [gameState?.phase, gameState?.currentRound, isHost])

  /* ====== Guess callbacks for GameScreen ====== */

  const letterGuess = isSolo
    ? handleSoloLetter
    : isHost
      ? handleHostLetterGuess
      : (l: string) => managerRef.current?.send({ type: 'guess_letter', playerId: displayPlayerId, letter: l })

  const wordGuess = isSolo
    ? handleSoloWord
    : isHost
      ? handleHostWordGuess
      : (w: string) => managerRef.current?.send({ type: 'guess_word', playerId: displayPlayerId, word: w })

  /* ====== Language Switcher ====== */

  const handleNfcRoomDetected = useCallback((roomId: string) => {
    setInitialRoomId(roomId)
  }, [])

  const toggleLang = () => {
    setLang(prev => prev === 'lt' ? 'en' : 'lt')
  }

  /* ====== Render ====== */

  let content: preact.ComponentChild

  if (screen === 'home') {
    content = (
      <HomeScreen
        onStartSolo={handleStartSolo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onNfcRoomDetected={handleNfcRoomDetected}
        error={error}
        initialRoomId={initialRoomId ?? undefined}
        lang={lang}
        onToggleLang={toggleLang}
      />
    )
  } else if (screen === 'lobby') {
    const roomId = managerRef.current?.id || initialRoomId || ''
    content = (
      <Lobby
        players={players}
        isHost={isHost}
        roomId={roomId}
        onStartGame={handleStartGame}
        error={error}
      />
    )
  } else if (displayState) {
    content = (
      <GameScreen
        gameState={displayState}
        playerId={displayPlayerId}
        onLetterGuess={letterGuess}
        onWordGuess={wordGuess}
        isSolo={isSolo}
      />
    )
  } else {
    content = (
      <div class="page">
        <p>{lang === 'lt' ? 'Jungiamasi...' : 'Connecting...'}</p>
        {error && <p class="error">{error}</p>}
      </div>
    )
  }

  return (
    <I18nProvider lang={effectiveLang} setLang={setLang}>
      <div class="app">
        {content}
      </div>
    </I18nProvider>
  )
}
