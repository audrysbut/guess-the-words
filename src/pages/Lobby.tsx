import { useMultiplayerGame } from '@/store/use-multiplayer-game'
import GameScreen from './GameScreen'
import LobbyUI from './LobbyUI'
import { useT } from '@/i18n/context'
import type { Language } from '@/types/game'

interface LobbyProps {
  playerName: string
  roomCode?: string
  lang: Language
  setLang: (lang: Language) => void
}

export default function Lobby({ playerName, roomCode, lang, setLang }: LobbyProps) {
  const { t } = useT()
  const {
    connecting, error, roomCode: code, gameState, players,
    isHost, peerId, letterGuess, wordGuess, handleStartGame,
  } = useMultiplayerGame(playerName, roomCode, lang, setLang)

  if (connecting) {
    return (
      <div class="page">
        <p>{t('connecting')}</p>
        {error && <p class="error">{error}</p>}
      </div>
    )
  }

  if (gameState && gameState.phase !== 'lobby') {
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

  return (
    <LobbyUI
      players={players}
      isHost={isHost}
      roomCode={code}
      onStartGame={handleStartGame}
      error={error}
    />
  )
}
