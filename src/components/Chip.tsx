interface ChipColor {
  color: string
  dark: string
  text: string
}

const CHIP_COLORS: Record<number, ChipColor> = {
  5: { color: '#c0392b', dark: '#962d22', text: '#fff' },
  25: { color: '#1f7a44', dark: '#155c33', text: '#fff' },
  100: { color: '#2b2f36', dark: '#16181c', text: '#fff' },
  500: { color: '#6c3fb0', dark: '#512f86', text: '#fff' },
  1000: { color: '#d4a02a', dark: '#a87c19', text: '#3a2a00' },
}

function colorFor(value: number): ChipColor {
  return CHIP_COLORS[value] ?? CHIP_COLORS[100]
}

export function shortValue(value: number): string {
  if (value >= 1000) return `${value / 1000}K`
  return `${value}`
}

interface ChipProps {
  value: number
  size?: number
  label?: string
}

export function Chip({ value, size = 58, label }: ChipProps) {
  const c = colorFor(value)
  return (
    <span
      className="chip"
      style={
        {
          '--chip': c.color,
          '--chip-dark': c.dark,
          '--chip-text': c.text,
          width: size,
          height: size,
          fontSize: size * 0.3,
        } as React.CSSProperties
      }
    >
      <span className="chip-face">{label ?? shortValue(value)}</span>
    </span>
  )
}
