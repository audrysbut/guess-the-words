import type { GameState } from '@/types/game'

interface WordDisplayProps {
  gameState: GameState
}

export function WordDisplay({ gameState }: WordDisplayProps) {
  const { currentWord, guessedLetters, revealedTokens, currentTokens } = gameState

  const revealedSet = new Set(guessedLetters.map(l => l.toLowerCase()))

  const letterIndexes: { char: string; revealed: boolean; isSpace: boolean }[] = []

  if (currentTokens.length > 1) {
    for (let ti = 0; ti < currentTokens.length; ti++) {
      if (ti > 0) {
        letterIndexes.push({ char: ' ', revealed: true, isSpace: true })
      }
      const token = currentTokens[ti]
      const tokenRevealed = revealedTokens[ti]
      for (const char of token) {
        const lower = char.toLowerCase()
        const isLetter = /[a-zA-Z]/.test(char)
        const revealed = tokenRevealed || (isLetter && revealedSet.has(lower))
        letterIndexes.push({ char, revealed, isSpace: false })
      }
    }
  } else {
    for (const char of currentWord) {
      if (char === ' ') {
        letterIndexes.push({ char: ' ', revealed: true, isSpace: true })
      } else {
        const lower = char.toLowerCase()
        const isLetter = /[a-zA-Z]/.test(char)
        const revealed = isLetter && revealedSet.has(lower)
        letterIndexes.push({ char, revealed, isSpace: false })
      }
    }
  }

  return (
    <div class="word-display">
      {letterIndexes.map((item, i) => {
        if (item.isSpace) {
          return <span key={i} class="word-space" />
        }
        return (
          <span key={i} class={`letter-tile ${item.revealed ? 'revealed' : 'hidden'}`}>
            {item.revealed ? item.char : ''}
          </span>
        )
      })}
    </div>
  )
}
