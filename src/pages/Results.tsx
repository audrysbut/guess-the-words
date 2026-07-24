import { gameState, page, localPlayerId } from '@/store/game-store'
import { Scoreboard } from '@/components/Scoreboard'

interface ResultsProps {
  onPlayAgain: () => void
}

export function Results({ onPlayAgain }: ResultsProps) {
  const gs = gameState.value
  if (!gs) {
    return (
      <div class="page">
        <p>No results</p>
        <button class="btn btn-primary" onClick={onPlayAgain}>Play Again</button>
      </div>
    )
  }

  const sorted = [...gs.players].sort((a, b) => b.points - a.points)
  const winner = sorted[0]
  const isWinner = winner.id === localPlayerId.value

  return (
    <div class="page results-page">
      <div class="results-content">
        <h1>Game Over!</h1>

        {winner && (
          <div class="winner-section">
            <div class="trophy">{isWinner ? '🏆' : '🎉'}</div>
            <h2>{winner.name} wins!</h2>
            <p class="winner-score">{winner.points} points</p>
          </div>
        )}

        <div class="final-scores">
          <Scoreboard players={sorted} />
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
