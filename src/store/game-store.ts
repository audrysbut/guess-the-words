import { signal, computed } from '@preact/signals'
import type { GameState, GameConfig, Theme, Player } from '@/types/game'
import { ALL_THEMES } from '@/types/game'

export const page = signal<'home' | 'lobby' | 'game' | 'results'>('home')
export const localPlayerId = signal<string>('')
export const localPlayerName = signal<string>('')
export const roomCode = signal<string>('')
export const error = signal<string | null>(null)
export const isHost = signal(false)
export const isConnected = signal(false)
export const gameState = signal<GameState | null>(null)

export const lobbyConfig = signal<GameConfig>({
  totalRounds: 8,
  themes: [...ALL_THEMES],
  timeLimit: 30,
})

export const localPlayers = signal<Player[]>([])

export const currentPlayer = computed(() => {
  const gs = gameState.value
  if (!gs || !gs.currentTurn) return null
  return gs.players.find(p => p.id === gs.currentTurn) ?? null
})

export const isMyTurn = computed(() => {
  const gs = gameState.value
  if (!gs || !gs.currentTurn) return false
  return gs.currentTurn === localPlayerId.value
})

export const myPlayer = computed(() => {
  const gs = gameState.value
  if (!gs) return null
  return gs.players.find(p => p.id === localPlayerId.value) ?? null
})

export function resetStore() {
  page.value = 'home'
  localPlayerId.value = ''
  localPlayerName.value = ''
  roomCode.value = ''
  error.value = null
  isHost.value = false
  isConnected.value = false
  gameState.value = null
  localPlayers.value = []
  lobbyConfig.value = { totalRounds: 8, themes: [...ALL_THEMES], timeLimit: 30 }
}

export function toggleTheme(theme: Theme) {
  const config = lobbyConfig.value
  const themes = config.themes.includes(theme)
    ? config.themes.filter(t => t !== theme)
    : [...config.themes, theme]
  lobbyConfig.value = { ...config, themes }
}
