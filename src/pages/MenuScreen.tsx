import { useT } from '@/i18n/context'

interface MenuScreenProps {
  name: string
  onNameChange: (e: Event) => void
  onCreate: () => void
  onSolo: () => void
  error?: string | null
}

export default function MenuScreen({ name, onNameChange, onCreate, onSolo, error }: MenuScreenProps) {
  const { t } = useT()

  return (
    <div class="card">
      <p class="subtitle">{t('subtitle')}</p>
      <label for="menu-name">{t('yourName')}</label>
      <input
        id="menu-name"
        type="text"
        value={name}
        onInput={onNameChange}
        placeholder={t('enterYourName')}
        maxLength={20}
        autoFocus
      />
      <div class="btn-row">
        <button class="btn btn-primary" onClick={onCreate} disabled={!name.trim()}>
          {t('createGame')}
        </button>
        <button class="btn btn-secondary" onClick={onSolo} disabled={!name.trim()}>
          {t('soloPractice')}
        </button>
      </div>
      {error && <p class="error">{error}</p>}
    </div>
  )
}
