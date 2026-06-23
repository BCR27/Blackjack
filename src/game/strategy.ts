import type { Card, Rank } from './cards'
import { rankValue } from './cards'
import { evaluate } from './handValue'
import type { Rules } from './rules'

export type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender'

export interface StrategyContext {
  canDouble: boolean
  canSplit: boolean
  canSurrender: boolean
}

function upValue(card: Card): number {
  // Ace counts as 11 for strategy lookups.
  return card.rank === 'A' ? 11 : rankValue(card.rank)
}

function pairRank(cards: Card[]): Rank | null {
  if (cards.length !== 2) return null
  if (rankValue(cards[0].rank) !== rankValue(cards[1].rank)) return null
  return cards[0].rank
}

/**
 * Multi-deck basic strategy (dealer stands on soft 17, double-after-split
 * allowed). Returns the mathematically best action; if that action is not
 * currently available it falls back sensibly (double→hit, split→total,
 * surrender→total).
 */
export function basicStrategy(
  cards: Card[],
  dealerUp: Card,
  _rules: Rules,
  ctx: StrategyContext,
): Action {
  const up = upValue(dealerUp)
  const doubleOr = (fallback: Action): Action => (ctx.canDouble ? 'double' : fallback)

  // --- Pairs -------------------------------------------------------------
  const pair = pairRank(cards)
  if (pair && ctx.canSplit) {
    const v = rankValue(cards[0].rank)
    if (pair === 'A') return 'split'
    if (v === 10) return 'stand'
    if (v === 9) return up === 7 || up >= 10 ? 'stand' : 'split'
    if (v === 8) return 'split'
    if (v === 7) return up <= 7 ? 'split' : 'hit'
    if (v === 6) return up >= 2 && up <= 6 ? 'split' : 'hit'
    if (v === 5) return up <= 9 ? doubleOr('hit') : 'hit'
    if (v === 4) return up === 5 || up === 6 ? 'split' : 'hit'
    if (v === 3 || v === 2) return up >= 2 && up <= 7 ? 'split' : 'hit'
  }

  const { total, soft } = evaluate(cards)

  // --- Soft totals -------------------------------------------------------
  if (soft) {
    if (total >= 20) return 'stand'
    if (total === 19) return 'stand'
    if (total === 18) {
      if (up >= 2 && up <= 6) return doubleOr('stand')
      if (up === 7 || up === 8) return 'stand'
      return 'hit'
    }
    if (total === 17) return up >= 3 && up <= 6 ? doubleOr('hit') : 'hit'
    if (total === 16 || total === 15) return up >= 4 && up <= 6 ? doubleOr('hit') : 'hit'
    // soft 13-14
    return up === 5 || up === 6 ? doubleOr('hit') : 'hit'
  }

  // --- Hard totals -------------------------------------------------------
  if (total >= 17) {
    if (total === 17 && ctx.canSurrender && up === 11) return 'stand'
    return 'stand'
  }
  if (total === 16) {
    if (ctx.canSurrender && up >= 9) return 'surrender'
    return up >= 2 && up <= 6 ? 'stand' : 'hit'
  }
  if (total === 15) {
    if (ctx.canSurrender && up === 10) return 'surrender'
    return up >= 2 && up <= 6 ? 'stand' : 'hit'
  }
  if (total >= 13) return up >= 2 && up <= 6 ? 'stand' : 'hit'
  if (total === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit'
  if (total === 11) return doubleOr('hit')
  if (total === 10) return up <= 9 ? doubleOr('hit') : 'hit'
  if (total === 9) return up >= 3 && up <= 6 ? doubleOr('hit') : 'hit'
  return 'hit'
}

export const ACTION_LABEL: Record<Action, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
}
