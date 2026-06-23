export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

export interface Card {
  id: string
  rank: Rank
  suit: Suit
  faceUp: boolean
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

/** Base value of a rank; aces are returned as 11 and adjusted during evaluation. */
export function rankValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 10
  return Number(rank)
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `c${idCounter}`
}

/** Build a fresh, ordered shoe of `decks` standard 52-card decks. */
export function buildShoe(decks: number): Card[] {
  const shoe: Card[] = []
  for (let d = 0; d < decks; d += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ id: nextId(), rank, suit, faceUp: true })
      }
    }
  }
  return shoe
}

/** Fisher-Yates shuffle, returning a new array. */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildShuffledShoe(decks: number): Card[] {
  return shuffle(buildShoe(decks))
}
