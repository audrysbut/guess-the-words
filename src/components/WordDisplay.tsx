import type { GameState } from '@/types/game'

interface WordDisplayProps {
  gameState: GameState
}

export function WordDisplay({ gameState }: WordDisplayProps) {
  const { currentWord, guessedLetters, revealedTokens, currentTokens } = gameState

  const revealedSet = new Set(guessedLetters.map(l => l.toLowerCase()))
  const isLetter = /\p{L}/u

  let tokens: { text: string; revealed: boolean }[]

  if (currentTokens.length > 1) {
    tokens = currentTokens.map((t, i) => ({ text: t, revealed: revealedTokens[i] }))
  } else {
    const overallRevealed = currentTokens.length === 1 ? revealedTokens[0] : false
    tokens = currentWord.split(' ').map(t => ({ text: t, revealed: overallRevealed }))
  }

  return (
    <div class="word-display">
      {tokens.map((token, ti) => (
        <span key={`t-${ti}`} class="word-token">
          {[...token.text].map((char, ci) => {
            const lower = char.toLowerCase()
            const revealed = token.revealed || (isLetter.test(char) && revealedSet.has(lower))
            return (
              <span key={`t${ti}-c${ci}`} class={`letter-tile ${revealed ? 'revealed' : 'hidden'}`}>
                {revealed ? char : ''}
              </span>
            )
          })}
        </span>
      ))}
    </div>
  )
}
