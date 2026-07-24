import { useEffect, useRef, useState } from 'preact/hooks'
import {
  page, gameState, localPlayerId, isHost,
  localPlayers,
} from '@/store/game-store'
import { PeerManager } from '@/webrtc/peer-manager'
import { WordDisplay } from '@/components/WordDisplay'
import { Keyboard } from '@/components/Keyboard'
import { GuessInput } from '@/components/GuessInput'
import { Timer } from '@/components/Timer'
import { PlayerList } from '@/components/PlayerList'
import { ThemeReveal } from '@/components/ThemeReveal'
import { GuessResult } from '@/components/GuessResult'
import { selectWordsForGame } from '@/data/words'
import type { GameState, GuessResult as GuessResultType, WordEntry } from '@/types/game'
import type { Message } from '@/types/messages'

interface GameProps {
  manager: PeerManager
}

export function Game({ manager }: GameProps) {
  const [roundIntro, setRoundIntro] = useState(false)
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wordListRef = useRef<WordEntry[]>([])

  useEffect(() => {
    const gs = gameState.value
    if (!gs) return

    if (manager.isHost && wordListRef.current.length === 0) {
      wordListRef.current = selectWordsForGame(gs.config.themes, gs.config.totalRounds)
    }

    if (gs.phase === 'round_intro') {
      setRoundIntro(true)
      if (manager.isHost) {
        const timer = setTimeout(() => advanceToPlaying(gs), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  useEffect(() => {
    manager.onMessage((message: Message, _senderId: string) => {
      if (message.type === 'guess_letter' && manager.isHost) {
        handleLetterGuess(message.letter)
      }
      if (message.type === 'guess_word' && manager.isHost) {
        handleWordGuess(message.word)
      }
      if (message.type === 'state_sync') {
        const sync = message.state
        gameState.value = sync
        localPlayers.value = sync.players

        if (sync.phase === 'round_intro') {
          setRoundIntro(true)
        }
        if (sync.phase === 'playing') {
          setRoundIntro(false)
        }
        if (sync.phase === 'game_over') {
          setRoundIntro(false)
          page.value = 'results'
        }
      }
    })

    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
      if (roundEndTimerRef.current) clearTimeout(roundEndTimerRef.current)
    }
  }, [])

  function advanceToPlaying(gs: GameState) {
    const firstPlayer = gs.players.find(p => !p.isHost) ?? gs.players[0]
    const updated: GameState = {
      ...gs,
      phase: 'playing',
      currentTurn: firstPlayer.id,
      turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      lastGuessResult: null,
    }
    gameState.value = updated
    setRoundIntro(false)
    if (manager.isHost) {
      manager.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }
  }

  function startTurnTimer(gs: GameState) {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    turnTimerRef.current = setTimeout(() => {
      const current = gameState.value
      if (!current || current.phase !== 'playing') return
      const nextTurn = getNextPlayer(current)
      const updated: GameState = {
        ...current,
        currentTurn: nextTurn,
        turnEndsAt: Date.now() + current.config.timeLimit * 1000,
        lastGuessResult: null,
      }
      gameState.value = updated
      manager.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
    }, gs.config.timeLimit * 1000)
  }

  function handleLetterGuess(letter: string) {
    if (!manager.isHost) return
    const gs = gameState.value
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const lower = letter.toLowerCase()
    if (gs.guessedLetters.includes(lower)) return

    const newGuessed = [...gs.guessedLetters, lower]
    const wordLower = gs.currentWord.toLowerCase()
    const correct = wordLower.includes(lower)

    let newRevealedTokens = [...gs.revealedTokens]

    if (correct) {
      for (let ti = 0; ti < gs.currentTokens.length; ti++) {
        if (newRevealedTokens[ti]) continue
        const tokenLower = gs.currentTokens[ti].toLowerCase()
        if ([...tokenLower].every(c => !/[a-zA-Z]/.test(c) || newGuessed.includes(c))) {
          newRevealedTokens[ti] = true
        }
      }
    }

    const allRevealed = newRevealedTokens.every(Boolean)
    const result: GuessResultType = {
      playerId: gs.currentTurn,
      type: 'letter',
      value: letter,
      correct,
      pointsAwarded: correct ? 1 : 0,
    }
    const newScores = { ...gs.scores }
    if (correct) {
      newScores[gs.currentTurn] = (newScores[gs.currentTurn] || 0) + 1
    }
    const updatedPlayers = gs.players.map(p => ({
      ...p,
      points: newScores[p.id] || 0,
    }))

    if (allRevealed) {
      const finalState: GameState = {
        ...gs,
        guessedLetters: newGuessed,
        revealedTokens: newRevealedTokens,
        scores: newScores,
        players: updatedPlayers,
        phase: 'round_end',
        roundWinner: gs.currentTurn,
        currentTurn: '',
        turnEndsAt: null,
        lastGuessResult: result,
      }
      gameState.value = finalState
      manager.send({ type: 'state_sync', state: finalState })
      scheduleRoundEnd(finalState)
      return
    }

    const nextTurn = correct ? gs.currentTurn : getNextPlayer(gs)
    const updated: GameState = {
      ...gs,
      guessedLetters: newGuessed,
      revealedTokens: newRevealedTokens,
      scores: newScores,
      players: updatedPlayers,
      currentTurn: nextTurn,
      turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      lastGuessResult: result,
    }
    gameState.value = updated
    manager.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }

  function handleWordGuess(word: string) {
    if (!manager.isHost) return
    const gs = gameState.value
    if (!gs || gs.phase !== 'playing') return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)

    const wordLower = word.toLowerCase()
    const gsWordLower = gs.currentWord.toLowerCase()
    const isFullAnswer = wordLower === gsWordLower
    const tokenIndex = gs.currentTokens.findIndex(
      (t, i) => !gs.revealedTokens[i] && t.toLowerCase() === wordLower
    )

    const resultCorrect = isFullAnswer || tokenIndex !== -1
    const result: GuessResultType = {
      playerId: gs.currentTurn,
      type: 'word',
      value: word,
      correct: resultCorrect,
      pointsAwarded: resultCorrect ? 10 : 0,
    }

    if (isFullAnswer) {
      const newRevealed = gs.currentTokens.map(() => true)
      const newScores = { ...gs.scores }
      newScores[gs.currentTurn] = (newScores[gs.currentTurn] || 0) + 10
      const updatedPlayers = gs.players.map(p => ({
        ...p,
        points: newScores[p.id] || 0,
      }))
      const finalState: GameState = {
        ...gs,
        revealedTokens: newRevealed,
        scores: newScores,
        players: updatedPlayers,
        phase: 'round_end',
        roundWinner: gs.currentTurn,
        currentTurn: '',
        turnEndsAt: null,
        lastGuessResult: result,
      }
      gameState.value = finalState
      manager.send({ type: 'state_sync', state: finalState })
      scheduleRoundEnd(finalState)
      return
    }

    if (tokenIndex !== -1) {
      const newRevealed = [...gs.revealedTokens]
      newRevealed[tokenIndex] = true
      const allRevealed = newRevealed.every(Boolean)
      const newScores = { ...gs.scores }
      newScores[gs.currentTurn] = (newScores[gs.currentTurn] || 0) + 10
      const updatedPlayers = gs.players.map(p => ({
        ...p,
        points: newScores[p.id] || 0,
      }))

      if (allRevealed) {
        const finalState: GameState = {
          ...gs,
          revealedTokens: newRevealed,
          scores: newScores,
          players: updatedPlayers,
          phase: 'round_end',
          roundWinner: gs.currentTurn,
          currentTurn: '',
          turnEndsAt: null,
          lastGuessResult: result,
        }
        gameState.value = finalState
        manager.send({ type: 'state_sync', state: finalState })
        scheduleRoundEnd(finalState)
        return
      }

      const updated: GameState = {
        ...gs,
        revealedTokens: newRevealed,
        scores: newScores,
        players: updatedPlayers,
        currentTurn: gs.currentTurn,
        turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
        lastGuessResult: result,
      }
      gameState.value = updated
      manager.send({ type: 'state_sync', state: updated })
      startTurnTimer(updated)
      return
    }

    const nextTurn = getNextPlayer(gs)
    const updated: GameState = {
      ...gs,
      currentTurn: nextTurn,
      turnEndsAt: Date.now() + gs.config.timeLimit * 1000,
      lastGuessResult: result,
    }
    gameState.value = updated
    manager.send({ type: 'state_sync', state: updated })
    startTurnTimer(updated)
  }

  function scheduleRoundEnd(gs: GameState) {
    if (roundEndTimerRef.current) clearTimeout(roundEndTimerRef.current)
    roundEndTimerRef.current = setTimeout(() => advanceRound(gs), 4000)
  }

  function advanceRound(current: GameState) {
    const nextRound = current.currentRound + 1
    if (nextRound >= current.totalRounds) {
      const final: GameState = {
        ...current,
        phase: 'game_over',
        currentTurn: '',
        turnEndsAt: null,
        lastGuessResult: null,
      }
      gameState.value = final
      if (manager.isHost) {
        manager.send({ type: 'state_sync', state: final })
      }
      page.value = 'results'
      return
    }

    const nextWord = wordListRef.current[nextRound]
    if (!nextWord) {
      const final: GameState = {
        ...current,
        phase: 'game_over',
        currentTurn: '',
        turnEndsAt: null,
        lastGuessResult: null,
      }
      gameState.value = final
      if (manager.isHost) {
        manager.send({ type: 'state_sync', state: final })
      }
      page.value = 'results'
      return
    }

    const newState: GameState = {
      ...current,
      phase: 'round_intro',
      currentRound: nextRound,
      currentWord: nextWord.answer,
      currentTokens: nextWord.tokens,
      revealedTokens: nextWord.tokens.map(() => false),
      guessedLetters: [],
      theme: nextWord.theme,
      roundWinner: null,
      currentTurn: '',
      turnEndsAt: null,
      lastGuessResult: null,
    }
    gameState.value = newState
    if (manager.isHost) {
      manager.send({ type: 'state_sync', state: newState })
      setTimeout(() => advanceToPlaying(newState), 3000)
    }
  }

  function getNextPlayer(gs: GameState): string {
    const currentIdx = gs.players.findIndex(p => p.id === gs.currentTurn)
    if (currentIdx === -1) return gs.players[0].id
    return gs.players[(currentIdx + 1) % gs.players.length].id
  }

  const handleLocalLetterGuess = (letter: string) => {
    if (manager.isHost) {
      handleLetterGuess(letter)
    } else {
      manager.send({ type: 'guess_letter', playerId: localPlayerId.value, letter })
    }
  }

  const handleLocalWordGuess = (word: string) => {
    if (manager.isHost) {
      handleWordGuess(word)
    } else {
      manager.send({ type: 'guess_word', playerId: localPlayerId.value, word })
    }
  }

  const gs = gameState.value
  if (!gs) {
    return <div class="page"><p>Loading game...</p></div>
  }

  if (roundIntro && gs.phase === 'round_intro') {
    return (
      <div class="page round-intro">
        <div class="round-number">Round {gs.currentRound + 1} of {gs.totalRounds}</div>
        {gs.theme && <ThemeReveal theme={gs.theme} />}
        <div class="intro-word-preview">
          <WordDisplay gameState={gs} />
        </div>
        <div class="intro-hint">Get ready...</div>
      </div>
    )
  }

  if (gs.phase === 'round_end') {
    return (
      <div class="page round-end-page">
        <h2>Round Over!</h2>
        {gs.roundWinner && (
          <p class="winner-announce">
            {gs.players.find(p => p.id === gs.roundWinner)?.name} got it!
          </p>
        )}
        <div class="answer-reveal">
          The answer was: <strong>{gs.currentWord}</strong>
        </div>
        {gs.lastGuessResult && <GuessResult result={gs.lastGuessResult} players={gs.players} />}
        <div class="scores-preview">
          <PlayerList players={gs.players} currentTurn={gs.currentTurn} myId={localPlayerId.value} />
        </div>
        <p class="next-hint">Next round starting...</p>
      </div>
    )
  }

  const isMyTurnNow = gs.currentTurn === localPlayerId.value

  return (
    <div class="page game-page">
      <div class="game-sidebar">
        <PlayerList players={gs.players} currentTurn={gs.currentTurn} myId={localPlayerId.value} />
      </div>

      <div class="game-main">
        <div class="game-header">
          <span class="round-label">Round {gs.currentRound + 1}/{gs.totalRounds}</span>
          {gs.theme && <ThemeReveal theme={gs.theme} />}
        </div>

        <WordDisplay gameState={gs} />

        {gs.lastGuessResult && <GuessResult result={gs.lastGuessResult} players={gs.players} />}

        <Timer turnEndsAt={gs.turnEndsAt} isActive={gs.phase === 'playing'} />

        {gs.phase === 'playing' && (
          <div class="game-inputs">
            <Keyboard
              guessedLetters={gs.guessedLetters}
              disabled={!isMyTurnNow}
              onGuess={handleLocalLetterGuess}
            />
            <GuessInput
              disabled={!isMyTurnNow}
              onGuess={handleLocalWordGuess}
            />
          </div>
        )}

        {gs.currentTurn && !isMyTurnNow && gs.phase === 'playing' && (
          <div class="waiting-turn">
            Waiting for {gs.players.find(p => p.id === gs.currentTurn)?.name ?? 'next player'}...
          </div>
        )}
      </div>
    </div>
  )
}
