import type { GameState, GameConfig, Player } from './game'

export type ClientMessage =
  | { type: 'join'; playerId: string; name: string }
  | { type: 'start_game'; config: GameConfig }
  | { type: 'guess_letter'; playerId: string; letter: string }
  | { type: 'guess_word'; playerId: string; word: string }
  | { type: 'timeout'; playerId: string }

export type ServerMessage =
  | { type: 'state_sync'; state: GameState }
  | { type: 'player-joined'; player: Player }
  | { type: 'player-left'; playerId: string }
  | { type: 'error'; message: string }

export type Message = ClientMessage | ServerMessage
