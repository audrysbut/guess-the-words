import { useEffect } from 'preact/hooks'
import {
  page, roomCode, localPlayerId, isHost, error,
  localPlayers, lobbyConfig, toggleTheme, gameState,
} from '@/store/game-store'
import { PeerManager } from '@/webrtc/peer-manager'
import {
  ALL_THEMES, THEME_LABELS, THEME_COLORS, type Theme, type GameState,
} from '@/types/game'
import type { GameConfig } from '@/types/game'
import type { Message } from '@/types/messages'
import { selectWordsForGame } from '@/data/words'

interface LobbyProps {
  manager: PeerManager
  initialState: GameState | null
}

export function Lobby({ manager, initialState }: LobbyProps) {
  useEffect(() => {
    if (initialState) {
      localPlayers.value = initialState.players
      gameState.value = initialState
    }

    manager.onMessage((message: Message, _senderId: string) => {
      if (message.type === 'player-joined') {
        if (!localPlayers.value.some(p => p.id === message.player.id)) {
          localPlayers.value = [...localPlayers.value, message.player]
          if (gameState.value) {
            gameState.value = {
              ...gameState.value,
              players: [...gameState.value.players, message.player],
              scores: { ...gameState.value.scores, [message.player.id]: 0 },
            }
          }
        }
      }
      if (message.type === 'player-left') {
        localPlayers.value = localPlayers.value.filter(p => p.id !== message.playerId)
        if (gameState.value) {
          gameState.value = {
            ...gameState.value,
            players: gameState.value.players.filter(p => p.id !== message.playerId),
          }
        }
      }
      if (message.type === 'state_sync') {
        const sync = message.state
        gameState.value = sync
        localPlayers.value = sync.players
        if (sync.phase !== 'lobby') {
          page.value = 'game'
        }
      }
    })

    return () => {}
  }, [])

  const startGame = () => {
    if (!manager.isHost) return
    const config = lobbyConfig.value
    if (config.themes.length === 0) {
      error.value = 'Select at least one theme'
      return
    }
    const gs = gameState.value
    if (!gs) return

    const words = selectWordsForGame(config.themes, config.totalRounds)
    const firstWord = words[0]
    const tokenRevealed = firstWord.tokens.map(() => false)

    const newState: GameState = {
      ...gs,
      phase: 'round_intro',
      currentRound: 0,
      totalRounds: config.totalRounds,
      config,
      currentWord: firstWord.answer,
      currentTokens: firstWord.tokens,
      revealedTokens: tokenRevealed,
      guessedLetters: [],
      theme: firstWord.theme,
      roundWinner: null,
      lastGuessResult: null,
    }

    gameState.value = newState
    manager.send({ type: 'state_sync', state: newState })
    page.value = 'game'
  }

  return (
    <div class="page lobby">
      <div class="lobby-content">
        <h2>Lobby</h2>

        <div class="room-info">
          <span>Room: <strong>{roomCode.value}</strong></span>
          <span class="player-count">{localPlayers.value.length} player{localPlayers.value.length !== 1 ? 's' : ''}</span>
        </div>

        {isHost.value && (
          <div class="config-section">
            <h3>Game Settings</h3>

            <div class="config-row">
              <label>Rounds:</label>
              <select
                value={lobbyConfig.value.totalRounds}
                onChange={e => {
                  const val = parseInt((e.target as HTMLSelectElement).value)
                  lobbyConfig.value = { ...lobbyConfig.value, totalRounds: val }
                }}
              >
                {[4, 6, 8, 10, 12, 16, 20].map(n => (
                  <option value={n}>{n} rounds ({(n / ALL_THEMES.length).toFixed(0)} per theme)</option>
                ))}
              </select>
            </div>

            <div class="config-row">
              <label>Time per turn:</label>
              <select
                value={lobbyConfig.value.timeLimit}
                onChange={e => {
                  const val = parseInt((e.target as HTMLSelectElement).value)
                  lobbyConfig.value = { ...lobbyConfig.value, timeLimit: val }
                }}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>

            <div class="config-row">
              <label>Themes:</label>
              <div class="theme-toggles">
                {ALL_THEMES.map(theme => {
                  const active = lobbyConfig.value.themes.includes(theme)
                  return (
                    <button
                      key={theme}
                      class={`theme-chip ${active ? 'active' : ''}`}
                      style={active ? { borderColor: THEME_COLORS[theme], color: THEME_COLORS[theme] } : {}}
                      onClick={() => toggleTheme(theme)}
                    >
                      {THEME_LABELS[theme]}
                    </button>
                  )
                })}
              </div>
            </div>

            <button class="btn btn-primary" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {!isHost.value && (
          <div class="waiting">
            <p>Waiting for host to start the game...</p>
          </div>
        )}

        <div class="players-section">
          <h3>Players</h3>
          {localPlayers.value.map(p => (
            <div key={p.id} class={`player-item ${p.id === localPlayerId.value ? 'me' : ''}`}>
              {p.name} {p.isHost ? '(Host)' : ''} {p.id === localPlayerId.value ? '(You)' : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
