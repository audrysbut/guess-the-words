import type { Player } from '@/types/game'

interface ScoreboardProps {
  players: Player[]
}

export function Scoreboard({ players }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.points - a.points)

  return (
    <div class="scoreboard">
      {sorted.map((p, i) => (
        <div key={p.id} class="score-row">
          <span class="rank">#{i + 1}</span>
          <span class="name">{p.name}</span>
          <span class="points">{p.points} pts</span>
        </div>
      ))}
    </div>
  )
}
