import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface GameOverScreenProps {
  gameState: GameState
  playerId: string
}

export default function GameOverScreen({ gameState, playerId }: GameOverScreenProps) {
  const { t } = useT()
  const sortedPlayers = [...gameState.players].sort((a, b) => b.points - a.points)
  const winner = sortedPlayers[0]

  return (
    <div class="page gameover-screen">
      <h1 class="title" style="font-size: 2rem">{t('gameOver')}</h1>
      <div class="card">
        {winner && (
          <div class="winner-announcement">
            <div class="trophy" style="font-size: 3rem; text-align: center">&#127942;</div>
            <h2>{winner.name} {t('wins') }</h2>
            <p>{winner.points} {t('pointsTotal')}</p>
          </div>
        )}
        <div class="final-standings">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} class={`standing-row ${i === 0 ? 'winner' : ''}`}>
              <span class="rank">#{i + 1} </span>
              <span class="name">{p.name}{p.id === playerId ? ` ${t('you')} ` : ''}</span>
              <span class="score">{p.points} {t('pts')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
