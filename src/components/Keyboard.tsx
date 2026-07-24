interface KeyboardProps {
  guessedLetters: string[]
  disabled: boolean
  onGuess: (letter: string) => void
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

export function Keyboard({ guessedLetters, disabled, onGuess }: KeyboardProps) {
  const guessed = new Set(guessedLetters.map(l => l.toUpperCase()))

  return (
    <div class="keyboard">
      {ROWS.map((row, ri) => (
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
