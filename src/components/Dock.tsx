import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import {
  canDouble,
  canHit,
  canSplit,
  canSurrender,
} from '../game/engine'
import { CHIP_DENOMINATIONS, MIN_BET } from '../game/rules'
import { Chip } from './Chip'

function BettingDock() {
  const game = useGameStore((s) => s.game)
  const lastBet = useGameStore((s) => s.lastBet)
  const addChip = useGameStore((s) => s.addChip)
  const clearBet = useGameStore((s) => s.clearBet)
  const rebet = useGameStore((s) => s.rebet)
  const deal = useGameStore((s) => s.deal)
  const resetBankroll = useGameStore((s) => s.resetBankroll)

  const { bankroll, bet } = game
  const broke = bankroll < MIN_BET && bet === 0

  if (broke) {
    return (
      <div className="dock-broke">
        <p>You&rsquo;re out of chips.</p>
        <button className="btn btn-primary" onClick={resetBankroll}>
          Refill $1,000
        </button>
      </div>
    )
  }

  const canDeal = bet >= MIN_BET && bet <= bankroll

  return (
    <div className="dock-betting">
      <div className="chip-rack">
        {CHIP_DENOMINATIONS.map((value) => {
          const disabled = bet + value > bankroll
          return (
            <button
              key={value}
              className="chip-button"
              disabled={disabled}
              onClick={() => addChip(value)}
              aria-label={`Bet $${value}`}
            >
              <Chip value={value} size={56} />
            </button>
          )
        })}
      </div>

      <div className="bet-actions">
        <button
          className="btn btn-ghost"
          disabled={bet === 0}
          onClick={clearBet}
        >
          Clear
        </button>
        <button
          className="btn btn-primary btn-deal"
          disabled={!canDeal}
          onClick={deal}
        >
          Deal
        </button>
        <button
          className="btn btn-ghost"
          disabled={lastBet <= 0 || lastBet > bankroll}
          onClick={rebet}
        >
          Rebet
        </button>
      </div>
    </div>
  )
}

function ActionDock() {
  const game = useGameStore((s) => s.game)
  const hit = useGameStore((s) => s.hit)
  const stand = useGameStore((s) => s.stand)
  const double = useGameStore((s) => s.double)
  const split = useGameStore((s) => s.split)
  const surrender = useGameStore((s) => s.surrender)

  return (
    <div className="dock-actions">
      <div className="action-row-secondary">
        {canSurrender(game) && (
          <button className="btn btn-action" onClick={surrender}>
            Surrender
          </button>
        )}
        {canDouble(game) && (
          <button className="btn btn-action" onClick={double}>
            Double
          </button>
        )}
        {canSplit(game) && (
          <button className="btn btn-action" onClick={split}>
            Split
          </button>
        )}
      </div>
      <div className="action-row-primary">
        <button
          className="btn btn-hit"
          disabled={!canHit(game)}
          onClick={hit}
        >
          Hit
        </button>
        <button
          className="btn btn-stand"
          disabled={!canHit(game)}
          onClick={stand}
        >
          Stand
        </button>
      </div>
    </div>
  )
}

function InsuranceDock() {
  const bet = useGameStore((s) => s.game.bet)
  const takeInsurance = useGameStore((s) => s.takeInsurance)
  const cost = Math.floor(bet / 2)

  return (
    <div className="dock-insurance">
      <p className="insurance-prompt">
        Dealer shows an Ace. Take insurance for ${cost}?
      </p>
      <div className="action-row-primary">
        <button className="btn btn-ghost" onClick={() => takeInsurance(false)}>
          No thanks
        </button>
        <button className="btn btn-primary" onClick={() => takeInsurance(true)}>
          Insurance
        </button>
      </div>
    </div>
  )
}

function SettledDock() {
  const nextRound = useGameStore((s) => s.nextRound)
  return (
    <div className="dock-settled">
      <button className="btn btn-primary btn-deal" onClick={nextRound}>
        New Hand
      </button>
    </div>
  )
}

export function Dock() {
  const phase = useGameStore((s) => s.game.phase)

  return (
    <motion.div
      className="dock"
      key={phase}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {phase === 'betting' && <BettingDock />}
      {phase === 'playerTurn' && <ActionDock />}
      {phase === 'insurance' && <InsuranceDock />}
      {phase === 'settled' && <SettledDock />}
      {phase === 'dealerTurn' && (
        <div className="dock-status">Dealer plays…</div>
      )}
    </motion.div>
  )
}
