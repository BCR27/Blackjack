import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
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
import { playSound, primeAudio, setSoundEnabled } from '../audio/sound'
import { haptic, setHapticsEnabled } from '../audio/haptics'

interface Store {
  game: GameState
  soundEnabled: boolean
  hapticsEnabled: boolean
  lastBet: number

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
  resetBankroll: () => void
  syncAudioSettings: () => void
}

const DEAL_TICK_MS = 230
const DEALER_REVEAL_MS = 550
const DEALER_DRAW_MS = 650
const RESULT_DELAY_MS = 450

/** Play a satisfying staggered deal cadence for `count` cards. */
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
      /** Drive the dealer's turn one card at a time, then settle. */
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
            announceResult(settled)
          }
        }
        window.setTimeout(step, DEALER_REVEAL_MS)
      }

      const afterPlayerAction = (g: GameState): void => {
        set({ game: g })
        if (g.phase === 'dealerTurn') runDealer()
        else if (g.phase === 'settled') announceResult(g)
      }

      return {
        game: createInitialState(DEFAULT_RULES, STARTING_BANKROLL),
        soundEnabled: true,
        hapticsEnabled: true,
        lastBet: 0,

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
          if (next.phase === 'settled') announceResult(next)
        },

        hit: () => {
          const { game } = get()
          if (!canHit(game)) return
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
          playSound('button')
          haptic('light')
          afterPlayerAction(engineStand(game))
        },

        double: () => {
          const { game } = get()
          if (!canDouble(game)) return
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
          playSound('chip')
          dealCadence(2)
          haptic('medium')
          afterPlayerAction(engineSplit(game))
        },

        surrender: () => {
          const { game } = get()
          if (!canSurrender(game)) return
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
          // Changing deck count requires a fresh shoe.
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

        resetBankroll: () => {
          const { game } = get()
          set({
            game: {
              ...createInitialState(game.rules, STARTING_BANKROLL),
            },
          })
          playSound('chip')
          haptic('success')
        },

        syncAudioSettings: () => {
          setSoundEnabled(get().soundEnabled)
          setHapticsEnabled(get().hapticsEnabled)
        },
      }
    },
    {
      name: 'blackjack-state-v1',
      version: 1,
      partialize: (s) => ({
        bankroll: s.game.bankroll,
        rules: s.game.rules,
        lastBet: s.lastBet,
        soundEnabled: s.soundEnabled,
        hapticsEnabled: s.hapticsEnabled,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<{
              bankroll: number
              rules: Rules
              lastBet: number
              soundEnabled: boolean
              hapticsEnabled: boolean
            }>
          | undefined
        if (!p) return current
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
        }
      },
    },
  ),
)
