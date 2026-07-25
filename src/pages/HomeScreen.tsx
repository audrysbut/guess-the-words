import { useState, useEffect } from 'preact/hooks'
import type { Language } from '@/types/game'
import { useT } from '@/i18n/context'

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

  const langSwitcher = (
    <button class="lang-switcher" onClick={onToggleLang} title={t('switchLanguage')}>
      {lang === 'lt' ? 'EN' : 'LT'}
    </button>
  )

  if (initialRoomId) {
    return (
      <div class="page home-screen">
        {langSwitcher}
        <h1 class="title">{t('title')}</h1>
        <p class="subtitle">{t('joinGame')}</p>
        <div class="card">
          <label for="join-name">{t('yourName')}</label>
          <input
            id="join-name"
            type="text"
            value={name}
            onInput={handleNameChange}
            placeholder={t('enterYourName')}
            maxLength={20}
            autoFocus
          />
          <button class="btn btn-accent" onClick={handleJoin} disabled={!name.trim()}>
            {t('join')}
          </button>
          {error && <p class="error">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div class="page home-screen">
      {langSwitcher}
      <h1 class="title">{t('title')}</h1>
      <p class="subtitle">{t('subtitle')}</p>
      <div class="card">
        <label for="menu-name">{t('yourName')}</label>
        <input
          id="menu-name"
          type="text"
          value={name}
          onInput={handleNameChange}
          placeholder={t('enterYourName')}
          maxLength={20}
          autoFocus
        />
        <div class="btn-row">
          <button class="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            {t('createGame')}
          </button>
          <button class="btn btn-secondary" onClick={handleSolo} disabled={!name.trim()}>
            {t('soloPractice')}
          </button>
        </div>
        {error && <p class="error">{error}</p>}
      </div>
    </div>
  )
}
