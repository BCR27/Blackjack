# Blackjack

A crisp, ad-free, single-player blackjack table built as an installable iOS
web app (PWA). Player vs. dealer, classic casino-green felt, full table actions,
chips and bankroll, sound and haptics — no accounts, no tracking, fully offline.

## Features

- **Full table play** — hit, stand, double down, split (incl. split aces),
  insurance, and late surrender.
- **Chips & bankroll** — place bets with chip stacks; balance is saved on your
  device.
- **Configurable house rules** — decks (1/2/6/8), dealer hits/stands soft 17,
  blackjack pays 3:2 or 6:5, double-after-split, late surrender, re-split aces.
- **Sound & haptics** — synthesized card/chip sounds (no audio files) and
  best-effort haptic feedback.
- **Installable PWA** — add to your iPhone home screen for a full-screen,
  native-feeling experience that works offline.

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
up-card, blackjacks pay 3:2 by default, and all rules can be changed in the
in-app Settings sheet. Engine payout logic is covered by a headless test suite
(money conservation is verified across 50,000 simulated rounds).
