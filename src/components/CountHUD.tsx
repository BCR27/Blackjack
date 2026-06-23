import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { getCount } from '../game/counting'

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`)

export function CountHUD() {
  const enabled = useGameStore((s) => s.countingEnabled)
  const game = useGameStore((s) => s.game)
  const [hidden, setHidden] = useState(false)

  if (!enabled) return null
  const count = getCount(game)

  return (
    <button
      className="count-hud"
      onClick={() => setHidden((h) => !h)}
      aria-label="Hi-Lo count"
    >
      <span className="count-hud-label">Hi-Lo</span>
      {hidden ? (
        <span className="count-hud-hidden">tap to reveal</span>
      ) : (
        <span className="count-hud-values">
          <span className="count-hud-running">{signed(count.running)}</span>
          <span className="count-hud-true">TC {signed(count.true)}</span>
        </span>
      )}
    </button>
  )
}
