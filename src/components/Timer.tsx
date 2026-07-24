import { useState, useEffect } from 'preact/hooks'
import { useT } from '@/i18n/context'

interface TimerProps {
  turnEndsAt: number | null
  isActive: boolean
}

export function Timer({ turnEndsAt, isActive }: TimerProps) {
  const [remaining, setRemaining] = useState(0)
  const { t } = useT()

  useEffect(() => {
    if (!isActive || !turnEndsAt) {
      setRemaining(0)
      return
    }

    const tick = () => {
      const r = Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000))
      setRemaining(r)
    }

    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [turnEndsAt, isActive])

  if (!isActive || !turnEndsAt) return null

  const pct = remaining / 30 * 100
  const urgent = remaining <= 5

  return (
    <div class={`timer ${urgent ? 'urgent' : ''}`}>
      <div class="timer-bar" style={{ width: `${pct}%` }} />
      <span class="timer-text">{remaining}{t('seconds')}</span>
    </div>
  )
}
