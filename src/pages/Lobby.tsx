import { useEffect, useRef, useState } from 'preact/hooks'
import { PeerManager } from '@/webrtc/peer-manager'
import { useMultiplayerGame } from '@/store/use-multiplayer-game'
import GameScreen from './GameScreen'
import { useT } from '@/i18n/context'
import type { Language, GameState, GameConfig } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'

const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
  language: 'lt',
}

const isShareSupported = typeof navigator.share === 'function' && /Mobi|Android/i.test(navigator.userAgent)

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

        if (cancelled) {
          m.disconnect()
          return
        }

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

  /* ====== Game UI during active rounds ====== */

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

  /* ====== Connecting state ====== */

  if (connecting) {
    return (
      <div class="page">
        <p>{t('connecting')}</p>
        {error && <p class="error">{error}</p>}
      </div>
    )
  }

  /* ====== Lobby UI (phase === 'lobby') ====== */

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
  }

  const inviteUrl = `${window.location.origin}/guess-the-words/?room=${roomCode}`

  const shareLink = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'Atspėk Žodžius',
        text: t('joinGame'),
        url: inviteUrl,
      })
    } catch {
      // user cancelled
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
  }

  return (
    <div class="page lobby-screen">
      <h1 class="title" style="font-size: 1.8rem">{t('title')}</h1>
      <div class="card">
        <h2>{t('lobby')}</h2>
        <p class="player-count">{players.length} {t('playersJoined')}</p>
        <div class="player-list">
          {players.map(p => (
            <div key={p.id} class={`player-item ${p.isHost ? 'host' : ''}`}>
              <span class="player-dot" />
              <span class="player-name">{p.name}</span>
              {p.isHost && <span class="host-badge">{t('host')}</span>}
            </div>
          ))}
        </div>
        {isHost && (
          <div class="lobby-actions">
            <input type="text" readOnly value={inviteUrl} class="invite-input" onClick={e => (e.target as HTMLInputElement).select()} />
            <div class="invite-row">
              <button class="btn btn-accent" onClick={copyLink} style="flex:1">{t('copyLink')}</button>
              {isShareSupported && (
                <button class="btn btn-primary" onClick={shareLink} style="flex:1">{t('share')}</button>
              )}
            </div>
            <button class="btn btn-primary btn-large" onClick={handleStartGame}>
              {t('startGame')}
            </button>
          </div>
        )}
        {!isHost && (
          <p class="waiting-text">{t('waitingForHost')}</p>
        )}
        {error && <p class="error">{error}</p>}
      </div>
    </div>
  )
}
