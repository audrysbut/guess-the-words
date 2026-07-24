import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import type { Language, TranslationKey, Translations } from './types'
import en from './locales/en'
import lt from './locales/lt'

const locales: Record<Language, Translations> = { en, lt }

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, ...args: string[]) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'lt',
  setLang: () => {},
  t: (key) => locales.lt[key] ?? key,
})

export function useT() {
  return useContext(I18nContext)
}

export function I18nProvider({
  lang,
  setLang,
  children,
}: {
  lang: Language
  setLang: (lang: Language) => void
  children: preact.ComponentChildren
}) {
  const t = (key: TranslationKey, ...args: string[]) => {
    let str = locales[lang][key]
    if (str === undefined) {
      str = locales['en'][key] ?? key
    }
    if (args.length > 0) {
      args.forEach((arg, i) => {
        str = str.replace(`{${i}}`, arg)
      })
    }
    return str
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}
