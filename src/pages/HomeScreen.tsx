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
  const { t } = useT()

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

  return (
    <div class="page home-screen">
      <button class="lang-switcher" onClick={onToggleLang} title={t('switchLanguage')}>
        {lang === 'lt' ? 'EN' : 'LT'}
      </button>
      <h1 class="title">{t('title')}</h1>

      {initialRoomId ? (
        <JoinScreen
          name={name}
          onNameChange={handleNameChange}
          onJoin={handleJoin}
          error={error}
        />
      ) : (
        <MenuScreen
          name={name}
          onNameChange={handleNameChange}
          onCreate={handleCreate}
          onSolo={handleSolo}
          error={error}
        />
      )}
    </div>
  )
}
