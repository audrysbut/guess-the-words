import { useT } from '@/i18n/context'

interface JoinScreenProps {
  name: string
  onNameChange: (e: Event) => void
  roomCode?: string
  onRoomCodeChange?: (e: Event) => void
  onJoin: () => void
  error?: string | null
  showRoomCode?: boolean
}

export default function JoinScreen({ name, onNameChange, roomCode, onRoomCodeChange, onJoin, error, showRoomCode }: JoinScreenProps) {
  const { t } = useT()

  return (
    <div class="card">
      <p class="subtitle">{t('joinGame')}</p>
      <label for="join-name">{t('yourName')}</label>
      <input
        id="join-name"
        type="text"
        value={name}
        onInput={onNameChange}
        placeholder={t('enterYourName')}
        maxLength={20}
        autoFocus
      />
      {showRoomCode && (
        <>
          <label for="join-code">{t('enterRoomCode')}</label>
          <input
            id="join-code"
            type="text"
            value={roomCode ?? ''}
            onInput={onRoomCodeChange}
            placeholder={t('enterRoomCode')}
            maxLength={8}
            style="text-transform: uppercase; letter-spacing: 2px; text-align: center;"
          />
        </>
      )}
      <button class="btn btn-accent" onClick={onJoin} disabled={!name.trim() || (showRoomCode && !(roomCode ?? '').trim())}>
        {t('join')}
      </button>
      {error && <p class="error">{error}</p>}
    </div>
  )
}