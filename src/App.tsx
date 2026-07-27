import { useState, useRef, useCallback } from 'preact/hooks'
import { PeerManager } from '@/webrtc/peer-manager'
import HomeScreen from '@/pages/HomeScreen'
import Lobby from '@/pages/Lobby'
import GameScreen from '@/pages/GameScreen'
import type { GameState, GameConfig, Language } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'
import { I18nProvider } from '@/i18n/context'
import { useLanguage } from '@/store/use-language'
import { useSoloGame } from '@/store/use-solo-game'
import { useMultiplayerGame } from '@/store/use-multiplayer-game'

const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
  language: 'lt',
}

export default function App() {
  const initialRoomId = new URLSearchParams(window.location.search).get('room')
  const managerRef = useRef<PeerManager | null>(null)
  const { lang, setLang, toggleLang } = useLanguage()

  const [screen, setScreen] = useState<'home' | 'lobby' | 'game'>('home')
  const [, setPlayerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [peerId, setPeerId] = useState<string | null>(null)

  const { soloGameState, handleStartSolo: hookStartSolo, handleSoloLetter, handleSoloWord } = useSoloGame(lang)

  const handleStartSolo = (name: string) => {
    hookStartSolo(name)
    setScreen('game')
  }

  const handleStateSync = useCallback((state: GameState) => {
    setLang(state.config.language)
    if (state.phase !== 'lobby') setScreen('game')
  }, [setLang])

  const {
    gameState,
    setGameState,
    players,
    setPlayers,
    handleHostLetterGuess,
    handleHostWordGuess,
    handlePeerMessage,
  } = useMultiplayerGame(managerRef, { onStateSync: handleStateSync })

  const handlePeerMessageRef = useRef(handlePeerMessage)
  handlePeerMessageRef.current = handlePeerMessage

  const hasPeers = managerRef.current ? managerRef.current.playerIds.length > 0 : false
  const isSolo = !isHost && !hasPeers
  const displayState = isHost || hasPeers ? gameState : soloGameState
  const displayPlayerId = peerId || soloGameState?.players[0]?.id || ''
  const effectiveLang: Language = displayState?.config?.language || lang

  /* ====== Room management ====== */

  const handleCreateRoom = async (name: string) => {
    setPlayerName(name)
    setError(null)
    try {
      const m = new PeerManager()
      const config = { ...DEFAULT_CONFIG, language: lang }
      const { roomCode: code, state } = await m.createRoom(name, config)
      managerRef.current = m
      m.onMessage((msg, id) => handlePeerMessageRef.current(msg, id))
      setGameState(state)
      setPlayers(state.players)
      setIsHost(true)
      setPeerId(state.players[0].id)
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
      m.onMessage((msg, id) => handlePeerMessageRef.current(msg, id))
      setIsHost(false)
      setPeerId(m.id)
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
    if (!gameState) return
    const words = selectWordsForGame(gameState.config.themes, gameState.config.totalRounds, gameState.config.language)
    const firstWord = words[0]
    const newState: GameState = {
      ...gameState,
      phase: 'round_intro',
      currentRound: 0,
      currentWord: firstWord.answer,
      currentTokens: firstWord.tokens,
      revealedTokens: firstWord.tokens.map(() => false),
      guessedLetters: [],
      theme: firstWord.theme,
      roundWinner: null,
      currentTurn: '',
      turnEndsAt: null,
    }
    setGameState(newState)
    m.send({ type: 'state_sync', state: newState })
    setScreen('game')
  }

  /* ====== Guess callbacks ====== */

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

  /* ====== Render ====== */

  let content: preact.ComponentChild

  if (screen === 'home') {
    content = (
      <HomeScreen
        onStartSolo={handleStartSolo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
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
