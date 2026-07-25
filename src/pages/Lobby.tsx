import { useEffect, useRef, useState } from 'preact/hooks'
import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'

const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window

interface LobbyProps {
  players: Player[]
  isHost: boolean
  roomId: string
  onStartGame: () => void
  error?: string | null
}

function NfcIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      <path d="M7.5 15.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM15 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" opacity="0.5"/>
    </svg>
  )
}

export default function Lobby({ players, isHost, roomId, onStartGame, error }: LobbyProps) {
  const { t } = useT()
  const inviteUrl = `${window.location.origin}/guess-the-words/?room=${roomId}`
  const [nfcActive, setNfcActive] = useState(false)
  const nfcActiveRef = useRef(false)

  useEffect(() => {
    if (!isNfcSupported || !isHost) return

    let cancelled = false

    const startNfcWrite = async () => {
      while (!cancelled) {
        try {
          const reader = new NDEFReader()
          await reader.write({
            records: [
              { recordType: 'url', data: inviteUrl },
              { recordType: 'text', data: inviteUrl },
            ],
          })
          if (cancelled) break
          setNfcActive(true)
        } catch {
          if (cancelled) break
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }

    startNfcWrite()

    return () => {
      cancelled = true
      nfcActiveRef.current = false
    }
  }, [inviteUrl, isHost])

  const shareLink = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'Atspėk Žodžius',
        text: t('joinGame'),
        url: inviteUrl,
      })
    } catch {
      // user cancelled
    }
  }

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
            <div class="invite-row">
              <input type="text" readOnly value={inviteUrl} class="invite-input" onClick={e => (e.target as HTMLInputElement).select()} />
              <button class="btn btn-accent" onClick={copyLink}>{t('copyLink')}</button>
              {typeof navigator.share === 'function' && (
                <button class="btn btn-primary" onClick={shareLink}>{t('share')}</button>
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
        {isNfcSupported && isHost && (
          <div class={`nfc-indicator ${nfcActive ? 'active' : ''}`} title={t('nfcActive')}>
            <NfcIcon />
            <span>{t('nfcActive')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
