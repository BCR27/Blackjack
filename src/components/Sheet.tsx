import {
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { CloseIcon } from './icons'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Bottom sheet. Open/close is animated on the outer wrapper; swipe-to-dismiss
 * is handled manually on the grab handle only. Crucially we do NOT use Framer's
 * `drag` on the sheet itself — that sets `touch-action` on the whole element and
 * blocks the body from scrolling and taps from registering.
 */
export function Sheet({ title, onClose, children }: SheetProps) {
  const dragY = useMotionValue(0)

  // Close on Escape — this also runs as an installable web app on the desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const startDrag = (e: ReactPointerEvent) => {
    const startY = e.clientY
    const move = (ev: PointerEvent) => dragY.set(Math.max(0, ev.clientY - startY))
    const end = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      if (ev.clientY - startY > 110) onClose()
      else animate(dragY, 0, { type: 'spring', stiffness: 500, damping: 40 })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }

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
        className="sheet-slide"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 460, damping: 42 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div className="sheet" style={{ y: dragY }}>
          <div className="sheet-grabber-zone" onPointerDown={startDrag}>
            <div className="sheet-grabber" />
          </div>
          <div className="sheet-header">
            <h2>{title}</h2>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="sheet-body">{children}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
