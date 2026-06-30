# Blackjack

A crisp, ad-free, single-player blackjack table built as an installable iOS
web app (PWA). Player vs. dealer, classic casino-green felt, full table actions,
chips and bankroll, sound and haptics — no accounts, no tracking, fully offline.

## Features

- **Full table play** — hit, stand, double down, split (incl. split aces).
- **Chips & bankroll** — place bets with chip stacks; balance is saved on your
  device. Come back daily for an escalating streak bonus.
- **Difficulty, quantified** — a single slider (Easy → Vegas) bundles the house
  rules and shows the resulting house edge, so you always know the odds. Power
  users can still tune every rule under *Custom rules*.
- **How to play & strategy** — a built-in guide with a colour-coded basic
  strategy chart, generated from the same engine that powers the live coach.
- **Coaching** — optional strategy hints and a live Hi-Lo card-counting trainer.
- **Stats & achievements** — win rate, streaks, strategy accuracy, recent hands,
  and unlockable achievements, all stored locally.
- **Sound & haptics** — synthesized card/chip sounds (no audio files) and
  best-effort haptic feedback.
- **Installable PWA** — add to your home screen for a full-screen, native-feeling
  experience that works offline, and a framed phone-width layout on the desktop.

## Tech

- React 19 + TypeScript, built with Vite
- Zustand for state (with `localStorage` persistence)
- Framer Motion for card/chip animation
- `vite-plugin-pwa` for the service worker + web manifest

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
npm run icons      # regenerate the app icons (pure Node, no deps)
```

## Install on iPhone

1. Open the deployed URL in Safari.
2. Tap the Share button → **Add to Home Screen**.
3. Launch it from the home screen for the full-screen app experience.

## Game rules

Standard Vegas blackjack. The dealer peeks for blackjack on a ten or ace
up-card and blackjacks pay 3:2 by default. Pick a difficulty for a balanced
rule set, or open *Custom rules* in Settings to change deck count, dealer
soft-17, payout (3:2 / 6:5), double-after-split, and re-split aces. The payout
engine settles money by construction — every wager is returned, won, or lost
exactly once per round — and the cards are dealt from a fairly shuffled shoe.
