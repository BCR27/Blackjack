import { motion } from 'framer-motion'
import type { Card } from '../game/cards'
import { evaluate } from '../game/handValue'
import type { Outcome } from '../game/engine'
import { PlayingCard } from './Card'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  win: 'Win',
  lose: 'Lose',
  push: 'Push',
  blackjack: 'Blackjack',
  bust: 'Bust',
  surrender: 'Surrender',
}

function valueBadge(cards: Card[]): { text: string; soft: boolean } {
  const hasHidden = cards.some((c) => !c.faceUp)
  const v = evaluate(cards, !hasHidden)
  if (v.bust) return { text: 'Bust', soft: false }
  return { text: String(v.total), soft: v.soft && v.total <= 21 }
}

interface HandProps {
  cards: Card[]
  active?: boolean
  outcome?: Outcome | null
  bet?: number
  showValue?: boolean
}

export function Hand({
  cards,
  active = false,
  outcome = null,
  showValue = true,
}: HandProps) {
  if (cards.length === 0) return null
  const badge = valueBadge(cards)

  return (
    <div className={`hand ${active ? 'hand-active' : ''}`}>
      {showValue && (
        <div className="hand-value">
          <span>{badge.text}</span>
          {badge.soft && <span className="hand-value-soft">soft</span>}
        </div>
      )}
      <motion.div
        className="hand-cards"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <PlayingCard key={card.id} card={card} />
        ))}
      </motion.div>
      {outcome && (
        <motion.div
          className={`hand-outcome outcome-${outcome}`}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {OUTCOME_LABEL[outcome]}
        </motion.div>
      )}
    </div>
  )
}
