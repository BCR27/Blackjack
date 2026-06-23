import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { Card } from '../game/cards'
import { SUIT_SYMBOL, isRed } from '../game/cards'

export interface DealFrom {
  x: number
  y: number
}

// Cards fly in from the deck's direction. The parent hand orchestrates the
// stagger (so only the opening deal is staggered, not later hits).
const dealVariants: Variants = {
  hidden: (from: DealFrom) => ({
    x: from.x,
    y: from.y,
    opacity: 0,
    scale: 0.82,
    rotateZ: from.x >= 0 ? 11 : -11,
  }),
  show: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    transition: { type: 'spring', stiffness: 340, damping: 24 },
  },
}

interface PlayingCardProps {
  card: Card
  from: DealFrom
}

export function PlayingCard({ card, from }: PlayingCardProps) {
  const symbol = SUIT_SYMBOL[card.suit]
  const red = isRed(card.suit)

  return (
    <motion.div className="card" variants={dealVariants} custom={from}>
      <motion.div
        className="card-flip"
        initial={false}
        animate={{ rotateY: card.faceUp ? 0 : 180 }}
        transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className={`card-face card-front ${red ? 'red' : 'black'}`}>
          <div className="card-corner card-corner-tl">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
          <span className="card-pip">{symbol}</span>
          <div className="card-corner card-corner-br">
            <span className="card-rank">{card.rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
        </div>
        <div className="card-face card-back">
          <div className="card-back-inner">
            <span>♠</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
