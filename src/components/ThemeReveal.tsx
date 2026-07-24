import type { Theme } from '@/types/game'
import { THEME_COLORS } from '@/types/game'
import { useT } from '@/i18n/context'

const themeKeyMap: Record<Theme, 'movies' | 'actors' | 'famousPeople' | 'books' | 'fictionalCharacters' | 'videoGames'> = {
  movies: 'movies',
  actors: 'actors',
  famous_people: 'famousPeople',
  books: 'books',
  fictional_characters: 'fictionalCharacters',
  video_games: 'videoGames',
}

interface ThemeRevealProps {
  theme: Theme
}

export function ThemeReveal({ theme }: ThemeRevealProps) {
  const { t } = useT()
  const color = THEME_COLORS[theme]
  return (
    <div class="theme-reveal" style={{ borderColor: color }}>
      <span class="theme-label" style={{ color }}>{t('theme')}</span>
      <span class="theme-name" style={{ color }}>{t(themeKeyMap[theme])}</span>
    </div>
  )
}
