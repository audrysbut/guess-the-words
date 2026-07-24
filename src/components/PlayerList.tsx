import type { Player } from '@/types/game'

interface PlayerListProps {
  players: Player[]
  currentTurn: string
  myId: string
}

export function PlayerList({ players, currentTurn, myId }: PlayerListProps) {
  return (
    <div class="player-list">
      {players.map(p => (
        <div
          key={p.id}
          class={`player-item ${p.id === currentTurn && currentTurn ? 'active-turn' : ''} ${p.id === myId ? 'me' : ''}`}
        >
          <span class="player-name">
            {p.name}
            {p.isHost ? ' (Host)' : ''}
            {p.id === myId ? ' (You)' : ''}
          </span>
          <span class="player-score">{p.points} pts</span>
        </div>
      ))}
    </div>
  )
}
