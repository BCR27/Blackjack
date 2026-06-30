import type { GameState } from './engine'
import { STARTING_BANKROLL } from './rules'

export interface Stats {
  hands: number
  wins: number
  losses: number
  pushes: number
  blackjacks: number
  busts: number
  net: number
  biggestWin: number
  peakBankroll: number
  streak: number
  bestStreak: number
  decisions: number
  correct: number
}

export const initialStats: Stats = {
  hands: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  busts: 0,
  net: 0,
  biggestWin: 0,
  peakBankroll: STARTING_BANKROLL,
  streak: 0,
  bestStreak: 0,
  decisions: 0,
  correct: 0,
}

export type RoundResultType = 'win' | 'lose' | 'push'

export interface HistoryEntry {
  id: number
  net: number
  bet: number
  result: RoundResultType
  blackjack: boolean
}

let historyId = 0

/** Fold a settled round into the running stats and produce a history entry. */
export function recordRound(
  stats: Stats,
  game: GameState,
): { stats: Stats; entry: HistoryEntry } {
  const net = game.roundResult?.net ?? 0
  const bet = game.hands.reduce((sum, h) => sum + h.bet, 0)
  const result: RoundResultType = net > 0 ? 'win' : net < 0 ? 'lose' : 'push'
  const blackjack = game.hands.some((h) => h.outcome === 'blackjack')
  const busts = game.hands.filter((h) => h.outcome === 'bust').length

  const streak = result === 'win' ? stats.streak + 1 : result === 'lose' ? 0 : stats.streak

  const next: Stats = {
    hands: stats.hands + 1,
    wins: stats.wins + (result === 'win' ? 1 : 0),
    losses: stats.losses + (result === 'lose' ? 1 : 0),
    pushes: stats.pushes + (result === 'push' ? 1 : 0),
    blackjacks: stats.blackjacks + (blackjack ? 1 : 0),
    busts: stats.busts + busts,
    net: stats.net + net,
    biggestWin: Math.max(stats.biggestWin, net),
    peakBankroll: Math.max(stats.peakBankroll, game.bankroll),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    decisions: stats.decisions,
    correct: stats.correct,
  }

  historyId += 1
  const entry: HistoryEntry = { id: historyId, net, bet, result, blackjack }
  return { stats: next, entry }
}

export interface Achievement {
  id: string
  title: string
  desc: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'First Win', desc: 'Win your first hand' },
  { id: 'blackjack', title: 'Natural', desc: 'Get a blackjack' },
  { id: 'big_win', title: 'High Roller', desc: 'Win $500 or more on one hand' },
  { id: 'streak5', title: 'Hot Streak', desc: 'Win 5 hands in a row' },
  { id: 'hands100', title: 'Regular', desc: 'Play 100 hands' },
  { id: 'rich', title: 'Whale', desc: 'Reach a $2,500 balance' },
  { id: 'counter', title: 'Card Counter', desc: 'Turn on the counting trainer' },
  { id: 'sharp', title: 'Textbook', desc: '90% strategy accuracy over 50+ decisions' },
]

export interface AchievementContext {
  stats: Stats
  bankroll: number
  countingEnabled: boolean
}

/** Returns the ids of every achievement currently satisfied. */
export function satisfiedAchievements(ctx: AchievementContext): string[] {
  const { stats, bankroll, countingEnabled } = ctx
  const ids: string[] = []
  if (stats.wins >= 1) ids.push('first_win')
  if (stats.blackjacks >= 1) ids.push('blackjack')
  if (stats.biggestWin >= 500) ids.push('big_win')
  if (stats.bestStreak >= 5) ids.push('streak5')
  if (stats.hands >= 100) ids.push('hands100')
  if (Math.max(stats.peakBankroll, bankroll) >= 2500) ids.push('rich')
  if (countingEnabled) ids.push('counter')
  if (stats.decisions >= 50 && stats.correct / stats.decisions >= 0.9) ids.push('sharp')
  return ids
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Local calendar date, for the once-per-day bonus. */
export function today(): string {
  return dateKey(new Date())
}

/** Yesterday's local calendar date, for detecting a continued login streak. */
export function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

// Daily bonus grows with the login streak to reward coming back, then caps.
export const DAILY_BONUS_BASE = 500
export const DAILY_BONUS_STEP = 100
export const DAILY_BONUS_MAX = 1500

/** Bonus payout for the given streak day (day 1 = base, capped at the max). */
export function dailyBonusFor(streakDay: number): number {
  const day = Math.max(1, streakDay)
  return Math.min(DAILY_BONUS_MAX, DAILY_BONUS_BASE + (day - 1) * DAILY_BONUS_STEP)
}
