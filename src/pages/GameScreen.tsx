import { useState } from 'preact/hooks'
import { WordDisplay } from '@/components/WordDisplay'
import { Keyboard } from '@/components/Keyboard'
import { GuessInput } from '@/components/GuessInput'
import { Timer } from '@/components/Timer'
import { ThemeReveal } from '@/components/ThemeReveal'
import type { GameState } from '@/types/game'

interface GameScreenProps {
  gameState: GameState
  playerId: string
  onLetterGuess: (letter: string) => void
  onWordGuess: (word: string) => void
  isSolo: boolean
}

export default function GameScreen({ gameState, playerId, onLetterGuess, onWordGuess, isSolo }: GameScreenProps) {
  const sortedPlayers = [...gameState.players].sort((a, b) => b.points - a.points)
  const isMyTurn = gameState.currentTurn === playerId
  const phase = gameState.phase

  /* ====== Game Over ====== */
  if (phase === 'game_over') {
    const winner = sortedPlayers[0]
    return (
      <div class="page gameover-screen">
        <h1 class="title" style="font-size: 2rem">Game Over!</h1>
        <div class="card">
          {winner && (
            <div class="winner-announcement">
              <div class="trophy" style="font-size: 3rem; text-align: center">&#127942;</div>
              <h2>{winner.name} wins!</h2>
              <p>{winner.points} points total</p>
            </div>
          )}
          <div class="final-standings">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} class={`standing-row ${i === 0 ? 'winner' : ''}`}>
                <span class="rank">#{i + 1}</span>
                <span class="name">{p.name}{p.id === playerId ? ' (You)' : ''}</span>
                <span class="score">{p.points} pts</span>
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
        <div class="round-number">Round {gameState.currentRound + 1} of {gameState.totalRounds}</div>
        {gameState.theme && <ThemeReveal theme={gameState.theme} />}
        <div class="intro-word-preview">
          <WordDisplay gameState={gameState} />
        </div>
        <div class="intro-hint">Get ready...</div>
      </div>
    )
  }

  /* ====== Round End ====== */
  if (phase === 'round_end') {
    return (
      <div class="page round-end-page">
        <h2>Round Over!</h2>
        {gameState.roundWinner && (
          <p class="winner-announce">
            {gameState.players.find(p => p.id === gameState.roundWinner)?.name} got it!
          </p>
        )}
        <div class="answer-reveal">
          The answer was: <strong>{gameState.currentWord}</strong>
        </div>
        <div class="scores-preview">
          {sortedPlayers.map(p => (
            <div key={p.id} class={`score-row ${p.id === playerId ? 'current' : ''}`}>
              <span class="name">{p.name}{p.id === playerId ? ' (You)' : ''}</span>
              <span class="points">{p.points} pts</span>
            </div>
          ))}
        </div>
        <p class="next-hint">Next round starting...</p>
      </div>
    )
  }

  /* ====== Playing ====== */
  return (
    <div class="page game-page">
      <div class="game-sidebar">
        {sortedPlayers.map(p => (
          <div key={p.id} class={`player-item ${p.id === gameState.currentTurn ? 'active-turn' : ''} ${p.id === playerId ? 'me' : ''}`}>
            <span class="player-name">
              {p.name}{p.id === playerId ? ' (You)' : ''}
            </span>
            <span class="player-score">{p.points} pts</span>
          </div>
        ))}
        {!isSolo && (
          <Timer turnEndsAt={gameState.turnEndsAt} isActive={phase === 'playing'} />
        )}
      </div>

      <div class="game-main">
        <div class="game-header">
          <span class="round-label">Round {gameState.currentRound + 1}/{gameState.totalRounds}</span>
          {gameState.theme && <ThemeReveal theme={gameState.theme} />}
        </div>

        <WordDisplay gameState={gameState} />

        {phase === 'playing' && (
          <div class="game-inputs">
            <Keyboard
              guessedLetters={gameState.guessedLetters}
              disabled={!isMyTurn && !isSolo}
              onGuess={onLetterGuess}
            />
            <GuessInput
              disabled={!isMyTurn && !isSolo}
              onGuess={onWordGuess}
            />
          </div>
        )}

        {!isMyTurn && !isSolo && phase === 'playing' && (
          <div class="waiting-turn">
            Waiting for {gameState.players.find(p => p.id === gameState.currentTurn)?.name ?? 'next player'}...
          </div>
        )}
      </div>
    </div>
  )
}
