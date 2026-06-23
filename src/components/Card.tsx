import { motion } from 'framer-motion'
import type { Card } from '../game/cards'
import { SUIT_SYMBOL, isRed } from '../game/cards'

const entrance = {
  hidden: { y: -36, opacity: 0, scale: 0.9, rotateZ: -4 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 26 },
  },
}

interface PlayingCardProps {
  card: Card
}

export function PlayingCard({ card }: PlayingCardProps) {
  const symbol = SUIT_SYMBOL[card.suit]
  const red = isRed(card.suit)

  return (
    <motion.div className="card" variants={entrance}>
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
