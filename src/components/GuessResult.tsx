import type { GuessResult as GuessResultType } from '@/types/game'

interface GuessResultProps {
  result: GuessResultType | null
  players: { id: string; name: string }[]
}

export function GuessResult({ result, players }: GuessResultProps) {
  if (!result) return null

  const player = players.find(p => p.id === result.playerId)
  const name = player?.name ?? 'Unknown'

  return (
    <div class={`guess-result ${result.correct ? 'correct' : 'wrong'}`}>
      <span class="result-player">{name}</span>
      <span class="result-action">
        guessed {result.type === 'letter' ? `letter "${result.value}"` : `"${result.value}"`}
      </span>
      {result.correct && (
        <span class="result-points">+{result.pointsAwarded}pts</span>
      )}
    </div>
  )
}
