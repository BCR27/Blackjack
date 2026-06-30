import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { STARTING_BANKROLL } from '../game/rules'
import {
  DIFFICULTIES,
  difficultyIndex,
  formatHouseEdge,
  nearestDifficultyIndex,
  oddsLabel,
} from '../game/difficulty'
import { ChevronIcon } from './icons'
import { Sheet } from './Sheet'

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'toggle-on' : ''}`}
      onClick={onChange}
    >
      <span className="toggle-knob" />
    </button>
  )
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          className={`segmented-item ${opt.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function DifficultyControl() {
  const rules = useGameStore((s) => s.game.rules)
  const updateRules = useGameStore((s) => s.updateRules)

  const exactIndex = difficultyIndex(rules)
  const isCustom = exactIndex === -1
  const sliderIndex = isCustom ? nearestDifficultyIndex(rules) : exactIndex
  const level = DIFFICULTIES[sliderIndex]

  return (
    <div className="difficulty">
      <div className="difficulty-head">
        <span className="difficulty-name">{isCustom ? 'Custom' : level.name}</span>
        <span className="difficulty-edge">
          <span className="difficulty-edge-value">{formatHouseEdge(rules)}</span>
          <span className="difficulty-edge-tag">{oddsLabel(rules)}</span>
        </span>
      </div>
      <p className="difficulty-blurb">
        {isCustom ? 'Your own table rules — tweak them below.' : level.blurb}
      </p>
      <input
        type="range"
        className="difficulty-slider"
        min={0}
        max={DIFFICULTIES.length - 1}
        step={1}
        value={sliderIndex}
        aria-label="Difficulty"
        onChange={(e) => updateRules(DIFFICULTIES[Number(e.target.value)].rules)}
      />
      <div className="difficulty-ticks">
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.id}
            className={`difficulty-tick ${
              !isCustom && i === sliderIndex ? 'is-active' : ''
            }`}
            onClick={() => updateRules(d.rules)}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function CustomRules() {
  const rules = useGameStore((s) => s.game.rules)
  const updateRules = useGameStore((s) => s.updateRules)
  const [open, setOpen] = useState(false)

  return (
    <div className="settings-group">
      <button
        className="settings-row settings-row-button disclosure"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>Custom rules</span>
        <ChevronIcon className={`disclosure-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && (
        <>
          <div className="settings-row settings-row-stacked">
            <span>Decks</span>
            <Segmented
              value={rules.decks}
              onChange={(v) => updateRules({ decks: v })}
              options={[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '6', value: 6 },
                { label: '8', value: 8 },
              ]}
            />
          </div>
          <div className="settings-row settings-row-stacked">
            <span>Blackjack pays</span>
            <Segmented
              value={rules.blackjackPayout}
              onChange={(v) => updateRules({ blackjackPayout: v })}
              options={[
                { label: '3 : 2', value: 1.5 },
                { label: '6 : 5', value: 1.2 },
              ]}
            />
          </div>
          <div className="settings-row">
            <span>Dealer hits soft 17</span>
            <Toggle
              checked={rules.dealerHitsSoft17}
              onChange={() =>
                updateRules({ dealerHitsSoft17: !rules.dealerHitsSoft17 })
              }
            />
          </div>
          <div className="settings-row">
            <span>Double after split</span>
            <Toggle
              checked={rules.doubleAfterSplit}
              onChange={() =>
                updateRules({ doubleAfterSplit: !rules.doubleAfterSplit })
              }
            />
          </div>
          <div className="settings-row">
            <span>Re-split aces</span>
            <Toggle
              checked={rules.resplitAces}
              onChange={() => updateRules({ resplitAces: !rules.resplitAces })}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ResetBalanceRow() {
  const resetBankroll = useGameStore((s) => s.resetBankroll)
  const [confirm, setConfirm] = useState(false)

  return (
    <button
      className={`settings-row settings-row-button ${confirm ? 'is-confirming' : ''}`}
      onClick={() => {
        if (confirm) {
          resetBankroll()
          setConfirm(false)
        } else {
          setConfirm(true)
        }
      }}
      onBlur={() => setConfirm(false)}
    >
      <span>{confirm ? 'Tap again to confirm' : 'Reset balance'}</span>
      <span className="settings-row-value">
        ${STARTING_BANKROLL.toLocaleString()}
      </span>
    </button>
  )
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled)
  const coachEnabled = useGameStore((s) => s.coachEnabled)
  const countingEnabled = useGameStore((s) => s.countingEnabled)
  const theme = useGameStore((s) => s.theme)
  const cardBack = useGameStore((s) => s.cardBack)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const toggleHaptics = useGameStore((s) => s.toggleHaptics)
  const toggleCoach = useGameStore((s) => s.toggleCoach)
  const toggleCounting = useGameStore((s) => s.toggleCounting)
  const setTheme = useGameStore((s) => s.setTheme)
  const setCardBack = useGameStore((s) => s.setCardBack)

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="settings-section-title">Difficulty</div>
      <div className="settings-group settings-group-pad">
        <DifficultyControl />
      </div>
      <CustomRules />

      <div className="settings-section-title">Coaching</div>
      <div className="settings-group">
        <div className="settings-row">
          <span>
            Strategy hints
            <span className="settings-row-sub">Highlight the optimal play</span>
          </span>
          <Toggle checked={coachEnabled} onChange={toggleCoach} />
        </div>
        <div className="settings-row">
          <span>
            Card-counting trainer
            <span className="settings-row-sub">Show the live Hi-Lo count</span>
          </span>
          <Toggle checked={countingEnabled} onChange={toggleCounting} />
        </div>
      </div>

      <div className="settings-section-title">Appearance</div>
      <div className="settings-group">
        <div className="settings-row settings-row-stacked">
          <span>Table</span>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { label: 'Green', value: 'green' as const },
              { label: 'Midnight', value: 'midnight' as const },
              { label: 'Royal', value: 'royal' as const },
            ]}
          />
        </div>
        <div className="settings-row settings-row-stacked">
          <span>Card backs</span>
          <Segmented
            value={cardBack}
            onChange={setCardBack}
            options={[
              { label: 'Classic', value: 'classic' as const },
              { label: 'Gold', value: 'gold' as const },
              { label: 'Crimson', value: 'crimson' as const },
            ]}
          />
        </div>
      </div>

      <div className="settings-section-title">Feel</div>
      <div className="settings-group">
        <div className="settings-row">
          <span>Sound effects</span>
          <Toggle checked={soundEnabled} onChange={toggleSound} />
        </div>
        <div className="settings-row">
          <span>Haptics</span>
          <Toggle checked={hapticsEnabled} onChange={toggleHaptics} />
        </div>
      </div>

      <div className="settings-section-title">Bankroll</div>
      <div className="settings-group">
        <ResetBalanceRow />
      </div>

      <p className="settings-footnote">
        Ad-free blackjack dealt from a fair, fully shuffled shoe. Your balance
        and preferences are saved on this device.
      </p>
    </Sheet>
  )
}
