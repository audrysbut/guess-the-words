import { useState } from 'preact/hooks'
import HomeScreen from '@/pages/HomeScreen'
import Lobby from '@/pages/Lobby'
import SoloGame from '@/pages/SoloGame'
import { I18nProvider } from '@/i18n/context'
import { useLanguage } from '@/store/use-language'

export default function App() {
  const initialRoomId = new URLSearchParams(window.location.search).get('room')
  const { lang, setLang, toggleLang } = useLanguage()

  const [playerName, setPlayerName] = useState('')
  const [screen, setScreen] = useState<'home' | 'solo' | 'lobby'>('home')
  const [lobbyRoomId, setLobbyRoomId] = useState<string | undefined>()

  const handleSolo = (name: string) => {
    setPlayerName(name)
    setScreen('solo')
  }

  const handleCreateRoom = (name: string) => {
    setPlayerName(name)
    setLobbyRoomId(undefined)
    setScreen('lobby')
  }

  const handleJoinRoom = (name: string, roomId: string) => {
    setPlayerName(name)
    setLobbyRoomId(roomId)
    setScreen('lobby')
  }

  let content: preact.ComponentChild

  if (screen === 'home') {
    content = (
      <HomeScreen
        onStartSolo={handleSolo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        initialRoomId={initialRoomId ?? undefined}
        lang={lang}
        onToggleLang={toggleLang}
      />
    )
  } else if (screen === 'solo') {
    content = <SoloGame playerName={playerName} lang={lang} />
  } else {
    content = (
      <Lobby
        playerName={playerName}
        roomCode={lobbyRoomId}
        lang={lang}
        setLang={setLang}
      />
    )
  }

  return (
    <I18nProvider lang={lang} setLang={setLang}>
      <div class="app">
        {content}
      </div>
    </I18nProvider>
  )
}
