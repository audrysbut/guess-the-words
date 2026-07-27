import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface RoundEndScreenProps {
  gameState: GameState
  playerId: string
}

export default function RoundEndScreen({ gameState, playerId }: RoundEndScreenProps) {
  const { t } = useT()
  const sortedPlayers = [...gameState.players].sort((a, b) => b.points - a.points)

  return (
    <div class="page round-end-page">
      <h2>{t('roundOver')}</h2>
      {gameState.roundWinner && (
        <p class="winner-announce">
          {gameState.players.find(p => p.id === gameState.roundWinner)?.name} {t('gotIt')}
        </p>
      )}
      <div class="answer-reveal">
        {t('theAnswerWas')} <strong>{gameState.currentWord}</strong>
      </div>
      <div class="scores-preview">
        {sortedPlayers.map(p => (
          <div key={p.id} class={`score-row ${p.id === playerId ? 'current' : ''}`}>
            <span class="name">{p.name}{p.id === playerId ? ` ${t('you')}` : ''}</span>
            <span class="points">{p.points} {t('pts')}</span>
          </div>
        ))}
      </div>
      <p class="next-hint">{t('nextRoundStarting')}</p>
    </div>
  )
}
