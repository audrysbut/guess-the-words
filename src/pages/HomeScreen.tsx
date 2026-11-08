import { useState, useEffect } from 'preact/hooks'
import type { Language } from '@/types/game'
import { useT } from '@/i18n/context'
import JoinScreen from './JoinScreen'
import MenuScreen from './MenuScreen'

const STORAGE_KEY = 'guess-the-words-player-name'

interface HomeScreenProps {
  onStartSolo: (name: string) => void
  onCreateRoom: (name: string) => void
  onJoinRoom: (name: string, roomId: string) => void
  error?: string | null
  initialRoomId?: string
  lang: Language
  onToggleLang: () => void
}

export default function HomeScreen({ onStartSolo, onCreateRoom, onJoinRoom, error, initialRoomId, lang, onToggleLang }: HomeScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [joinMode, setJoinMode] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const { t } = useT()

  useEffect(() => {
    if (name) localStorage.setItem(STORAGE_KEY, name)
  }, [name])

  const handleNameChange = (e: Event) => {
    const val = (e.target as HTMLInputElement).value
    setName(val)
    localStorage.setItem(STORAGE_KEY, val)
  }

  const handleRoomCodeChange = (e: Event) => {
    const val = (e.target as HTMLInputElement).value.toUpperCase()
    setRoomCode(val)
  }

  const handleCreate = () => { if (name.trim()) onCreateRoom(name.trim()) }
  const handleSolo = () => { if (name.trim()) onStartSolo(name.trim()) }
  const handleJoin = () => {
    if (!name.trim()) return
    const code = (initialRoomId || roomCode).trim()
    if (!code) return
    onJoinRoom(name.trim(), code)
  }

  const showJoinScreen = !!initialRoomId || joinMode

  return (
    <div class="page home-screen">
      <button class="lang-switcher" onClick={onToggleLang} title={t('switchLanguage')}>
        {lang === 'lt' ? 'EN' : 'LT'}
      </button>
      <h1 class="title">{t('title')}</h1>

      {showJoinScreen ? (
        <JoinScreen
          name={name}
          onNameChange={handleNameChange}
          roomCode={initialRoomId || roomCode}
          onRoomCodeChange={handleRoomCodeChange}
          onJoin={handleJoin}
          error={error}
          showRoomCode={!initialRoomId}
        />
      ) : (
        <MenuScreen
          name={name}
          onNameChange={handleNameChange}
          onCreate={handleCreate}
          onSolo={handleSolo}
          onJoinWithCode={() => setJoinMode(true)}
          error={error}
        />
      )}
    </div>
  )
}