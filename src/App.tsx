import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Header } from './components/Header'
import { Table } from './components/Table'
import { Dock } from './components/Dock'
import { SettingsSheet } from './components/SettingsSheet'
import { StatsSheet } from './components/StatsSheet'
import { Toasts } from './components/Toasts'
import { useGameStore } from './store/useGameStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const syncSettings = useGameStore((s) => s.syncSettings)
  const theme = useGameStore((s) => s.theme)
  const cardBack = useGameStore((s) => s.cardBack)

  useEffect(() => {
    syncSettings()
  }, [syncSettings])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.cardback = cardBack
  }, [theme, cardBack])

  return (
    <div className="app">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
      />
      <Table />
      <Dock />
      <Toasts />
      <AnimatePresence>
        {settingsOpen && (
          <SettingsSheet onClose={() => setSettingsOpen(false)} />
        )}
        {statsOpen && <StatsSheet onClose={() => setStatsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
