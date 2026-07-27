import { useEffect } from 'preact/hooks'
import GameScreen from './GameScreen'
import { useSoloGame } from '@/store/use-solo-game'
import type { Language } from '@/types/game'

interface SoloGameProps {
  playerName: string
  lang: Language
}

export default function SoloGame({ playerName, lang }: SoloGameProps) {
  const { soloGameState, handleStartSolo, handleSoloLetter, handleSoloWord } = useSoloGame()

  useEffect(() => {
    handleStartSolo(playerName, lang)
  }, [])

  if (!soloGameState) {
    return <div class="page"><p>Starting...</p></div>
  }

  const playerId = soloGameState.players[0]?.id ?? ''

  return (
    <GameScreen
      gameState={soloGameState}
      playerId={playerId}
      onLetterGuess={handleSoloLetter}
      onWordGuess={handleSoloWord}
      isSolo={true}
    />
  )
}
