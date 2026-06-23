import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  activeHand,
  canDouble,
  canHit,
  canSplit,
  canSurrender,
  concludeRound,
  dealerHit,
  dealerShouldHit,
  deal as engineDeal,
  double as engineDouble,
  hit as engineHit,
  nextRound as engineNextRound,
  split as engineSplit,
  stand as engineStand,
  surrender as engineSurrender,
  type GameState,
} from '../game/engine'
import { createInitialState } from '../game/engine'
import {
  DEFAULT_RULES,
  MIN_BET,
  STARTING_BANKROLL,
  type Rules,
} from '../game/rules'
import { basicStrategy, type Action } from '../game/strategy'
import {
  ACHIEVEMENTS,
  DAILY_BONUS,
  initialStats,
  recordRound,
  satisfiedAchievements,
  today,
  type HistoryEntry,
  type Stats,
} from '../game/stats'
import { playSound, primeAudio, setSoundEnabled } from '../audio/sound'
import { haptic, setHapticsEnabled } from '../audio/haptics'

export type ThemeName = 'green' | 'midnight' | 'royal'
export type CardBackName = 'classic' | 'gold' | 'crimson'

export interface Toast {
  id: number
  text: string
}

interface Store {
  game: GameState
  soundEnabled: boolean
  hapticsEnabled: boolean
  coachEnabled: boolean
  countingEnabled: boolean
  theme: ThemeName
  cardBack: CardBackName
  lastBet: number
  stats: Stats
  history: HistoryEntry[]
  achievements: string[]
  lastBonusDate: string
  toasts: Toast[]

  addChip: (value: number) => void
  clearBet: () => void
  rebet: () => void

  deal: () => void
  hit: () => void
  stand: () => void
  double: () => void
  split: () => void
  surrender: () => void
  nextRound: () => void

  updateRules: (patch: Partial<Rules>) => void
  toggleSound: () => void
  toggleHaptics: () => void
  toggleCoach: () => void
  toggleCounting: () => void
  setTheme: (theme: ThemeName) => void
  setCardBack: (cardBack: CardBackName) => void
  claimDailyBonus: () => void
  dismissToast: (id: number) => void
  resetBankroll: () => void
  resetStats: () => void
  syncSettings: () => void
}

const DEAL_TICK_MS = 230
const DEALER_REVEAL_MS = 550
const DEALER_DRAW_MS = 650
const RESULT_DELAY_MS = 450

let toastSeq = 0
const nextToastId = (): number => {
  toastSeq += 1
  return toastSeq
}

function dealCadence(count: number): void {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => playSound('deal'), i * DEAL_TICK_MS)
  }
}

function announceResult(game: GameState): void {
  const result = game.roundResult
  if (!result) return
  const hasBlackjack = game.hands.some((h) => h.outcome === 'blackjack')
  const allBust = game.hands.every((h) => h.outcome === 'bust')

  window.setTimeout(() => {
    if (hasBlackjack) {
      playSound('blackjack')
      haptic('success')
    } else if (result.net > 0) {
      playSound('win')
      haptic('success')
    } else if (result.net < 0) {
      playSound(allBust ? 'bust' : 'lose')
      haptic('warning')
    } else {
      playSound('push')
      haptic('light')
    }
  }, RESULT_DELAY_MS)
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => {
      /** Toast any achievements newly satisfied by the current state. */
      const checkAchievements = (): void => {
        const { stats, achievements, countingEnabled, game } = get()
        const now = satisfiedAchievements({
          stats,
          bankroll: game.bankroll,
          countingEnabled,
        })
        const fresh = now.filter((id) => !achievements.includes(id))
        if (fresh.length === 0) return
        const toasts = [...get().toasts]
        for (const id of fresh) {
          const a = ACHIEVEMENTS.find((x) => x.id === id)
          if (a) toasts.push({ id: nextToastId(), text: `🏆 ${a.title}` })
        }
        set({ achievements: [...achievements, ...fresh], toasts })
        haptic('success')
      }

      /** Finalize a settled round: fold stats, sounds, achievements. */
      const onSettled = (game: GameState): void => {
        const { stats, history } = get()
        const { stats: nextStats, entry } = recordRound(stats, game)
        set({ stats: nextStats, history: [entry, ...history].slice(0, 50) })
        announceResult(game)
        checkAchievements()
      }

      /** Compare a player's action to basic strategy for accuracy tracking. */
      const recordDecision = (game: GameState, action: Action): void => {
        const hand = activeHand(game)
        if (game.phase !== 'playerTurn' || !hand) return
        const recommended = basicStrategy(hand.cards, game.dealer[0], game.rules, {
          canDouble: canDouble(game),
          canSplit: canSplit(game),
          canSurrender: canSurrender(game),
        })
        const { stats } = get()
        set({
          stats: {
            ...stats,
            decisions: stats.decisions + 1,
            correct: stats.correct + (recommended === action ? 1 : 0),
          },
        })
      }

      const runDealer = (): void => {
        playSound('flip')
        const step = (): void => {
          const g = get().game
          if (g.phase !== 'dealerTurn') return
          if (dealerShouldHit(g)) {
            set({ game: dealerHit(g) })
            playSound('deal')
            window.setTimeout(step, DEALER_DRAW_MS)
          } else {
            const settled = concludeRound(get().game)
            set({ game: settled })
            onSettled(settled)
          }
        }
        window.setTimeout(step, DEALER_REVEAL_MS)
      }

      const afterPlayerAction = (g: GameState): void => {
        set({ game: g })
        if (g.phase === 'dealerTurn') runDealer()
        else if (g.phase === 'settled') onSettled(g)
      }

      return {
        game: createInitialState(DEFAULT_RULES, STARTING_BANKROLL),
        soundEnabled: true,
        hapticsEnabled: true,
        coachEnabled: false,
        countingEnabled: false,
        theme: 'green',
        cardBack: 'classic',
        lastBet: 0,
        stats: initialStats,
        history: [],
        achievements: [],
        lastBonusDate: '',
        toasts: [],

        addChip: (value) => {
          const { game } = get()
          if (game.phase !== 'betting') return
          if (game.bet + value > game.bankroll) return
          primeAudio()
          set({ game: { ...game, bet: game.bet + value } })
          playSound('chip')
          haptic('light')
        },

        clearBet: () => {
          const { game } = get()
          if (game.phase !== 'betting') return
          set({ game: { ...game, bet: 0 } })
          haptic('light')
        },

        rebet: () => {
          const { game, lastBet } = get()
          if (game.phase !== 'betting' || lastBet <= 0) return
          const bet = Math.min(lastBet, game.bankroll)
          set({ game: { ...game, bet } })
          playSound('chip')
          haptic('light')
        },

        deal: () => {
          const { game } = get()
          if (game.phase !== 'betting') return
          if (game.bet < MIN_BET || game.bet > game.bankroll) return
          primeAudio()
          const next = engineDeal(game)
          set({ game: next, lastBet: game.bet })
          dealCadence(4)
          haptic('medium')
          if (next.phase === 'settled') onSettled(next)
        },

        hit: () => {
          const { game } = get()
          if (!canHit(game)) return
          recordDecision(game, 'hit')
          const idx = game.activeIndex
          const next = engineHit(game)
          playSound('deal')
          haptic('light')
          if (next.hands[idx]?.outcome === 'bust') {
            playSound('bust')
            haptic('warning')
          }
          afterPlayerAction(next)
        },

        stand: () => {
          const { game } = get()
          if (!canHit(game)) return
          recordDecision(game, 'stand')
          playSound('button')
          haptic('light')
          afterPlayerAction(engineStand(game))
        },

        double: () => {
          const { game } = get()
          if (!canDouble(game)) return
          recordDecision(game, 'double')
          const idx = game.activeIndex
          const next = engineDouble(game)
          playSound('chip')
          window.setTimeout(() => playSound('deal'), 120)
          haptic('medium')
          if (next.hands[idx]?.outcome === 'bust') {
            window.setTimeout(() => playSound('bust'), 260)
            haptic('warning')
          }
          afterPlayerAction(next)
        },

        split: () => {
          const { game } = get()
          if (!canSplit(game)) return
          recordDecision(game, 'split')
          playSound('chip')
          dealCadence(2)
          haptic('medium')
          afterPlayerAction(engineSplit(game))
        },

        surrender: () => {
          const { game } = get()
          if (!canSurrender(game)) return
          recordDecision(game, 'surrender')
          playSound('lose')
          haptic('warning')
          afterPlayerAction(engineSurrender(game))
        },

        nextRound: () => {
          const { game } = get()
          if (game.phase !== 'settled') return
          haptic('light')
          set({ game: engineNextRound(game) })
        },

        updateRules: (patch) => {
          const { game } = get()
          const rules = { ...game.rules, ...patch }
          const shoe =
            patch.decks !== undefined && patch.decks !== game.rules.decks
              ? []
              : game.shoe
          set({ game: { ...game, rules, shoe } })
        },

        toggleSound: () => {
          const value = !get().soundEnabled
          setSoundEnabled(value)
          set({ soundEnabled: value })
          if (value) {
            primeAudio()
            playSound('chip')
          }
          haptic('light')
        },

        toggleHaptics: () => {
          const value = !get().hapticsEnabled
          setHapticsEnabled(value)
          set({ hapticsEnabled: value })
          if (value) haptic('medium')
        },

        toggleCoach: () => {
          set({ coachEnabled: !get().coachEnabled })
          haptic('light')
        },

        toggleCounting: () => {
          set({ countingEnabled: !get().countingEnabled })
          haptic('light')
          checkAchievements()
        },

        setTheme: (theme) => {
          set({ theme })
          haptic('light')
        },

        setCardBack: (cardBack) => {
          set({ cardBack })
          haptic('light')
        },

        claimDailyBonus: () => {
          if (get().lastBonusDate === today()) return
          const { game } = get()
          set({
            game: { ...game, bankroll: game.bankroll + DAILY_BONUS },
            lastBonusDate: today(),
            toasts: [
              ...get().toasts,
              { id: nextToastId(), text: `Daily bonus +$${DAILY_BONUS}` },
            ],
          })
          playSound('win')
          haptic('success')
        },

        dismissToast: (id) => {
          set({ toasts: get().toasts.filter((t) => t.id !== id) })
        },

        resetBankroll: () => {
          const { game } = get()
          set({ game: createInitialState(game.rules, STARTING_BANKROLL) })
          playSound('chip')
          haptic('success')
        },

        resetStats: () => {
          set({ stats: initialStats, history: [], achievements: [] })
          haptic('medium')
        },

        syncSettings: () => {
          setSoundEnabled(get().soundEnabled)
          setHapticsEnabled(get().hapticsEnabled)
        },
      }
    },
    {
      name: 'blackjack-state-v1',
      version: 2,
      partialize: (s) => ({
        bankroll: s.game.bankroll,
        rules: s.game.rules,
        lastBet: s.lastBet,
        soundEnabled: s.soundEnabled,
        hapticsEnabled: s.hapticsEnabled,
        coachEnabled: s.coachEnabled,
        countingEnabled: s.countingEnabled,
        theme: s.theme,
        cardBack: s.cardBack,
        stats: s.stats,
        history: s.history,
        achievements: s.achievements,
        lastBonusDate: s.lastBonusDate,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<{
          bankroll: number
          rules: Rules
          lastBet: number
          soundEnabled: boolean
          hapticsEnabled: boolean
          coachEnabled: boolean
          countingEnabled: boolean
          theme: ThemeName
          cardBack: CardBackName
          stats: Stats
          history: HistoryEntry[]
          achievements: string[]
          lastBonusDate: string
        }>
        const rules = { ...DEFAULT_RULES, ...(p.rules ?? {}) }
        const bankroll =
          typeof p.bankroll === 'number' ? p.bankroll : STARTING_BANKROLL
        const lastBet = p.lastBet ?? 0
        const game = createInitialState(rules, bankroll)
        game.bet = Math.min(lastBet, bankroll)
        return {
          ...current,
          game,
          lastBet,
          soundEnabled: p.soundEnabled ?? true,
          hapticsEnabled: p.hapticsEnabled ?? true,
          coachEnabled: p.coachEnabled ?? false,
          countingEnabled: p.countingEnabled ?? false,
          theme: p.theme ?? 'green',
          cardBack: p.cardBack ?? 'classic',
          stats: { ...initialStats, ...(p.stats ?? {}) },
          history: p.history ?? [],
          achievements: p.achievements ?? [],
          lastBonusDate: p.lastBonusDate ?? '',
        }
      },
    },
  ),
)
