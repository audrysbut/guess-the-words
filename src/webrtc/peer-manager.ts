import Peer, { DataConnection } from 'peerjs'
import type { Message } from '@/types/messages'
import type { GameState, GameConfig } from '@/types/game'
import { createInitialGameState } from '@/types/game'
import { selectWordsForGame } from '@/data/words'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
]

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type MessageCallback = (message: Message, senderId: string) => void

export class PeerManager {
  private peer: Peer | null = null
  private connections = new Map<string, DataConnection>()
  private onMessageCb: MessageCallback | null = null
  private peerId: string | null = null
  private _isHost = false

  get isHost() { return this._isHost }
  get id() { return this.peerId }

  private tryCreatePeer(id: string): Promise<Peer> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(id, { config: { iceServers: ICE_SERVERS } })
      peer.on('open', () => resolve(peer))
      peer.on('error', (err) => reject(err))
      setTimeout(() => reject(new Error('Peer creation timed out')), 10000)
    })
  }

  async createRoom(playerName: string, config: GameConfig): Promise<{ roomCode: string; state: GameState }> {
    this._isHost = true
    let code = ''
    let peer: Peer

    for (let attempt = 0; attempt < 10; attempt++) {
      code = generateRoomCode()
      try {
        peer = await this.tryCreatePeer(code)
        this.peer = peer
        this.peerId = code
        break
      } catch {
        if (attempt === 9) throw new Error('Could not create room')
      }
    }

    const playerId = code
    const state = createInitialGameState(config, playerId, playerName)

    this.peer!.on('connection', (conn: DataConnection) => {
      const joinerId = conn.peer
      this.connections.set(joinerId, conn)
      this.setupConnection(conn, joinerId, state)
    })

    this.peer!.on('error', (err) => {
      console.error('Peer error:', err)
    })

    return { roomCode: code, state }
  }

  async joinRoom(roomCode: string, playerName: string): Promise<{ playerId: string }> {
    this._isHost = false
    const playerId = generateId()
    const peer = await this.tryCreatePeer(playerId)
    this.peer = peer
    this.peerId = playerId

    const conn = peer.connect(roomCode)
    this.connections.set(roomCode, conn)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), 15000)

      conn.on('open', () => {
        clearTimeout(timeout)
        this.setupConnection(conn, roomCode)
        this.send({ type: 'join', playerId, name: playerName })
        resolve({ playerId })
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  }

  private setupConnection(conn: DataConnection, senderId: string, _state?: GameState) {
    conn.on('data', (data: unknown) => {
      const message = data as Message
      this.onMessageCb?.(message, senderId)
    })

    conn.on('close', () => {
      this.connections.delete(senderId)
      if (this._isHost) {
        const leftMsg: Message = { type: 'player-left', playerId: senderId }
        this.onMessageCb?.(leftMsg, senderId)
      } else {
        this.onMessageCb?.({ type: 'error', message: 'Host disconnected' }, senderId)
      }
    })
  }

  send(message: Message) {
    this.connections.forEach(conn => {
      if (conn.open) conn.send(message)
    })
  }

  sendToHost(message: Message) {
    this.connections.forEach(conn => {
      if (conn.open) conn.send(message)
    })
  }

  onMessage(callback: MessageCallback) {
    this.onMessageCb = callback
  }

  disconnect() {
    this.connections.forEach(conn => conn.close())
    this.connections.clear()
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
    this.peerId = null
    this._isHost = false
    this.onMessageCb = null
  }
}
