export interface Player {
  id: string
  name: string
  points: number
  isHost: boolean
}

export type Theme =
  | 'movies'
  | 'actors'
  | 'famous_people'
  | 'books'
  | 'fictional_characters'
  | 'video_games'

export const THEME_LABELS: Record<Theme, string> = {
  movies: 'Movies',
  actors: 'Actors',
  famous_people: 'Famous People',
  books: 'Books',
  fictional_characters: 'Fictional Characters',
  video_games: 'Video Games',
}

export const THEME_COLORS: Record<Theme, string> = {
  movies: '#e74c3c',
  actors: '#3498db',
  famous_people: '#f39c12',
  books: '#9b59b6',
  fictional_characters: '#1abc9c',
  video_games: '#e67e22',
}

export const ALL_THEMES: Theme[] = [
  'movies',
  'actors',
  'famous_people',
  'books',
  'fictional_characters',
  'video_games',
]

export interface RawWordEntry {
  answer: string
  tokens: string[]
}

export interface WordEntry {
  answer: string
  tokens: string[]
  theme: Theme
}

export interface GameConfig {
  totalRounds: number
  themes: Theme[]
  timeLimit: number
}

export type GamePhase = 'lobby' | 'round_intro' | 'playing' | 'round_end' | 'game_over'

export interface GameState {
  phase: GamePhase
  players: Player[]
  config: GameConfig
  currentRound: number
  totalRounds: number
  currentTurn: string
  currentWord: string
  currentTokens: string[]
  revealedTokens: boolean[]
  guessedLetters: string[]
  theme: Theme | null
  scores: Record<string, number>
  turnEndsAt: number | null
  roundWinner: string | null
  lastGuessResult?: GuessResult | null
}

export interface GuessResult {
  playerId: string
  type: 'letter' | 'word'
  value: string
  correct: boolean
  pointsAwarded: number
}

export function createInitialGameState(config: GameConfig, hostId: string, hostName: string): GameState {
  return {
    phase: 'lobby',
    players: [{ id: hostId, name: hostName, points: 0, isHost: true }],
    config,
    currentRound: 0,
    totalRounds: config.totalRounds,
    currentTurn: '',
    currentWord: '',
    currentTokens: [],
    revealedTokens: [],
    guessedLetters: [],
    theme: null,
    scores: { [hostId]: 0 },
    turnEndsAt: null,
    roundWinner: null,
    lastGuessResult: null,
  }
}
