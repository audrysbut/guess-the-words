import { useEffect, useRef, useState } from 'preact/hooks'
import { PeerManager } from '@/webrtc/peer-manager'
import { useMultiplayerGame } from '@/store/use-multiplayer-game'
import { createRoundIntroState } from '@/store/game-logic'
import GameScreen from './GameScreen'
import LobbyUI from './LobbyUI'
import { useT } from '@/i18n/context'
import type { Language, GameConfig } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'

const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
  language: 'lt',
}

interface LobbyProps {
  playerName: string
  roomCode?: string
  lang: Language
  setLang: (lang: Language) => void
}

export default function Lobby({ playerName, roomCode: propRoomCode, lang, setLang }: LobbyProps) {
  const { t } = useT()
  const managerRef = useRef<PeerManager | null>(null)
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState(propRoomCode || '')

  const {
    gameState,
    setGameState,
    players,
    setPlayers,
    handleHostLetterGuess,
    handleHostWordGuess,
    handlePeerMessage,
  } = useMultiplayerGame(managerRef, setLang)

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

        if (propRoomCode) {
          await m.joinRoom(propRoomCode, playerName)
          room = propRoomCode
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

        if (!propRoomCode) {
          const url = `${window.location.origin}/guess-the-words/?room=${room}`
          window.history.replaceState(null, '', url)
        }
      } catch {
        if (!cancelled) setError(propRoomCode ? t('failedJoinRoom') : t('failedCreateRoom'))
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

  if (connecting) {
    return (
      <div class="page">
        <p>{t('connecting')}</p>
        {error && <p class="error">{error}</p>}
      </div>
    )
  }

  if (gameState && gameState.phase !== 'lobby') {
    const letterGuess = isHost
      ? handleHostLetterGuess
      : (l: string) => managerRef.current?.send({ type: 'guess_letter', playerId: peerId, letter: l })

    const wordGuess = isHost
      ? handleHostWordGuess
      : (w: string) => managerRef.current?.send({ type: 'guess_word', playerId: peerId, word: w })

    return (
      <GameScreen
        gameState={gameState}
        playerId={peerId}
        onLetterGuess={letterGuess}
        onWordGuess={wordGuess}
        isSolo={false}
      />
    )
  }

  const handleStartGame = () => {
    const m = managerRef.current
    if (!m?.isHost || !gameState) return
    const words = selectWordsForGame(gameState.config.themes, gameState.config.totalRounds, gameState.config.language)
    const newState = createRoundIntroState(gameState, words[0], 0)
    setGameState(newState)
    m.send({ type: 'state_sync', state: newState })
  }

  return (
    <LobbyUI
      players={players}
      isHost={isHost}
      roomCode={roomCode}
      onStartGame={handleStartGame}
      error={error}
    />
  )
}
