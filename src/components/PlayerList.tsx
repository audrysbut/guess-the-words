import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'

interface PlayerListProps {
  players: Player[]
  currentTurn: string
  myId: string
}

export function PlayerList({ players, currentTurn, myId }: PlayerListProps) {
  const { t } = useT()

  return (
    <div class="player-list">
      {players.map(p => (
        <div
          key={p.id}
          class={`player-item ${p.id === currentTurn && currentTurn ? 'active-turn' : ''} ${p.id === myId ? 'me' : ''}`}
        >
          <span class="player-name">
            {p.name}
            {p.isHost ? ` ${t('host')}` : ''}
            {p.id === myId ? ` ${t('you')}` : ''}
          </span>
          <span class="player-score">{p.points} {t('pts')}</span>
        </div>
      ))}
    </div>
  )
}
