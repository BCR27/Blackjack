import type { Card } from './cards'
import { buildShuffledShoe, rankValue } from './cards'
import { evaluate, isBlackjack } from './handValue'
import type { Rules } from './rules'

export type Phase = 'betting' | 'insurance' | 'playerTurn' | 'dealerTurn' | 'settled'

export type Outcome =
  | 'win'
  | 'lose'
  | 'push'
  | 'blackjack'
  | 'bust'
  | 'surrender'

export interface PlayerHand {
  id: string
  cards: Card[]
  /** Total amount wagered on this hand (doubled hands store 2x the base bet). */
  bet: number
  doubled: boolean
  fromSplit: boolean
  /** Hand created by splitting aces (receives a single card, then stands). */
  splitAces: boolean
  finished: boolean
  outcome: Outcome | null
}

export interface RoundResult {
  /** Net change to the bankroll for the whole round (after all wagers). */
  net: number
  dealerBlackjack: boolean
  insuranceWon: boolean
}

export interface GameState {
  rules: Rules
  shoe: Card[]
  dealer: Card[]
  hands: PlayerHand[]
  activeIndex: number
  phase: Phase
  bankroll: number
  /** During betting this is the pending wager; once dealt it is the base bet. */
  bet: number
  insurance: number
  insuranceResolved: boolean
  roundResult: RoundResult | null
  roundId: number
  /** True for the round immediately following an automatic reshuffle. */
  reshuffled: boolean
}

let handCounter = 0
function newHandId(): string {
  handCounter += 1
  return `h${handCounter}`
}

export function createInitialState(rules: Rules, bankroll: number): GameState {
  return {
    rules,
    shoe: buildShuffledShoe(rules.decks),
    dealer: [],
    hands: [],
    activeIndex: -1,
    phase: 'betting',
    bankroll,
    bet: 0,
    insurance: 0,
    insuranceResolved: false,
    roundResult: null,
    roundId: 0,
    reshuffled: false,
  }
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    shoe: s.shoe.slice(),
    dealer: s.dealer.slice(),
    hands: s.hands.map((h) => ({ ...h, cards: h.cards.slice() })),
  }
}

function drawCard(s: GameState, faceUp: boolean): Card {
  if (s.shoe.length === 0) {
    s.shoe = buildShuffledShoe(s.rules.decks)
    s.reshuffled = true
  }
  const card = s.shoe.pop() as Card
  return { ...card, faceUp }
}

function drawTo(s: GameState, hand: PlayerHand): void {
  hand.cards.push(drawCard(s, true))
}

/** Rebuild the shoe when it gets low so a fresh round never runs dry. */
function ensureShoe(s: GameState): void {
  const total = 52 * s.rules.decks
  if (s.shoe.length < Math.max(15, Math.floor(total * 0.25))) {
    s.shoe = buildShuffledShoe(s.rules.decks)
    s.reshuffled = true
  }
}

// ---------------------------------------------------------------------------
// Round lifecycle
// ---------------------------------------------------------------------------

/** Begin a new round with the pending bet already set on `state.bet`. */
export function deal(state: GameState): GameState {
  const s = cloneState(state)
  s.reshuffled = false
  ensureShoe(s)

  s.bankroll -= s.bet
  s.insurance = 0
  s.insuranceResolved = false
  s.roundResult = null

  const hand: PlayerHand = {
    id: newHandId(),
    cards: [],
    bet: s.bet,
    doubled: false,
    fromSplit: false,
    splitAces: false,
    finished: false,
    outcome: null,
  }
  s.hands = [hand]
  s.dealer = []
  s.activeIndex = 0

  // Player, dealer up, player, dealer hole.
  drawTo(s, hand)
  s.dealer.push(drawCard(s, true))
  drawTo(s, hand)
  s.dealer.push(drawCard(s, false))

  const dealerUp = s.dealer[0]
  const playerBlackjack = isBlackjack(hand.cards)

  if (dealerUp.rank === 'A') {
    // Offer insurance before peeking for blackjack.
    s.phase = 'insurance'
    return s
  }

  if (rankValue(dealerUp.rank) === 10 && isBlackjack(s.dealer)) {
    return concludeRound(s)
  }

  if (playerBlackjack) {
    return concludeRound(s)
  }

  s.phase = 'playerTurn'
  s.activeIndex = 0
  return s
}

export function decideInsurance(state: GameState, take: boolean): GameState {
  const s = cloneState(state)
  if (take) {
    const amount = Math.floor(s.hands[0].bet / 2)
    s.insurance = amount
    s.bankroll -= amount
  }
  s.insuranceResolved = true

  if (isBlackjack(s.dealer)) {
    return concludeRound(s)
  }
  if (isBlackjack(s.hands[0].cards)) {
    return concludeRound(s)
  }
  s.phase = 'playerTurn'
  s.activeIndex = 0
  return s
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export function hit(state: GameState): GameState {
  const s = cloneState(state)
  const hand = s.hands[s.activeIndex]
  drawTo(s, hand)
  const val = evaluate(hand.cards)
  if (val.bust) {
    hand.outcome = 'bust'
    hand.finished = true
  } else if (val.total === 21) {
    hand.finished = true
  }
  advanceToNextPlayableHand(s)
  return s
}

export function stand(state: GameState): GameState {
  const s = cloneState(state)
  s.hands[s.activeIndex].finished = true
  advanceToNextPlayableHand(s)
  return s
}

export function double(state: GameState): GameState {
  const s = cloneState(state)
  const hand = s.hands[s.activeIndex]
  s.bankroll -= hand.bet
  hand.bet *= 2
  hand.doubled = true
  drawTo(s, hand)
  if (evaluate(hand.cards).bust) hand.outcome = 'bust'
  hand.finished = true
  advanceToNextPlayableHand(s)
  return s
}

export function split(state: GameState): GameState {
  const s = cloneState(state)
  const idx = s.activeIndex
  const hand = s.hands[idx]
  const [cardA, cardB] = hand.cards
  const aces = cardA.rank === 'A'

  s.bankroll -= hand.bet

  const handA: PlayerHand = {
    ...hand,
    cards: [cardA],
    fromSplit: true,
    splitAces: aces,
    finished: false,
    outcome: null,
  }
  const handB: PlayerHand = {
    id: newHandId(),
    cards: [cardB],
    bet: hand.bet,
    doubled: false,
    fromSplit: true,
    splitAces: aces,
    finished: false,
    outcome: null,
  }

  s.hands = [...s.hands.slice(0, idx), handA, handB, ...s.hands.slice(idx + 1)]
  s.activeIndex = idx
  advanceToNextPlayableHand(s)
  return s
}

export function surrender(state: GameState): GameState {
  const s = cloneState(state)
  const hand = s.hands[s.activeIndex]
  hand.outcome = 'surrender'
  hand.finished = true
  advanceToNextPlayableHand(s)
  return s
}

/**
 * Find the next hand awaiting a decision. Deals the second card to freshly
 * split hands, auto-stands on 21, and handles the one-card rule for split aces.
 * When no hand remains, hands the round to the dealer.
 */
function advanceToNextPlayableHand(s: GameState): void {
  for (;;) {
    const idx = s.hands.findIndex((h) => !h.finished)
    if (idx === -1) {
      enterDealerPhase(s)
      return
    }
    s.activeIndex = idx
    const hand = s.hands[idx]

    if (hand.cards.length === 1) {
      drawTo(s, hand)
    }

    const val = evaluate(hand.cards)

    if (hand.splitAces) {
      const pairOfAces =
        hand.cards.length === 2 && hand.cards.every((c) => c.rank === 'A')
      if (
        pairOfAces &&
        s.rules.resplitAces &&
        s.hands.length < s.rules.maxSplitHands
      ) {
        return // player may resplit or stand
      }
      hand.finished = true
      continue
    }

    if (val.bust) {
      hand.outcome = 'bust'
      hand.finished = true
      continue
    }
    if (val.total === 21) {
      hand.finished = true
      continue
    }
    return // awaiting player decision
  }
}

function enterDealerPhase(s: GameState): void {
  s.phase = 'dealerTurn'
  s.activeIndex = -1
  s.dealer = s.dealer.map((c) => ({ ...c, faceUp: true }))
}

// ---------------------------------------------------------------------------
// Dealer play (driven step-by-step by the store for animation)
// ---------------------------------------------------------------------------

/** True while at least one player hand can still beat the dealer. */
export function hasLiveHand(s: GameState): boolean {
  return s.hands.some(
    (h) => h.outcome !== 'bust' && h.outcome !== 'surrender',
  )
}

export function dealerShouldHit(s: GameState): boolean {
  if (!hasLiveHand(s)) return false
  const val = evaluate(s.dealer)
  if (val.total < 17) return true
  if (val.total === 17 && val.soft && s.rules.dealerHitsSoft17) return true
  return false
}

export function dealerHit(state: GameState): GameState {
  const s = cloneState(state)
  s.dealer.push(drawCard(s, true))
  return s
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

export function concludeRound(state: GameState): GameState {
  const s = cloneState(state)
  s.dealer = s.dealer.map((c) => ({ ...c, faceUp: true }))

  const dealerVal = evaluate(s.dealer)
  const dealerBlackjack = isBlackjack(s.dealer)

  let returned = 0
  let wagered = s.insurance
  let insuranceWon = false

  if (s.insurance > 0 && dealerBlackjack) {
    returned += s.insurance * 3 // stake back + 2:1
    insuranceWon = true
  }

  for (const hand of s.hands) {
    wagered += hand.bet

    if (hand.outcome === 'surrender') {
      returned += hand.bet * 0.5
      continue
    }
    if (hand.outcome === 'bust') {
      continue // lost, nothing returned
    }

    const handVal = evaluate(hand.cards)
    const playerBlackjack = isBlackjack(hand.cards) && !hand.fromSplit

    if (dealerBlackjack) {
      if (playerBlackjack) {
        hand.outcome = 'push'
        returned += hand.bet
      } else {
        hand.outcome = 'lose'
      }
      continue
    }
    if (playerBlackjack) {
      hand.outcome = 'blackjack'
      returned += hand.bet * (1 + s.rules.blackjackPayout)
      continue
    }
    if (handVal.bust) {
      hand.outcome = 'bust'
      continue
    }
    if (dealerVal.bust || handVal.total > dealerVal.total) {
      hand.outcome = 'win'
      returned += hand.bet * 2
    } else if (handVal.total === dealerVal.total) {
      hand.outcome = 'push'
      returned += hand.bet
    } else {
      hand.outcome = 'lose'
    }
  }

  s.bankroll += returned
  s.roundResult = {
    net: returned - wagered,
    dealerBlackjack,
    insuranceWon,
  }
  s.phase = 'settled'
  s.activeIndex = -1
  return s
}

/** Reset the table for a new bet, keeping the last wager if still affordable. */
export function nextRound(state: GameState): GameState {
  const s = cloneState(state)
  s.dealer = []
  s.hands = []
  s.activeIndex = -1
  s.insurance = 0
  s.insuranceResolved = false
  s.roundResult = null
  s.phase = 'betting'
  s.bet = Math.min(s.bet, s.bankroll)
  s.roundId += 1
  return s
}

// ---------------------------------------------------------------------------
// Action availability (for enabling UI controls)
// ---------------------------------------------------------------------------

export function activeHand(s: GameState): PlayerHand | null {
  if (s.activeIndex < 0 || s.activeIndex >= s.hands.length) return null
  return s.hands[s.activeIndex]
}

export function canHit(s: GameState): boolean {
  const h = activeHand(s)
  return s.phase === 'playerTurn' && !!h && !h.finished
}

export function canStand(s: GameState): boolean {
  return canHit(s)
}

export function canDouble(s: GameState): boolean {
  const h = activeHand(s)
  if (s.phase !== 'playerTurn' || !h || h.finished) return false
  if (h.cards.length !== 2 || h.doubled || h.splitAces) return false
  if (h.fromSplit && !s.rules.doubleAfterSplit) return false
  return s.bankroll >= h.bet
}

export function canSplit(s: GameState): boolean {
  const h = activeHand(s)
  if (s.phase !== 'playerTurn' || !h || h.finished) return false
  if (h.cards.length !== 2) return false
  if (rankValue(h.cards[0].rank) !== rankValue(h.cards[1].rank)) return false
  if (s.hands.length >= s.rules.maxSplitHands) return false
  if (h.cards[0].rank === 'A' && h.fromSplit && !s.rules.resplitAces) return false
  return s.bankroll >= h.bet
}

export function canSurrender(s: GameState): boolean {
  const h = activeHand(s)
  if (s.phase !== 'playerTurn' || !h || h.finished) return false
  return (
    s.rules.surrenderAllowed &&
    s.hands.length === 1 &&
    !h.fromSplit &&
    h.cards.length === 2
  )
}
