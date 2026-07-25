import type { ComponentChildren } from 'preact'
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

  const elements: ComponentChildren[] = []

  for (let ti = 0; ti < tokens.length; ti++) {
    if (ti > 0) {
      elements.push(<span key={`s-${ti}`} class="word-space" />)
    }

    const letters = [...tokens[ti].text].map((char, ci) => {
      const lower = char.toLowerCase()
      const revealed = tokens[ti].revealed || (isLetter.test(char) && revealedSet.has(lower))
      return { char, revealed, key: `t${ti}-c${ci}` }
    })

    elements.push(
      <span key={`t-${ti}`} class="word-token">
        {letters.map(l => (
          <span key={l.key} class={`letter-tile ${l.revealed ? 'revealed' : 'hidden'}`}>
            {l.revealed ? l.char : ''}
          </span>
        ))}
      </span>,
    )
  }

  return <div class="word-display">{elements}</div>
}
