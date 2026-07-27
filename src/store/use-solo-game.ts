import { useState, useRef, useEffect } from 'preact/hooks'
import type { GameState, Language, WordEntry } from '@/types/game'
import { ALL_THEMES } from '@/types/game'
import { selectWordsForGame } from '@/data/words'
import { applyLetterGuess, applyWordGuess, createRoundIntroState } from './game-logic'

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

      const pid = prev.players[0]?.id ?? ''

      if (result.allRevealed) {
        return {
          ...prev,
          guessedLetters: result.guessedLetters,
          revealedTokens: result.revealedTokens,
          phase: 'round_end' as const,
          roundWinner: pid,
          scores: result.scores,
          players: result.players,
          currentTurn: '',
          turnEndsAt: null,
        }
      }

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

      const pid = prev.players[0]?.id ?? ''

      if (result.isFullMatch || result.allRevealed) {
        return {
          ...prev,
          revealedTokens: result.revealedTokens,
          phase: 'round_end' as const,
          roundWinner: pid,
          scores: result.scores,
          players: result.players,
          currentTurn: '',
          turnEndsAt: null,
        }
      }

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
      const nextRound = soloGameState.currentRound + 1
      if (nextRound >= soloGameState.totalRounds) {
        setSoloGameState(prev => {
          if (!prev) return prev
          return { ...prev, phase: 'game_over' }
        })
        return
      }
      const nextWord = soloWordListRef.current[nextRound % soloWordListRef.current.length]
      if (!nextWord) {
        setSoloGameState(prev => {
          if (!prev) return prev
          return { ...prev, phase: 'game_over' }
        })
        return
      }
      setSoloGameState(prev => {
        if (!prev) return prev
        return createRoundIntroState(prev, nextWord, nextRound)
      })
    }, 4000)
    return () => clearTimeout(t)
  }, [soloGameState?.phase, soloGameState?.currentRound])

  return { soloGameState, handleStartSolo, handleSoloLetter, handleSoloWord }
}
