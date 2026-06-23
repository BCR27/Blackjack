// Best-effort haptic feedback. Android/Chrome support the Vibration API
// directly. iOS Safari does not expose it, so we fall back to a hidden
// <label><input switch> toggle, which triggers a subtle system haptic on
// iOS 17.4+. On unsupported devices this silently does nothing.

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning'

let enabled = true
let switchEl: HTMLLabelElement | null = null

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 18,
  heavy: 30,
  success: [12, 40, 12],
  warning: [20, 60, 20],
}

export function setHapticsEnabled(value: boolean): void {
  enabled = value
}

function ensureSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null
  if (switchEl) return switchEl
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.position = 'absolute'
  label.style.opacity = '0'
  label.style.pointerEvents = 'none'
  label.style.width = '0'
  label.style.height = '0'
  const input = document.createElement('input')
  input.type = 'checkbox'
  // The `switch` attribute is what produces the haptic on supported iOS.
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.body.appendChild(label)
  switchEl = label
  return label
}

export function haptic(style: HapticStyle = 'light'): void {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERNS[style])
    return
  }
  // iOS fallback: toggling a switch control nudges the Taptic engine.
  const el = ensureSwitch()
  if (el) el.click()
}
