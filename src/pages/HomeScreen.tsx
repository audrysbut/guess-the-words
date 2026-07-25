import { useState, useEffect, useRef } from 'preact/hooks'
import type { Language } from '@/types/game'
import { useT } from '@/i18n/context'

const STORAGE_KEY = 'guess-the-words-player-name'
const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window

interface HomeScreenProps {
  onStartSolo: (name: string) => void
  onCreateRoom: (name: string) => void
  onJoinRoom: (name: string, roomId: string) => void
  onNfcRoomDetected: (roomId: string) => void
  error?: string | null
  initialRoomId?: string
  lang: Language
  onToggleLang: () => void
}

function NfcIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      <path d="M7.5 15.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM15 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" opacity="0.5"/>
    </svg>
  )
}

export default function HomeScreen({ onStartSolo, onCreateRoom, onJoinRoom, onNfcRoomDetected, error, initialRoomId, lang, onToggleLang }: HomeScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [nfcActive, setNfcActive] = useState(false)
  const nfcReaderRef = useRef<NDEFReader | null>(null)
  const { t } = useT()

  useEffect(() => {
    if (name) localStorage.setItem(STORAGE_KEY, name)
  }, [name])

  useEffect(() => {
    if (!isNfcSupported || initialRoomId) return

    let cancelled = false

    const startNfcScan = async () => {
      try {
        const reader = new NDEFReader()
        nfcReaderRef.current = reader

        reader.addEventListener('reading', (event: NDEFReadingEvent) => {
          if (cancelled) return

          let detectedUrl: string | null = null

          for (const record of event.message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder()
              detectedUrl = decoder.decode(record.data)
              break
            }
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8')
              const text = decoder.decode(record.data)
              if (text.includes('?room=')) {
                detectedUrl = text
                break
              }
            }
          }

          if (!detectedUrl) return

          try {
            const url = new URL(detectedUrl)
            const roomId = url.searchParams.get('room')
            if (roomId) {
              onNfcRoomDetected(roomId)
            }
          } catch {
            const match = detectedUrl.match(/[?&]room=([A-Za-z0-9]+)/)
            if (match) {
              onNfcRoomDetected(match[1])
            }
          }
        })

        await reader.scan()

        if (cancelled) return
        setNfcActive(true)
      } catch {
        // NFC permission denied or unavailable — fail silently
      }
    }

    startNfcScan()

    return () => {
      cancelled = true
      nfcReaderRef.current = null
    }
  }, [initialRoomId, onNfcRoomDetected])

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

  const nfcIndicator = isNfcSupported && !initialRoomId && (
    <div class={`nfc-indicator ${nfcActive ? 'active' : ''}`} title={t('nfcActive')}>
      <NfcIcon />
      <span>{t('nfcActive')}</span>
    </div>
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
      {nfcIndicator}
    </div>
  )
}
