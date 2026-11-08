import type { Player } from '@/types/game'
import { useT } from '@/i18n/context'
import { copyInviteLink, isShareSupported, shareInviteLink, isDesktop, shareQRCode } from '@/utils/share'
import QRCode from '@/components/QRCode'

import { useState } from 'preact/hooks'
import type { GameMode } from '@/types/game'

interface LobbyUIProps {
  players: Player[]
  isHost: boolean
  roomCode: string
  onStartGame: (mode: GameMode) => void
  error: string | null
}

export default function LobbyUI({ players, isHost, roomCode, onStartGame, error }: LobbyUIProps) {
  const { t } = useT()
  const [mode, setMode] = useState<GameMode>('classic')
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
            <div class="room-code-block">
              <span class="room-code-label">{t('roomCode')}</span>
              <span class="room-code-value">{roomCode}</span>
            </div>
            <input type="text" readOnly value={inviteUrl} class="invite-input" onClick={e => (e.target as HTMLInputElement).select()} />
            <div class="invite-row">
              <button class="btn btn-accent" onClick={() => copyInviteLink(inviteUrl)} style="flex:1">{t('copyLink')}</button>
            </div>
            <div class="invite-row">
              {isShareSupported() && (
                <button class="btn btn-primary" onClick={() => shareInviteLink(inviteUrl, t('joinGame'))} style="flex:1">{t('share')}</button>
              )}
              {isDesktop() && (
                <button class="btn btn-primary" onClick={() => shareQRCode(inviteUrl, t('joinGame'))} style="flex:1">{t('shareQr')}</button>
              )}
            </div>
            <div class="qr-block">
              <QRCode value={inviteUrl} size={180} />
              <p class="qr-caption">{t('scanToJoin')}</p>
            </div>
            <div class="mode-select" style="display:flex;align-items:center;gap:8px">
              <label>{t('gameMode')}</label>
              <select value={mode} onChange={e => setMode((e.target as HTMLSelectElement).value as GameMode)}>
                <option value="classic">{t('classicMode')}</option>
                <option value="custom">{t('customMode')}</option>
              </select>
            </div>
            <button class="btn btn-primary btn-large" onClick={() => onStartGame(mode)} disabled={mode === 'custom' && players.length < 2}>
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