import { WordDisplay } from '@/components/WordDisplay'
import { ThemeReveal } from '@/components/ThemeReveal'
import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface RoundIntroScreenProps {
  gameState: GameState
}

export default function RoundIntroScreen({ gameState }: RoundIntroScreenProps) {
  const { t } = useT()

  return (
    <div class="page round-intro">
      <div class="round-number">{t('roundOf', String(gameState.currentRound + 1), String(gameState.totalRounds))}</div>
      {gameState.theme && <ThemeReveal theme={gameState.theme} />}
      <div class="intro-word-preview">
        <WordDisplay gameState={gameState} />
      </div>
      <div class="intro-hint">{t('getReady')}</div>
    </div>
  )
}
