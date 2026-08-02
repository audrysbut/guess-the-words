import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/global.css'

registerSW({
  onRegistered(r) {
    if (r) console.log('SW registered:', r.scope)
  },
  onRegisterError(error) {
    console.error('SW registration error:', error)
  },
})

render(<App />, document.getElementById('root')!)
