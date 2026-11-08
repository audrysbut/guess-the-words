import { useState } from 'preact/hooks'
import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface PickingScreenProps {
  gameState: GameState
  playerId: string
  onPickWord: (word: string) => void
}

export default function PickingScreen({ gameState, playerId, onPickWord }: PickingScreenProps) {
  const { t } = useT()
  const [value, setValue] = useState('')
  const picker = gameState.players.find(p => p.id === gameState.pickerId)
  const isPicker = playerId === gameState.pickerId

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    if (!/^[\p{L}\s]+$/u.test(trimmed)) return
    onPickWord(trimmed)
    setValue('')
  }

  if (isPicker) {
    return (
      <div class="page picking-screen">
        <h2>{t('pickWordTitle')}</h2>
        <p>{t('youArePicking')}</p>
        <form class="guess-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onInput={(e) => setValue((e.target as HTMLInputElement).value)}
            placeholder={t('enterWord')}
            autoFocus
          />
          <button type="submit" disabled={!value.trim()}>{t('submitWord')}</button>
        </form>
      </div>
    )
  }

  return (
    <div class="page picking-screen">
      <h2>{t('pickWordTitle')}</h2>
      <p>{t('waitingForPicker', picker?.name ?? '...')}</p>
    </div>
  )
}