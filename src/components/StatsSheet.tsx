import { motion, useDragControls } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { ACHIEVEMENTS } from '../game/stats'
import { CloseIcon } from './icons'

function pct(n: number, d: number): string {
  if (d === 0) return '—'
  return `${Math.round((n / d) * 100)}%`
}

function money(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}$${Math.abs(n).toLocaleString()}`
}

export function StatsSheet({ onClose }: { onClose: () => void }) {
  const stats = useGameStore((s) => s.stats)
  const history = useGameStore((s) => s.history)
  const achievements = useGameStore((s) => s.achievements)
  const resetStats = useGameStore((s) => s.resetStats)
  const dragControls = useDragControls()

  const cards: { label: string; value: string }[] = [
    { label: 'Hands', value: stats.hands.toLocaleString() },
    { label: 'Win rate', value: pct(stats.wins, stats.hands) },
    { label: 'Net', value: money(stats.net) },
    { label: 'Best streak', value: `${stats.bestStreak}` },
    { label: 'Blackjacks', value: `${stats.blackjacks}` },
    { label: 'Strategy', value: pct(stats.correct, stats.decisions) },
    { label: 'Peak balance', value: money(stats.peakBankroll) },
    { label: 'Biggest win', value: money(stats.biggestWin) },
  ]

  return (
    <motion.div
      className="sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 460, damping: 42 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) onClose()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grabber-zone"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="sheet-grabber" />
        </div>
        <div className="sheet-header">
          <h2>Stats</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="sheet-body">
          <div className="stats-grid">
            {cards.map((c) => (
              <div className="stat-card" key={c.label}>
                <span className="stat-value">{c.value}</span>
                <span className="stat-label">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="settings-section-title">Achievements</div>
          <div className="achievement-list">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = achievements.includes(a.id)
              return (
                <div
                  className={`achievement ${unlocked ? 'is-unlocked' : ''}`}
                  key={a.id}
                >
                  <span className="achievement-icon">{unlocked ? '🏆' : '🔒'}</span>
                  <span className="achievement-text">
                    <span className="achievement-title">{a.title}</span>
                    <span className="achievement-desc">{a.desc}</span>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="settings-section-title">Recent hands</div>
          <div className="settings-group">
            {history.length === 0 ? (
              <div className="settings-row history-empty">No hands played yet</div>
            ) : (
              history.slice(0, 12).map((h) => (
                <div className="settings-row history-row" key={h.id}>
                  <span>
                    {h.blackjack ? 'Blackjack' : h.result === 'win' ? 'Win' : h.result === 'lose' ? 'Loss' : 'Push'}
                    <span className="history-bet"> · ${h.bet}</span>
                  </span>
                  <span
                    className={`history-net ${
                      h.net > 0 ? 'pos' : h.net < 0 ? 'neg' : ''
                    }`}
                  >
                    {h.net > 0 ? '+' : h.net < 0 ? '−' : ''}${Math.abs(h.net)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="settings-group" style={{ marginTop: 14 }}>
            <button
              className="settings-row settings-row-button"
              onClick={resetStats}
            >
              <span>Reset stats &amp; achievements</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
