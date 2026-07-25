import { useState } from 'preact/hooks'
import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'

interface LobbyProps {
  players: Player[]
  isHost: boolean
  roomId: string
  onStartGame: () => void
  error?: string | null
}

export default function Lobby({ players, isHost, roomId, onStartGame, error }: LobbyProps) {
  const { t } = useT()
  const inviteUrl = `${window.location.origin}/guess-the-words/?room=${roomId}`

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
      </div>
    </div>
  )
}
