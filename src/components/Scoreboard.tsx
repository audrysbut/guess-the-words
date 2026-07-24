import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'

interface ScoreboardProps {
  players: Player[]
}

export function Scoreboard({ players }: ScoreboardProps) {
  const { t } = useT()
  const sorted = [...players].sort((a, b) => b.points - a.points)

  return (
    <div class="scoreboard">
      {sorted.map((p, i) => (
        <div key={p.id} class="score-row">
          <span class="rank">#{i + 1}</span>
          <span class="name">{p.name}</span>
          <span class="points">{p.points} {t('pts')}</span>
        </div>
      ))}
    </div>
  )
}
