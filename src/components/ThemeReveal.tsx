import type { Theme } from '@/types/game'
import { THEME_LABELS, THEME_COLORS } from '@/types/game'

interface ThemeRevealProps {
  theme: Theme
}

export function ThemeReveal({ theme }: ThemeRevealProps) {
  const color = THEME_COLORS[theme]
  return (
    <div class="theme-reveal" style={{ borderColor: color }}>
      <span class="theme-label" style={{ color }}>Theme</span>
      <span class="theme-name" style={{ color }}>{THEME_LABELS[theme]}</span>
    </div>
  )
}
