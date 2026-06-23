import { useGameStore } from '../store/useGameStore'
import { GearIcon } from './icons'

interface HeaderProps {
  onOpenSettings: () => void
}

export function Header({ onOpenSettings }: HeaderProps) {
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
      <button
        className="icon-button"
        onClick={onOpenSettings}
        aria-label="Settings"
      >
        <GearIcon />
      </button>
    </header>
  )
}
