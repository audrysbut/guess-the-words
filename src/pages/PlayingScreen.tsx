import { useEffect, useRef } from 'preact/hooks'
import { WordDisplay } from '@/components/WordDisplay'
import { Keyboard } from '@/components/Keyboard'
import { GuessInput } from '@/components/GuessInput'
import { Timer } from '@/components/Timer'
import { ThemeReveal } from '@/components/ThemeReveal'
import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface PlayingScreenProps {
  gameState: GameState
  playerId: string
  onLetterGuess: (letter: string) => void
  onWordGuess: (word: string) => void
  isSolo: boolean
}

export default function PlayingScreen({ gameState, playerId, onLetterGuess, onWordGuess, isSolo }: PlayingScreenProps) {
  const { t } = useT()
  const sortedPlayers = [...gameState.players].sort((a, b) => b.points - a.points)
  const isMyTurn = gameState.currentTurn === playerId
  const lang = gameState.config.language

  const onLetterGuessRef = useRef(onLetterGuess)
  onLetterGuessRef.current = onLetterGuess
  const guessedLettersRef = useRef(gameState.guessedLetters)
  guessedLettersRef.current = gameState.guessedLetters

  useEffect(() => {
    if (!isMyTurn && !isSolo) return

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key.length !== 1) return
      if (!/\p{L}/u.test(e.key)) return

      const letter = e.key.toUpperCase()
      const guessed = new Set(guessedLettersRef.current.map(l => l.toUpperCase()))
      if (guessed.has(letter)) return

      e.preventDefault()
      onLetterGuessRef.current(letter)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMyTurn, isSolo])

  return (
    <div class="page game-page">
      <div class="game-sidebar">
        <div class="scoreboard-table">
          <div class="sb-header">
            <span class="sb-col-player">{t('player')}</span>
            <span class="sb-col-pts">{t('pts')}</span>
          </div>
          {sortedPlayers.map(p => {
            const isTurn = p.id === gameState.currentTurn
            return (
              <div key={p.id} class={`sb-row ${isTurn ? 'active-turn' : ''} ${p.id === playerId ? 'me' : ''}`}>
                <span class="sb-col-player">
                  {p.name}{p.id === playerId ? ` ${t('you')}` : ''}
                </span>
                <span class="sb-col-pts">{p.points}</span>
              </div>
            )
          })}
        </div>
        {!isSolo && (
          <Timer turnEndsAt={gameState.turnEndsAt} isActive={true} />
        )}
      </div>

      <div class="game-main">
        <div class="game-header">
          <span class="round-label">{t('roundOf', String(gameState.currentRound + 1), String(gameState.totalRounds))}</span>
          {gameState.theme && <ThemeReveal theme={gameState.theme} />}
        </div>

        <WordDisplay gameState={gameState} />

        <div class="game-inputs">
          <Keyboard
            guessedLetters={gameState.guessedLetters}
            disabled={!isMyTurn && !isSolo}
            onGuess={onLetterGuess}
            lang={lang}
          />
          <GuessInput
            disabled={!isMyTurn && !isSolo}
            onGuess={onWordGuess}
          />
        </div>

        {!isMyTurn && !isSolo && (
          <div class="waiting-turn">
            {t('waitingFor', gameState.players.find(p => p.id === gameState.currentTurn)?.name ?? '...')}
          </div>
        )}
      </div>
    </div>
  )
}
