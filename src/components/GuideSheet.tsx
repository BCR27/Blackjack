import type { Card, Rank } from '../game/cards'
import { useGameStore } from '../store/useGameStore'
import { basicStrategy, type Action } from '../game/strategy'
import { formatHouseEdge, oddsLabel } from '../game/difficulty'
import { Sheet } from './Sheet'

// The strategy chart is generated from the same basicStrategy() the in-game
// coach uses, so what you study here is exactly what the hints recommend.

let cid = 0
function card(rank: Rank): Card {
  cid += 1
  return { id: `g${cid}`, rank, suit: 'spades', faceUp: true }
}

const DEALER_UPS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

const ACTION_CODE: Record<Action, string> = {
  hit: 'H',
  stand: 'S',
  double: 'D',
  split: 'P',
  surrender: 'R',
}

/** Two non-pair, non-ace cards making the given hard total (for the chart). */
function hardCards(total: number): Card[] {
  for (let b = 2; b <= 10; b += 1) {
    const a = total - b
    if (a >= 2 && a <= 10 && a !== b) {
      return [card(String(a) as Rank), card(String(b) as Rank)]
    }
  }
  return [card('10'), card('7')]
}

interface Row {
  label: string
  cards: Card[]
  canSplit: boolean
}

const HARD_ROWS: Row[] = [8, 9, 10, 11, 12, 13, 14, 15, 16].map((t) => ({
  label: String(t),
  cards: hardCards(t),
  canSplit: false,
}))

const SOFT_ROWS: Row[] = [2, 3, 4, 5, 6, 7, 8, 9].map((x) => ({
  label: `A,${x}`,
  cards: [card('A'), card(String(x) as Rank)],
  canSplit: false,
}))

const PAIR_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']
const PAIR_ROWS: Row[] = PAIR_RANKS.map((r) => ({
  label: `${r === '10' ? '10' : r},${r === '10' ? '10' : r}`,
  cards: [card(r), card(r)],
  canSplit: true,
}))

function StrategyTable({ title, rows }: { title: string; rows: Row[] }) {
  const rules = useGameStore((s) => s.game.rules)
  return (
    <div className="chart-block">
      <div className="chart-caption">{title}</div>
      <div className="chart">
        <div className="chart-row chart-head">
          <span className="chart-cell chart-rowlabel" />
          {DEALER_UPS.map((d) => (
            <span className="chart-cell chart-colhead" key={d}>
              {d}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div className="chart-row" key={row.label}>
            <span className="chart-cell chart-rowlabel">{row.label}</span>
            {DEALER_UPS.map((d) => {
              const action = basicStrategy(row.cards, card(d), rules, {
                canDouble: true,
                canSplit: row.canSplit,
                canSurrender: false,
              })
              return (
                <span
                  className={`chart-cell chart-act act-${action}`}
                  key={d}
                >
                  {ACTION_CODE[action]}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function GuideSheet({ onClose }: { onClose: () => void }) {
  const rules = useGameStore((s) => s.game.rules)

  return (
    <Sheet title="How to Play" onClose={onClose}>
      <div className="settings-section-title">The goal</div>
      <div className="guide-prose">
        <p>
          Beat the dealer by getting closer to <strong>21</strong> without going
          over. Number cards are worth their value, face cards are 10, and an ace
          is 1 or 11 — whichever helps you more.
        </p>
        <p>
          You and the dealer each start with two cards. The dealer shows one card
          and hits until reaching at least 17. A two-card 21 is a{' '}
          <strong>blackjack</strong> and pays extra.
        </p>
      </div>

      <div className="settings-section-title">Your moves</div>
      <div className="settings-group">
        <div className="settings-row guide-move">
          <span>Hit</span>
          <span className="guide-move-desc">Take another card.</span>
        </div>
        <div className="settings-row guide-move">
          <span>Stand</span>
          <span className="guide-move-desc">Keep your total, end your turn.</span>
        </div>
        <div className="settings-row guide-move">
          <span>Double</span>
          <span className="guide-move-desc">Double your bet, take one card.</span>
        </div>
        <div className="settings-row guide-move">
          <span>Split</span>
          <span className="guide-move-desc">Split a pair into two hands.</span>
        </div>
      </div>

      <div className="settings-section-title">Basic strategy</div>
      <p className="guide-note">
        The mathematically best move for every hand. Turn on{' '}
        <strong>Strategy hints</strong> in Settings to see it highlighted as you
        play.
      </p>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="chart-cell chart-act act-hit">H</span> Hit
        </span>
        <span className="legend-item">
          <span className="chart-cell chart-act act-stand">S</span> Stand
        </span>
        <span className="legend-item">
          <span className="chart-cell chart-act act-double">D</span> Double
        </span>
        <span className="legend-item">
          <span className="chart-cell chart-act act-split">P</span> Split
        </span>
      </div>
      <StrategyTable title="Hard totals" rows={HARD_ROWS} />
      <StrategyTable title="Soft totals (with an ace)" rows={SOFT_ROWS} />
      <StrategyTable title="Pairs" rows={PAIR_ROWS} />

      <div className="settings-section-title">This table</div>
      <div className="settings-group">
        <div className="settings-row">
          <span>House edge</span>
          <span className="settings-row-value">
            {formatHouseEdge(rules)} · {oddsLabel(rules)}
          </span>
        </div>
      </div>
      <p className="guide-note">
        Lower the difficulty in Settings for a smaller house edge. Cards are
        dealt from a fairly shuffled shoe — no rigging, ever.
      </p>
    </Sheet>
  )
}
