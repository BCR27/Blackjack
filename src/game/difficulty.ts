import type { Rules } from './rules'

/**
 * Difficulty is a casual-friendly framing of the house rules. Each level bundles
 * the rule toggles that actually move the odds (deck count, dealer soft-17,
 * blackjack payout, double-after-split, re-split aces) and exposes a single,
 * quantified number — the house edge — so players can see how hard a table is
 * without needing to understand each rule individually.
 */

/** The subset of rules a difficulty level controls. */
export type DifficultyRules = Pick<
  Rules,
  'decks' | 'dealerHitsSoft17' | 'blackjackPayout' | 'doubleAfterSplit' | 'resplitAces'
>

export interface Difficulty {
  id: string
  name: string
  blurb: string
  rules: DifficultyRules
}

/**
 * Ordered easiest → hardest. The slider walks this list, so the order is the
 * UX contract: each step should be a clearly tougher table than the last.
 */
export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'easy',
    name: 'Easy',
    blurb: 'Single deck, dealer stands on all 17s. The best odds you can get.',
    rules: {
      decks: 1,
      dealerHitsSoft17: false,
      blackjackPayout: 1.5,
      doubleAfterSplit: true,
      resplitAces: true,
    },
  },
  {
    id: 'medium',
    name: 'Medium',
    blurb: 'Double-deck with player-friendly rules. A gentle game.',
    rules: {
      decks: 2,
      dealerHitsSoft17: false,
      blackjackPayout: 1.5,
      doubleAfterSplit: true,
      resplitAces: false,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    blurb: 'Six-deck shoe, dealer stands on soft 17. The classic table.',
    rules: {
      decks: 6,
      dealerHitsSoft17: false,
      blackjackPayout: 1.5,
      doubleAfterSplit: true,
      resplitAces: false,
    },
  },
  {
    id: 'hard',
    name: 'Hard',
    blurb: 'Six decks and the dealer hits soft 17. A tougher grind.',
    rules: {
      decks: 6,
      dealerHitsSoft17: true,
      blackjackPayout: 1.5,
      doubleAfterSplit: true,
      resplitAces: false,
    },
  },
  {
    id: 'vegas',
    name: 'Vegas',
    blurb: 'Eight decks, 6:5 blackjacks, no double-after-split. Brutal.',
    rules: {
      decks: 8,
      dealerHitsSoft17: true,
      blackjackPayout: 1.2,
      doubleAfterSplit: false,
      resplitAces: false,
    },
  },
]

// Baseline house edge for a 6-deck, stand-soft-17, 3:2, double-after-split,
// no-resplit-aces, no-surrender game played with perfect basic strategy
// (≈0.46%). The deltas below are the standard, widely published per-rule
// adjustments (Wizard of Odds), expressed in percentage points.
const BASE_EDGE = 0.46
const DECK_ADJUSTMENT: Record<number, number> = {
  1: -0.48,
  2: -0.19,
  4: -0.06,
  6: 0,
  8: 0.02,
}

/**
 * Approximate house edge for a rule set, in percent of the original bet, for a
 * basic-strategy player. Negative means the player has the edge.
 */
export function houseEdge(rules: Rules): number {
  let edge = BASE_EDGE
  edge += DECK_ADJUSTMENT[rules.decks] ?? 0
  if (rules.dealerHitsSoft17) edge += 0.22
  if (rules.blackjackPayout < 1.5) edge += 1.39 // 6:5 instead of 3:2
  if (!rules.doubleAfterSplit) edge += 0.14
  if (rules.resplitAces) edge -= 0.07
  if (rules.surrenderAllowed) edge -= 0.08
  return Math.round(edge * 100) / 100
}

/** Human-readable house edge, e.g. "0.7%" (clamps a near-zero edge to "0.0%"). */
export function formatHouseEdge(rules: Rules): string {
  const edge = houseEdge(rules)
  if (edge <= 0.04) return '0.0%'
  return `${edge.toFixed(1)}%`
}

/** A short qualitative tag for the odds, paired with the numeric edge. */
export function oddsLabel(rules: Rules): string {
  const edge = houseEdge(rules)
  if (edge < 0.3) return 'Great odds'
  if (edge < 0.7) return 'Fair odds'
  if (edge < 1.5) return 'House favored'
  return 'Tough table'
}

/** Index of the difficulty whose preset matches these rules, or -1 if custom. */
export function difficultyIndex(rules: Rules): number {
  return DIFFICULTIES.findIndex(
    (d) =>
      d.rules.decks === rules.decks &&
      d.rules.dealerHitsSoft17 === rules.dealerHitsSoft17 &&
      d.rules.blackjackPayout === rules.blackjackPayout &&
      d.rules.doubleAfterSplit === rules.doubleAfterSplit &&
      d.rules.resplitAces === rules.resplitAces,
  )
}

/** Difficulty step closest in house edge to the given rules (for the slider). */
export function nearestDifficultyIndex(rules: Rules): number {
  const edge = houseEdge(rules)
  let best = 0
  let bestGap = Infinity
  DIFFICULTIES.forEach((d, i) => {
    const gap = Math.abs(houseEdge({ ...rules, ...d.rules }) - edge)
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  })
  return best
}
