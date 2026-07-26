import type { Theme, Language } from '@/types/game'
import type { WordEntry } from '@/types/game'
import enWordBank from './entries/en.json'
import ltWordBank from './entries/lt.json'

const wordBank: Record<Theme, WordEntry[]> = {} as Record<Theme, WordEntry[]>
for (const key of Object.keys(enWordBank) as Theme[]) {
  wordBank[key] = enWordBank[key].map(entry => ({ ...entry, theme: key }))
}

const wordBankLt: Record<Theme, WordEntry[]> = {} as Record<Theme, WordEntry[]>
for (const key of Object.keys(ltWordBank) as Theme[]) {
  wordBankLt[key] = ltWordBank[key].map(entry => ({ ...entry, theme: key }))
}

const usedWords = new Set<string>()

function getRandomWordEn(theme: Theme): WordEntry | null {
  const words = wordBank[theme]
  if (!words || words.length === 0) return null

  const available = words.filter(w => !usedWords.has(w.answer))
  if (available.length === 0) return null

  const entry = available[Math.floor(Math.random() * available.length)]
  usedWords.add(entry.answer)
  return entry
}

function getRandomWordLt(theme: Theme, usedWordsLt: Set<string>): WordEntry | null {
  const words = wordBankLt[theme]
  if (!words || words.length === 0) return null

  const available = words.filter(w => !usedWordsLt.has(w.answer))
  if (available.length === 0) return null

  const entry = available[Math.floor(Math.random() * available.length)]
  return entry
}

export function selectWordsForGame(themes: Theme[], totalRounds: number, language: Language = 'en'): WordEntry[] {
  const selected: WordEntry[] = []
  usedWords.clear()
  const usedWordsLt = new Set<string>()

  for (let i = 0; i < totalRounds; i++) {
    const theme = themes[i % themes.length]
    let word: WordEntry | null = null

    if (language === 'lt') {
      word = getRandomWordLt(theme, usedWordsLt)
      if (word) usedWordsLt.add(word.answer)
    } else {
      word = getRandomWordEn(theme)
    }

    if (word) {
      selected.push(word)
    }
  }

  return selected
}
