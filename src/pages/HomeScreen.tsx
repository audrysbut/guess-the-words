import { useState, useEffect } from 'preact/hooks'

const STORAGE_KEY = 'wordweave-player-name'

interface HomeScreenProps {
  onStartSolo: (name: string) => void
  onCreateRoom: (name: string) => void
  onJoinRoom: (name: string, roomId: string) => void
  error?: string | null
  initialRoomId?: string
}

export default function HomeScreen({ onStartSolo, onCreateRoom, onJoinRoom, error, initialRoomId }: HomeScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')

  useEffect(() => {
    if (name) localStorage.setItem(STORAGE_KEY, name)
  }, [name])

  const handleNameChange = (e: Event) => {
    const val = (e.target as HTMLInputElement).value
    setName(val)
    localStorage.setItem(STORAGE_KEY, val)
  }

  const handleCreate = () => { if (name.trim()) onCreateRoom(name.trim()) }
  const handleJoin = () => { if (name.trim() && initialRoomId) onJoinRoom(name.trim(), initialRoomId) }
  const handleSolo = () => { if (name.trim()) onStartSolo(name.trim()) }

  if (initialRoomId) {
    return (
      <div class="page home-screen">
        <h1 class="title">WordWeave</h1>
        <p class="subtitle">Join Game</p>
        <div class="card">
          <label for="join-name">Your Name</label>
          <input
            id="join-name"
            type="text"
            value={name}
            onInput={handleNameChange}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
          />
          <button class="btn btn-accent" onClick={handleJoin} disabled={!name.trim()}>
            Join
          </button>
          {error && <p class="error">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div class="page home-screen">
      <h1 class="title">WordWeave</h1>
      <p class="subtitle">Guess the words, weave your way to victory!</p>
      <div class="card">
        <label for="menu-name">Your Name</label>
        <input
          id="menu-name"
          type="text"
          value={name}
          onInput={handleNameChange}
          placeholder="Enter your name"
          maxLength={20}
          autoFocus
        />
        <div class="btn-row">
          <button class="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            Create Game
          </button>
          <button class="btn btn-secondary" onClick={handleSolo} disabled={!name.trim()}>
            Solo Practice
          </button>
        </div>
        {error && <p class="error">{error}</p>}
      </div>
    </div>
  )
}
