import type { Card, Rank } from './cards'
import type { GameState } from './engine'

/** Hi-Lo tag for a rank: low cards +1, neutral 0, high cards -1. */
export function hiLo(rank: Rank): number {
  if (rank === 'A' || rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') {
    return -1
  }
  if (rank === '2' || rank === '3' || rank === '4' || rank === '5' || rank === '6') {
    return 1
  }
  return 0
}

function sumHiLo(cards: Card[]): number {
  let total = 0
  for (const c of cards) total += hiLo(c.rank)
  return total
}

export interface CountInfo {
  running: number
  true: number
  decksRemaining: number
}

/**
 * Hi-Lo count derived from the current state. A full, balanced shoe sums to
 * zero, so the running count of all exposed cards equals the negative Hi-Lo
 * sum of the undealt shoe, minus any face-down cards still on the table. This
 * resets automatically on a reshuffle without tracking discards.
 */
export function getCount(state: GameState): CountInfo {
  const faceDown: Card[] = []
  for (const c of state.dealer) if (!c.faceUp) faceDown.push(c)
  for (const h of state.hands) for (const c of h.cards) if (!c.faceUp) faceDown.push(c)

  const running = -sumHiLo(state.shoe) - sumHiLo(faceDown)
  const decksRemaining = Math.max(0.25, state.shoe.length / 52)
  const trueCount = running / decksRemaining
  return {
    running,
    true: Math.round(trueCount * 10) / 10,
    decksRemaining: Math.round(decksRemaining * 10) / 10,
  }
}
