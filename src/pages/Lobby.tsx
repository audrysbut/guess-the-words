import type { Player } from '@/types/game'

interface LobbyProps {
  players: Player[]
  isHost: boolean
  roomId: string
  onStartGame: () => void
  error?: string | null
}

export default function Lobby({ players, isHost, roomId, onStartGame, error }: LobbyProps) {
  const inviteUrl = `${window.location.origin}/guess-the-words/?room=${roomId}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
  }

  return (
    <div class="page lobby-screen">
      <h1 class="title" style="font-size: 1.8rem">WordWeave</h1>
      <div class="card">
        <h2>Lobby</h2>
        <p class="player-count">{players.length} player{players.length !== 1 ? 's' : ''} joined</p>
        <div class="player-list">
          {players.map(p => (
            <div key={p.id} class={`player-item ${p.isHost ? 'host' : ''}`}>
              <span class="player-dot" />
              <span class="player-name">{p.name}</span>
              {p.isHost && <span class="host-badge">Host</span>}
            </div>
          ))}
        </div>
        {isHost && (
          <div class="lobby-actions">
            <div class="invite-row">
              <input type="text" readOnly value={inviteUrl} class="invite-input" onClick={e => (e.target as HTMLInputElement).select()} />
              <button class="btn btn-accent" onClick={copyLink}>Copy Link</button>
            </div>
            <button class="btn btn-primary btn-large" onClick={onStartGame}>
              Start Game
            </button>
          </div>
        )}
        {!isHost && (
          <p class="waiting-text">Waiting for host to start the game...</p>
        )}
        {error && <p class="error">{error}</p>}
      </div>
    </div>
  )
}
