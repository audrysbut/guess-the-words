import type { GameState, Player, WordEntry, Theme } from '@/types/game'

export function getNextPlayerId(players: Player[], currentId: string): string {
  const idx = players.findIndex(p => p.id === currentId)
  if (idx === -1) return players[0]?.id ?? ''
  return players[(idx + 1) % players.length].id
}

export function buildRoundEndState(
  state: GameState,
  partial: {
    revealedTokens: boolean[]
    guessedLetters?: string[]
    scores: Record<string, number>
    players: Player[]
  },
): GameState {
  return {
    ...state,
    revealedTokens: partial.revealedTokens,
    guessedLetters: partial.guessedLetters ?? state.guessedLetters,
    scores: partial.scores,
    players: partial.players,
    phase: 'round_end',
    roundWinner: state.currentTurn,
    currentTurn: '',
    turnEndsAt: null,
  }
}

export function buildPlayingState(
  state: GameState,
  partial: {
    revealedTokens?: boolean[]
    guessedLetters?: string[]
    scores?: Record<string, number>
    players?: Player[]
  },
  nextTurn: string,
  turnEndsAt: number,
): GameState {
  return {
    ...state,
    ...partial,
    currentTurn: nextTurn,
    turnEndsAt,
  }
}

export function buildGameOverState(state: GameState): GameState {
  return {
    ...state,
    phase: 'game_over',
    currentTurn: '',
    turnEndsAt: null,
  }
}

export function createPickingState(
  state: GameState,
  pickerId: string | null,
  round: number,
): GameState {
  return {
    ...state,
    phase: 'picking',
    currentRound: round,
    currentWord: '',
    currentTokens: [],
    revealedTokens: [],
    guessedLetters: [],
    theme: null,
    roundWinner: null,
    currentTurn: '',
    turnEndsAt: null,
    pickerId,
  }
}

export function createRoundIntroStateFromPick(
  state: GameState,
  answer: string,
  tokens: string[],
  theme: Theme | null,
  round: number,
): GameState {
  return {
    ...state,
    phase: 'round_intro',
    currentRound: round,
    currentWord: answer,
    currentTokens: tokens,
    revealedTokens: tokens.map(() => false),
    guessedLetters: [],
    theme,
    roundWinner: null,
    currentTurn: '',
    turnEndsAt: null,
    pickerId: state.pickerId,
  }
}

export function getNextGuesser(players: Player[], currentId: string, pickerId: string | null): string {
  if (players.length === 0) return ''
  if (players.length === 1) return players[0].id
  let idx = players.findIndex(p => p.id === currentId)
  if (idx === -1) idx = 0
  for (let i = 1; i <= players.length; i++) {
    const cand = players[(idx + i) % players.length].id
    if (pickerId && cand === pickerId) continue
    return cand
  }
  return players[0].id
}

export function getNextTurnPlayer(state: GameState, currentId: string): string {
  if (state.config.mode === 'custom' && state.pickerId) {
    return getNextGuesser(state.players, currentId, state.pickerId)
  }
  return getNextPlayerId(state.players, currentId)
}

export function advanceToNextRound(
  state: GameState,
  words?: WordEntry[],
): GameState {
  const nextRound = state.currentRound + 1
  if (nextRound >= state.totalRounds) return buildGameOverState(state)
  if (state.config.mode === 'custom') {
    const picker = state.players[nextRound % state.players.length]
    return createPickingState(state, picker?.id ?? null, nextRound)
  }
  const nextWord = words?.[nextRound % (words?.length || 1)]
  if (!nextWord) return buildGameOverState(state)
  return createRoundIntroState(state, nextWord, nextRound)
}

export function applyLetterGuess(
  state: GameState,
  letter: string,
): {
  guessedLetters: string[]
  revealedTokens: boolean[]
  allRevealed: boolean
  correct: boolean
  scores: Record<string, number>
  players: Player[]
} | null {
  if (state.phase !== 'playing') return null
  const lower = letter.toLowerCase()
  if (state.guessedLetters.includes(lower)) return null

  const newGuessed = [...state.guessedLetters, lower]
  const correct = state.currentWord.toLowerCase().includes(lower)
  const newRevealed = [...state.revealedTokens]

  if (correct) {
    for (let ti = 0; ti < state.currentTokens.length; ti++) {
      if (newRevealed[ti]) continue
      const tok = state.currentTokens[ti].toLowerCase()
      if ([...tok].every(c => !/\p{L}/u.test(c) || newGuessed.includes(c))) {
        newRevealed[ti] = true
      }
    }
  }

  const allRevealed = newRevealed.every(Boolean)
  const newScores = { ...state.scores }
  if (correct) newScores[state.currentTurn] = (newScores[state.currentTurn] || 0) + 1
  const updatedPlayers = state.players.map(p => ({ ...p, points: newScores[p.id] || 0 }))

  return { guessedLetters: newGuessed, revealedTokens: newRevealed, allRevealed, correct, scores: newScores, players: updatedPlayers }
}

export function applyWordGuess(
  state: GameState,
  word: string,
): {
  revealedTokens: boolean[]
  allRevealed: boolean
  correct: boolean
  isFullMatch: boolean
  tokenIdx: number
  scores: Record<string, number>
  players: Player[]
} | null {
  if (state.phase !== 'playing') return null

  const wordLower = word.toLowerCase()
  const gsWordLower = state.currentWord.toLowerCase()
  const isFullMatch = wordLower === gsWordLower
  const tokenIdx = state.currentTokens.findIndex((t, i) => !state.revealedTokens[i] && t.toLowerCase() === wordLower)
  const correct = isFullMatch || tokenIdx !== -1
  const newScores = { ...state.scores }
  if (correct) newScores[state.currentTurn] = (newScores[state.currentTurn] || 0) + 10
  const updatedPlayers = state.players.map(p => ({ ...p, points: newScores[p.id] || 0 }))

  let newRevealed: boolean[]
  let allRevealed: boolean

  if (isFullMatch) {
    newRevealed = state.currentTokens.map(() => true)
    allRevealed = true
  } else if (tokenIdx !== -1) {
    newRevealed = [...state.revealedTokens]
    newRevealed[tokenIdx] = true
    allRevealed = newRevealed.every(Boolean)
  } else {
    newRevealed = [...state.revealedTokens]
    allRevealed = false
  }

  return { revealedTokens: newRevealed, allRevealed, correct, isFullMatch, tokenIdx, scores: newScores, players: updatedPlayers }
}

export function createRoundIntroState(
  state: GameState,
  word: WordEntry,
  round: number,
): GameState {
  return {
    ...state,
    phase: 'round_intro',
    currentRound: round,
    currentWord: word.answer,
    currentTokens: word.tokens,
    revealedTokens: word.tokens.map(() => false),
    guessedLetters: [],
    theme: word.theme,
    roundWinner: null,
    currentTurn: '',
    turnEndsAt: null,
  }
}
