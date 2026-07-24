import type { Language } from '@/types/game'

interface KeyboardProps {
  guessedLetters: string[]
  disabled: boolean
  onGuess: (letter: string) => void
  lang: Language
}

const EN_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

const LT_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ['Ą', 'Č', 'Ę', 'Ė', 'Į', 'Š', 'Ų', 'Ū', 'Ž'],
]

export function Keyboard({ guessedLetters, disabled, onGuess, lang }: KeyboardProps) {
  const guessed = new Set(guessedLetters.map(l => l.toUpperCase()))
  const rows = lang === 'lt' ? LT_ROWS : EN_ROWS

  return (
    <div class="keyboard">
      {rows.map((row, ri) => (
        <div key={ri} class="keyboard-row">
          {row.map(letter => {
            const used = guessed.has(letter)
            return (
              <button
                key={letter}
                class={`key ${used ? 'used' : ''}`}
                disabled={disabled || used}
                onClick={() => onGuess(letter)}
              >
                {letter}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
