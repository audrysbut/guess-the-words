import { useState } from 'preact/hooks'
import { page, localPlayerName, roomCode, localPlayerId, isHost, error, resetStore, lobbyConfig } from '@/store/game-store'
import { PeerManager } from '@/webrtc/peer-manager'
import type { GameState } from '@/types/game'
import type { Message } from '@/types/messages'

interface HomeProps {
  onPeerReady: (manager: PeerManager, state: GameState | null) => void
}

export function Home({ onPeerReady }: HomeProps) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setErr(null)
    resetStore()

    try {
      const manager = new PeerManager()
      const config = { ...lobbyConfig.value }
      const { roomCode: code, state } = await manager.createRoom(name.trim(), config)

      localPlayerName.value = name.trim()
      roomCode.value = code
      localPlayerId.value = state.players[0].id
      isHost.value = true

      page.value = 'lobby'
      onPeerReady(manager, state)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !joinCode.trim()) return
    setLoading(true)
    setErr(null)
    resetStore()

    try {
      const manager = new PeerManager()
      const { playerId } = await manager.joinRoom(joinCode.trim().toUpperCase(), name.trim())

      localPlayerName.value = name.trim()
      roomCode.value = joinCode.trim().toUpperCase()
      localPlayerId.value = playerId
      isHost.value = false

      page.value = 'lobby'
      onPeerReady(manager, null)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="page home">
      <div class="home-content">
        <h1 class="title">WordWeave</h1>
        <p class="subtitle">A multiplayer word guessing game</p>

        <div class="name-input">
          <input
            type="text"
            value={name}
            onInput={e => setName((e.target as HTMLInputElement).value)}
            placeholder="Your name"
            maxLength={20}
            disabled={loading}
          />
        </div>

        {err && <div class="error">{err}</div>}

        <div class="home-actions">
          <button class="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>

          <div class="join-section">
            <div class="divider"><span>or</span></div>
            <input
              type="text"
              value={joinCode}
              onInput={e => setJoinCode((e.target as HTMLInputElement).value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              disabled={loading}
              class="code-input"
            />
            <button class="btn btn-secondary" onClick={handleJoin} disabled={loading || !name.trim() || !joinCode.trim()}>
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
