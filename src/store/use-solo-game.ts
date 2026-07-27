import { useState, useRef, useEffect } from 'preact/hooks'
import type { GameState, Language, WordEntry } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'
import { applyLetterGuess, applyWordGuess, buildRoundEndState, advanceToNextRound } from './game-logic'

const SOLO_CONFIG = {
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
}

export function useSoloGame() {
  const [soloGameState, setSoloGameState] = useState<GameState | null>(null)
  const soloWordListRef = useRef<WordEntry[]>([])

  const handleStartSolo = (name: string, lang: Language) => {
    const playerId = `solo-${Date.now()}`
    const config = { ...SOLO_CONFIG, language: lang }
    const words = selectWordsForGame(config.themes, config.totalRounds, lang)
    soloWordListRef.current = words
    const firstWord = words[0]
    const soloState: GameState = {
      phase: 'round_intro',
      players: [{ id: playerId, name, points: 0, isHost: true }],
      config,
      currentRound: 0,
      totalRounds: config.totalRounds,
      currentTurn: '',
      currentWord: firstWord.answer,
      currentTokens: firstWord.tokens,
      revealedTokens: firstWord.tokens.map(() => false),
      guessedLetters: [],
      theme: firstWord.theme,
      scores: { [playerId]: 0 },
      turnEndsAt: null,
      roundWinner: null,
      lastGuessResult: null,
    }
    setSoloGameState(soloState)
  }

  const handleSoloLetter = (letter: string) => {
    setSoloGameState(prev => {
      if (!prev) return prev
      const result = applyLetterGuess(prev, letter)
      if (!result) return prev

      if (result.allRevealed) {
        return buildRoundEndState(prev, {
          revealedTokens: result.revealedTokens,
          guessedLetters: result.guessedLetters,
          scores: result.scores,
          players: result.players,
        })
      }

      const pid = prev.players[0]?.id ?? ''
      return {
        ...prev,
        guessedLetters: result.guessedLetters,
        revealedTokens: result.revealedTokens,
        scores: result.scores,
        players: result.players,
        currentTurn: pid,
      }
    })
  }

  const handleSoloWord = (word: string) => {
    setSoloGameState(prev => {
      if (!prev) return prev
      const result = applyWordGuess(prev, word)
      if (!result || !result.correct) return prev

      if (result.isFullMatch || result.allRevealed) {
        return buildRoundEndState(prev, {
          revealedTokens: result.revealedTokens,
          scores: result.scores,
          players: result.players,
        })
      }

      const pid = prev.players[0]?.id ?? ''
      return {
        ...prev,
        revealedTokens: result.revealedTokens,
        scores: result.scores,
        players: result.players,
        currentTurn: pid,
      }
    })
  }

  useEffect(() => {
    if (!soloGameState || soloGameState.phase !== 'round_intro') return
    const t = setTimeout(() => {
      setSoloGameState(prev => {
        if (!prev) return prev
        return {
          ...prev,
          phase: 'playing',
          currentTurn: prev.players[0]?.id ?? '',
        }
      })
    }, 3000)
    return () => clearTimeout(t)
  }, [soloGameState?.phase, soloGameState?.currentRound])

  useEffect(() => {
    if (!soloGameState || soloGameState.phase !== 'round_end') return
    const t = setTimeout(() => {
      setSoloGameState(prev => {
        if (!prev) return prev
        return advanceToNextRound(prev, soloWordListRef.current)
      })
    }, 4000)
    return () => clearTimeout(t)
  }, [soloGameState?.phase, soloGameState?.currentRound])

  return { soloGameState, handleStartSolo, handleSoloLetter, handleSoloWord }
}
