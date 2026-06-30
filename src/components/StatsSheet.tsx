import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { ACHIEVEMENTS } from '../game/stats'
import { Sheet } from './Sheet'

function pct(n: number, d: number): string {
  if (d === 0) return '—'
  return `${Math.round((n / d) * 100)}%`
}

function money(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}$${Math.abs(n).toLocaleString()}`
}

function ResetStatsRow() {
  const resetStats = useGameStore((s) => s.resetStats)
  const [confirm, setConfirm] = useState(false)

  return (
    <button
      className={`settings-row settings-row-button ${confirm ? 'is-confirming' : ''}`}
      onClick={() => {
        if (confirm) {
          resetStats()
          setConfirm(false)
        } else {
          setConfirm(true)
        }
      }}
      onBlur={() => setConfirm(false)}
    >
      <span>
        {confirm ? 'Tap again to confirm' : 'Reset stats & achievements'}
      </span>
    </button>
  )
}

export function StatsSheet({ onClose }: { onClose: () => void }) {
  const stats = useGameStore((s) => s.stats)
  const history = useGameStore((s) => s.history)
  const achievements = useGameStore((s) => s.achievements)

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
    <Sheet title="Stats" onClose={onClose}>
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
                {h.blackjack
                  ? 'Blackjack'
                  : h.result === 'win'
                    ? 'Win'
                    : h.result === 'lose'
                      ? 'Loss'
                      : 'Push'}
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
        <ResetStatsRow />
      </div>
    </Sheet>
  )
}
