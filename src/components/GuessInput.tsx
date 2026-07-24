import { useState } from 'preact/hooks'

interface GuessInputProps {
  disabled: boolean
  onGuess: (word: string) => void
}

export function GuessInput({ disabled, onGuess }: GuessInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onGuess(trimmed)
    setValue('')
  }

  return (
    <form class="guess-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onInput={(e) => setValue((e.target as HTMLInputElement).value)}
        placeholder="Guess a word or full answer..."
        disabled={disabled}
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Guess
      </button>
    </form>
  )
}
