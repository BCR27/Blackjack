import { useGameStore } from '../store/useGameStore'
import { ChartIcon, GearIcon } from './icons'

interface HeaderProps {
  onOpenSettings: () => void
  onOpenStats: () => void
}

export function Header({ onOpenSettings, onOpenStats }: HeaderProps) {
  const bankroll = useGameStore((s) => s.game.bankroll)

  return (
    <header className="header">
      <div className="bankroll">
        <span className="bankroll-label">Balance</span>
        <span className="bankroll-amount">
          <span className="bankroll-currency">$</span>
          {bankroll.toLocaleString()}
        </span>
      </div>
      <div className="wordmark">21</div>
      <div className="header-actions">
        <button className="icon-button" onClick={onOpenStats} aria-label="Stats">
          <ChartIcon />
        </button>
        <button
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <GearIcon />
        </button>
      </div>
    </header>
  )
}
