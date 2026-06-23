// Lightweight Web Audio synthesizer — no audio files, so the bundle stays tiny
// and the sounds are crisp on every device. The context is created lazily and
// resumed on the first user gesture (required by iOS Safari).

type SoundName =
  | 'deal'
  | 'flip'
  | 'chip'
  | 'button'
  | 'win'
  | 'lose'
  | 'push'
  | 'blackjack'
  | 'bust'

let ctx: AudioContext | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setSoundEnabled(value: boolean): void {
  enabled = value
}

/** Call from within a user gesture to unlock audio on iOS. */
export function primeAudio(): void {
  getCtx()
}

function tone(
  c: AudioContext,
  opts: {
    freq: number
    start: number
    duration: number
    type?: OscillatorType
    gain?: number
    glideTo?: number
  },
): void {
  const { freq, start, duration, type = 'sine', gain = 0.18, glideTo } = opts
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(env).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noise(
  c: AudioContext,
  opts: { start: number; duration: number; freq: number; gain?: number },
): void {
  const { start, duration, freq, gain = 0.12 } = opts
  const frames = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 0.8
  const env = c.createGain()
  env.gain.setValueAtTime(gain, start)
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter).connect(env).connect(c.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

export function playSound(name: SoundName): void {
  if (!enabled) return
  const c = getCtx()
  if (!c) return
  const t = c.currentTime

  switch (name) {
    case 'deal':
      noise(c, { start: t, duration: 0.16, freq: 1700, gain: 0.14 })
      break
    case 'flip':
      noise(c, { start: t, duration: 0.12, freq: 2200, gain: 0.1 })
      break
    case 'chip':
      tone(c, { freq: 880, start: t, duration: 0.05, type: 'triangle', gain: 0.12 })
      tone(c, { freq: 1320, start: t + 0.04, duration: 0.06, type: 'triangle', gain: 0.1 })
      break
    case 'button':
      tone(c, { freq: 660, start: t, duration: 0.04, type: 'sine', gain: 0.08 })
      break
    case 'win':
      tone(c, { freq: 523.25, start: t, duration: 0.14, type: 'triangle' })
      tone(c, { freq: 659.25, start: t + 0.1, duration: 0.16, type: 'triangle' })
      tone(c, { freq: 783.99, start: t + 0.22, duration: 0.24, type: 'triangle' })
      break
    case 'blackjack':
      tone(c, { freq: 523.25, start: t, duration: 0.12, type: 'triangle' })
      tone(c, { freq: 659.25, start: t + 0.09, duration: 0.12, type: 'triangle' })
      tone(c, { freq: 783.99, start: t + 0.18, duration: 0.12, type: 'triangle' })
      tone(c, { freq: 1046.5, start: t + 0.27, duration: 0.3, type: 'triangle' })
      break
    case 'lose':
      tone(c, { freq: 392, start: t, duration: 0.2, type: 'sine', gain: 0.14, glideTo: 233.08 })
      break
    case 'bust':
      tone(c, { freq: 311.13, start: t, duration: 0.28, type: 'sawtooth', gain: 0.1, glideTo: 130.81 })
      break
    case 'push':
      tone(c, { freq: 440, start: t, duration: 0.12, type: 'sine', gain: 0.1 })
      break
  }
}
