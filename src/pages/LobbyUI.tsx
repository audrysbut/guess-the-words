import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'
import { copyInviteLink, isShareSupported, shareInviteLink } from '@/utils/share'

interface LobbyUIProps {
  players: Player[]
  isHost: boolean
  roomCode: string
  onStartGame: () => void
  error: string | null
}

export default function LobbyUI({ players, isHost, roomCode, onStartGame, error }: LobbyUIProps) {
  const { t } = useT()
  const inviteUrl = `${window.location.origin}/guess-the-words/?room=${roomCode}`

  return (
    <div class="page lobby-screen">
      <h1 class="title" style="font-size: 1.8rem">{t('title')}</h1>
      <div class="card">
        <h2>{t('lobby')}</h2>
        <p class="player-count">{players.length} {t('playersJoined')}</p>
        <div class="player-list">
          {players.map(p => (
            <div key={p.id} class={`player-item ${p.isHost ? 'host' : ''}`}>
              <span class="player-dot" />
              <span class="player-name">{p.name}</span>
              {p.isHost && <span class="host-badge">{t('host')}</span>}
            </div>
          ))}
        </div>
        {isHost && (
          <div class="lobby-actions">
            <input type="text" readOnly value={inviteUrl} class="invite-input" onClick={e => (e.target as HTMLInputElement).select()} />
            <div class="invite-row">
              <button class="btn btn-accent" onClick={() => copyInviteLink(inviteUrl)} style="flex:1">{t('copyLink')}</button>
              {isShareSupported() && (
                <button class="btn btn-primary" onClick={() => shareInviteLink(inviteUrl, t('joinGame'))} style="flex:1">{t('share')}</button>
              )}
            </div>
            <button class="btn btn-primary btn-large" onClick={onStartGame}>
              {t('startGame')}
            </button>
          </div>
        )}
        {!isHost && (
          <p class="waiting-text">{t('waitingForHost')}</p>
        )}
        {error && <p class="error">{error}</p>}
      </div>
    </div>
  )
}
