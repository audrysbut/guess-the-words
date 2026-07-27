import { useT } from '@/i18n/context'

interface JoinScreenProps {
  name: string
  onNameChange: (e: Event) => void
  onJoin: () => void
  error?: string | null
}

export default function JoinScreen({ name, onNameChange, onJoin, error }: JoinScreenProps) {
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
      <button class="btn btn-accent" onClick={onJoin} disabled={!name.trim()}>
        {t('join')}
      </button>
      {error && <p class="error">{error}</p>}
    </div>
  )
}
