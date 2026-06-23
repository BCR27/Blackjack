import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, type Toast } from '../store/useGameStore'

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      {toast.text}
    </motion.div>
  )
}

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts)
  const dismiss = useGameStore((s) => s.dismissToast)

  return (
    <div className="toast-wrap">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
