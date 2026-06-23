// Haptic feedback. The `ios-vibrator-pro-max` polyfill (imported once in
// main.tsx) makes the standard Vibration API work on iOS 18+ Safari/PWAs;
// Android/Chrome support it natively. Haptics are most reliable when fired
// from within a user gesture (a tap) — iOS 18.4+ only grants a ~1s window
// after a real click. On unsupported devices this is a silent no-op.

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning'

let enabled = true

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 12,
  medium: 22,
  heavy: 38,
  success: [14, 45, 22],
  warning: [26, 60, 26],
}

export function setHapticsEnabled(value: boolean): void {
  enabled = value
}

export function haptic(style: HapticStyle = 'light'): void {
  if (!enabled) return
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  try {
    navigator.vibrate(PATTERNS[style])
  } catch {
    /* ignore unsupported environments */
  }
}
