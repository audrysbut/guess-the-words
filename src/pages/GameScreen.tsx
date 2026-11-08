import type { GameState } from '@/types/game'
import GameOverScreen from './GameOverScreen'
import RoundIntroScreen from './RoundIntroScreen'
import RoundEndScreen from './RoundEndScreen'
import PlayingScreen from './PlayingScreen'
import PickingScreen from './PickingScreen'

interface GameScreenProps {
  gameState: GameState
  playerId: string
  onLetterGuess: (letter: string) => void
  onWordGuess: (word: string) => void
  onPickWord?: (word: string) => void
  isSolo: boolean
}

export default function GameScreen({ gameState, playerId, onLetterGuess, onWordGuess, onPickWord, isSolo }: GameScreenProps) {
  const phase = gameState.phase

  if (phase === 'picking') return <PickingScreen gameState={gameState} playerId={playerId} onPickWord={onPickWord ?? (() => {})} />
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
