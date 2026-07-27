import { useState, useEffect } from 'preact/hooks'
import type { Language } from '@/types/game'

const STORAGE_KEY = 'guess-the-words-lang'

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Language) || 'lt'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const toggleLang = () => setLang(prev => prev === 'lt' ? 'en' : 'lt')

  return { lang, setLang, toggleLang }
}
