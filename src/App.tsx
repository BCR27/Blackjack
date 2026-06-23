import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Header } from './components/Header'
import { Table } from './components/Table'
import { Dock } from './components/Dock'
import { SettingsSheet } from './components/SettingsSheet'
import { useGameStore } from './store/useGameStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const syncAudioSettings = useGameStore((s) => s.syncAudioSettings)

  useEffect(() => {
    syncAudioSettings()
  }, [syncAudioSettings])

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <Table />
      <Dock />
      <AnimatePresence>
        {settingsOpen && (
          <SettingsSheet onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
