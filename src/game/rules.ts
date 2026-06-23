export interface Rules {
  /** Number of 52-card decks in the shoe. */
  decks: number
  /** Dealer draws on soft 17 when true, otherwise stands on all 17s. */
  dealerHitsSoft17: boolean
  /** Payout multiplier for a natural blackjack (1.5 = 3:2, 1.2 = 6:5). */
  blackjackPayout: number
  /** Allow doubling down after a split. */
  doubleAfterSplit: boolean
  /** Allow late surrender on the opening two cards. */
  surrenderAllowed: boolean
  /** Maximum number of hands a player can have after splitting. */
  maxSplitHands: number
  /** Allow re-splitting aces. */
  resplitAces: boolean
}

export const DEFAULT_RULES: Rules = {
  decks: 6,
  dealerHitsSoft17: false,
  blackjackPayout: 1.5,
  doubleAfterSplit: true,
  surrenderAllowed: false,
  maxSplitHands: 4,
  resplitAces: false,
}

export const CHIP_DENOMINATIONS = [5, 25, 100, 500, 1000]

export const STARTING_BANKROLL = 1000
export const MIN_BET = 5
