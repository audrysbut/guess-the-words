import { useState, useEffect } from 'preact/hooks'
import { page, resetStore } from '@/store/game-store'
import { PeerManager } from '@/webrtc/peer-manager'
import type { GameState } from '@/types/game'
import { Home } from '@/pages/Home'
import { Lobby } from '@/pages/Lobby'
import { Game } from '@/pages/Game'
import { Results } from '@/pages/Results'

export function App() {
  const [manager, setManager] = useState<PeerManager | null>(null)
  const [initialState, setInitialState] = useState<GameState | null>(null)

  const handlePeerReady = (m: PeerManager, state: GameState | null) => {
    setManager(m)
    setInitialState(state)
  }

  const handlePlayAgain = () => {
    if (manager) {
      manager.disconnect()
    }
    setManager(null)
    setInitialState(null)
    resetStore()
  }

  useEffect(() => {
    return () => {
      if (manager) {
        manager.disconnect()
      }
    }
  }, [])

  const currentPage = page.value

  return (
    <div class="app">
      {currentPage === 'home' && <Home onPeerReady={handlePeerReady} />}
      {currentPage === 'lobby' && manager && (
        <Lobby manager={manager} initialState={initialState} />
      )}
      {currentPage === 'game' && manager && (
        <Game manager={manager} />
      )}
      {currentPage === 'results' && (
        <Results onPlayAgain={handlePlayAgain} />
      )}
    </div>
  )
}
