import { motion } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { STARTING_BANKROLL } from '../game/rules'
import { CloseIcon } from './icons'

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

interface SettingsSheetProps {
  onClose: () => void
}

export function SettingsSheet({ onClose }: SettingsSheetProps) {
  const rules = useGameStore((s) => s.game.rules)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled)
  const coachEnabled = useGameStore((s) => s.coachEnabled)
  const countingEnabled = useGameStore((s) => s.countingEnabled)
  const theme = useGameStore((s) => s.theme)
  const cardBack = useGameStore((s) => s.cardBack)
  const updateRules = useGameStore((s) => s.updateRules)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const toggleHaptics = useGameStore((s) => s.toggleHaptics)
  const toggleCoach = useGameStore((s) => s.toggleCoach)
  const toggleCounting = useGameStore((s) => s.toggleCounting)
  const setTheme = useGameStore((s) => s.setTheme)
  const setCardBack = useGameStore((s) => s.setCardBack)
  const resetBankroll = useGameStore((s) => s.resetBankroll)

  return (
    <motion.div
      className="sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) onClose()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h2>Settings</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="sheet-body">
          <div className="settings-section-title">Table Rules</div>
          <div className="settings-group">
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
              <span>Late surrender</span>
              <Toggle
                checked={rules.surrenderAllowed}
                onChange={() =>
                  updateRules({ surrenderAllowed: !rules.surrenderAllowed })
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
          </div>

          <div className="settings-section-title">Coaching</div>
          <div className="settings-group">
            <div className="settings-row">
              <span>
                Strategy hints
                <span className="settings-row-sub">
                  Highlight the optimal play
                </span>
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
            <button
              className="settings-row settings-row-button"
              onClick={resetBankroll}
            >
              <span>Reset balance</span>
              <span className="settings-row-value">
                ${STARTING_BANKROLL.toLocaleString()}
              </span>
            </button>
          </div>

          <p className="settings-footnote">
            Ad-free blackjack. Your balance and preferences are saved on this
            device.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
