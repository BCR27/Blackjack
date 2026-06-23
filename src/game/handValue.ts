import type { Card } from './cards'
import { rankValue } from './cards'

export interface HandValue {
  /** Best total that does not bust when possible, otherwise the minimum total. */
  total: number
  /** True when an ace is currently counted as 11. */
  soft: boolean
  /** True when total > 21. */
  bust: boolean
}

/**
 * Evaluate a hand. Aces count as 11 until that would bust, then they drop to 1.
 * Only face-up cards contribute (the dealer hole card is hidden until revealed).
 */
export function evaluate(cards: Card[], includeHidden = true): HandValue {
  let total = 0
  let aces = 0
  for (const card of cards) {
    if (!includeHidden && !card.faceUp) continue
    const v = rankValue(card.rank)
    total += v
    if (card.rank === 'A') aces += 1
  }

  let soft = aces > 0
  // Reduce aces from 11 to 1 while busting.
  let highAces = aces
  while (total > 21 && highAces > 0) {
    total -= 10
    highAces -= 1
  }
  soft = highAces > 0
  return { total, soft, bust: total > 21 }
}

/** A natural blackjack: exactly two cards totalling 21 (and not from a split). */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && evaluate(cards).total === 21
}
