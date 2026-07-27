import type { GameState } from '@/types/game'
import GameOverScreen from './GameOverScreen'
import RoundIntroScreen from './RoundIntroScreen'
import RoundEndScreen from './RoundEndScreen'
import PlayingScreen from './PlayingScreen'

interface GameScreenProps {
  gameState: GameState
  playerId: string
  onLetterGuess: (letter: string) => void
  onWordGuess: (word: string) => void
  isSolo: boolean
}

export default function GameScreen({ gameState, playerId, onLetterGuess, onWordGuess, isSolo }: GameScreenProps) {
  const phase = gameState.phase

  if (phase === 'game_over') return <GameOverScreen gameState={gameState} playerId={playerId} />
  if (phase === 'round_intro') return <RoundIntroScreen gameState={gameState} />
  if (phase === 'round_end') return <RoundEndScreen gameState={gameState} playerId={playerId} />

  return (
    <PlayingScreen
      gameState={gameState}
      playerId={playerId}
      onLetterGuess={onLetterGuess}
      onWordGuess={onWordGuess}
      isSolo={isSolo}
    />
  )
}
