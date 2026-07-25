import { useState, useEffect, useRef } from 'preact/hooks'
import { WordDisplay } from '@/components/WordDisplay'
import { Keyboard } from '@/components/Keyboard'
import { GuessInput } from '@/components/GuessInput'
import { Timer } from '@/components/Timer'
import { ThemeReveal } from '@/components/ThemeReveal'
import type { GameState } from '@/types/game'
import { useT } from '@/i18n/context'

interface GameScreenProps {
  gameState: GameState
  playerId: string
  onLetterGuess: (letter: string) => void
  onWordGuess: (word: string) => void
  isSolo: boolean
}

export default function GameScreen({ gameState, playerId, onLetterGuess, onWordGuess, isSolo }: GameScreenProps) {
  const { t } = useT()
  const sortedPlayers = [...gameState.players].sort((a, b) => b.points - a.points)
  const isMyTurn = gameState.currentTurn === playerId
  const phase = gameState.phase
  const lang = gameState.config.language

  const onLetterGuessRef = useRef(onLetterGuess)
  onLetterGuessRef.current = onLetterGuess
  const guessedLettersRef = useRef(gameState.guessedLetters)
  guessedLettersRef.current = gameState.guessedLetters

  useEffect(() => {
    if (phase !== 'playing') return
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
  }, [phase, isMyTurn, isSolo])

  /* ====== Game Over ====== */
  if (phase === 'game_over') {
    const winner = sortedPlayers[0]
    return (
      <div class="page gameover-screen">
        <h1 class="title" style="font-size: 2rem">{t('gameOver')}</h1>
        <div class="card">
          {winner && (
            <div class="winner-announcement">
              <div class="trophy" style="font-size: 3rem; text-align: center">&#127942;</div>
              <h2>{winner.name} {t('wins')}</h2>
              <p>{winner.points} {t('pointsTotal')}</p>
            </div>
          )}
          <div class="final-standings">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} class={`standing-row ${i === 0 ? 'winner' : ''}`}>
                <span class="rank">#{i + 1}</span>
                <span class="name">{p.name}{p.id === playerId ? ` ${t('you')}` : ''}</span>
                <span class="score">{p.points} {t('pts')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ====== Round Intro ====== */
  if (phase === 'round_intro') {
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

  /* ====== Round End ====== */
  if (phase === 'round_end') {
    return (
      <div class="page round-end-page">
        <h2>{t('roundOver')}</h2>
        {gameState.roundWinner && (
          <p class="winner-announce">
            {gameState.players.find(p => p.id === gameState.roundWinner)?.name} {t('gotIt')}
          </p>
        )}
        <div class="answer-reveal">
          {t('theAnswerWas')} <strong>{gameState.currentWord}</strong>
        </div>
        <div class="scores-preview">
          {sortedPlayers.map(p => (
            <div key={p.id} class={`score-row ${p.id === playerId ? 'current' : ''}`}>
              <span class="name">{p.name}{p.id === playerId ? ` ${t('you')}` : ''}</span>
              <span class="points">{p.points} {t('pts')}</span>
            </div>
          ))}
        </div>
        <p class="next-hint">{t('nextRoundStarting')}</p>
      </div>
    )
  }

  /* ====== Playing ====== */
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
          <Timer turnEndsAt={gameState.turnEndsAt} isActive={phase === 'playing'} />
        )}
      </div>

      <div class="game-main">
        <div class="game-header">
          <span class="round-label">{t('roundOf', String(gameState.currentRound + 1), String(gameState.totalRounds))}</span>
          {gameState.theme && <ThemeReveal theme={gameState.theme} />}
        </div>

        <WordDisplay gameState={gameState} />

        {phase === 'playing' && (
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
        )}

        {!isMyTurn && !isSolo && phase === 'playing' && (
          <div class="waiting-turn">
            {t('waitingFor', gameState.players.find(p => p.id === gameState.currentTurn)?.name ?? '...')}
          </div>
        )}
      </div>
    </div>
  )
}
