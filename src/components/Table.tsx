import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { Hand } from './Hand'
import { Chip } from './Chip'
import type { DealFrom } from './Card'

const DENOMS = [1000, 500, 100, 25, 5]

// Approximate direction of the deck (top-right) from each zone, so cards
// appear to be dealt out of the shoe.
const DEALER_FROM: DealFrom = { x: 64, y: -36 }
const PLAYER_FROM: DealFrom = { x: 78, y: -300 }

/** Greedy breakdown of an amount into chip denominations, capped for display. */
function chipStack(amount: number): number[] {
  const chips: number[] = []
  let remaining = amount
  for (const d of DENOMS) {
    while (remaining >= d && chips.length < 6) {
      chips.push(d)
      remaining -= d
    }
  }
  return chips
}

function ChipPile({ amount, size = 42 }: { amount: number; size?: number }) {
  const chips = chipStack(amount)
  return (
    <div className="chip-pile" style={{ height: size + (chips.length - 1) * 7 }}>
      {chips.map((value, i) => (
        <span
          key={i}
          className="chip-pile-item"
          style={{ bottom: i * 7, zIndex: i }}
        >
          <Chip value={value} size={size} />
        </span>
      ))}
    </div>
  )
}

export function Table() {
  const game = useGameStore((s) => s.game)
  const { dealer, hands, activeIndex, phase, bet, roundResult, reshuffled } = game

  const showBetCircle = phase === 'betting'
  const result = phase === 'settled' ? roundResult : null

  return (
    <div className="table">
      <div className="deck" aria-hidden="true">
        <span className="deck-card" />
        <span className="deck-card" />
        <span className="deck-card" />
      </div>

      <section className="dealer-zone">
        <div className="zone-label">Dealer</div>
        <Hand cards={dealer} showValue={dealer.length > 0} from={DEALER_FROM} />
      </section>

      <div className="table-center">
        {reshuffled && phase === 'betting' && (
          <motion.div
            className="shuffle-pill"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Cards shuffled
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              className={`result-banner ${
                result.net > 0 ? 'is-win' : result.net < 0 ? 'is-lose' : 'is-push'
              }`}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <span className="result-title">
                {result.net > 0 ? 'You win' : result.net < 0 ? 'Dealer wins' : 'Push'}
              </span>
              {result.net !== 0 && (
                <span className="result-amount">
                  {result.net > 0 ? '+' : '−'}${Math.abs(result.net).toLocaleString()}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="player-zone">
        {showBetCircle ? (
          <div className="bet-circle">
            {bet > 0 ? (
              <>
                <ChipPile amount={bet} />
                <span className="bet-circle-amount">${bet.toLocaleString()}</span>
              </>
            ) : (
              <span className="bet-circle-empty">Place your bet</span>
            )}
          </div>
        ) : (
          <div className={`player-hands count-${hands.length}`}>
            {hands.map((hand, i) => (
              <div className="player-hand" key={hand.id}>
                <Hand
                  cards={hand.cards}
                  active={i === activeIndex && phase === 'playerTurn'}
                  outcome={phase === 'settled' ? hand.outcome : null}
                  from={PLAYER_FROM}
                />
                <div className="hand-bet">
                  <Chip value={hand.bet} size={26} label={`$${hand.bet}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="zone-label zone-label-player">You</div>
      </section>
    </div>
  )
}
