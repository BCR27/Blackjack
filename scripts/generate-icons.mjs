// Generates all PWA / favicon PNGs with zero external dependencies.
// Renders a small casino scene (two fanned cards + a heart) on a green felt
// tile, supersampled 2x for clean edges, and encodes PNG via Node's zlib.

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '../public')

// ---- PNG encoding ---------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  // rows with filter byte 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- Scene ----------------------------------------------------------------

const lerp = (a, b, t) => a + (b - a) * t
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

function insideRoundedRect(lx, ly, hw, hh, cr) {
  const ax = Math.abs(lx)
  const ay = Math.abs(ly)
  if (ax > hw || ay > hh) return false
  if (ax <= hw - cr || ay <= hh - cr) return true
  const dx = ax - (hw - cr)
  const dy = ay - (hh - cr)
  return dx * dx + dy * dy <= cr * cr
}

function cardAt(nx, ny, cx, cy, angDeg, hw, hh, cr, withHeart) {
  const a = (angDeg * Math.PI) / 180
  const dx = nx - cx
  const dy = ny - cy
  const lx = dx * Math.cos(a) + dy * Math.sin(a)
  const ly = -dx * Math.sin(a) + dy * Math.cos(a)
  if (!insideRoundedRect(lx, ly, hw, hh, cr)) return null

  // thin border so overlapping white cards stay distinct
  const et = hw * 0.05
  const innerBorder = !insideRoundedRect(lx, ly, hw - et, hh - et, cr)
  let col = innerBorder ? [206, 203, 192] : [252, 248, 240]

  if (withHeart) {
    const hr = hh * 0.6
    const u = lx / hr
    const v = -(ly + hh * 0.04) / hr
    const f = Math.pow(u * u + v * v - 1, 3) - u * u * v * v * v
    if (f <= 0) col = [212, 50, 45]
  }
  return [col[0], col[1], col[2], 255]
}

function background(nx, ny, fullBleed) {
  const dx = nx - 0.5
  const dy = ny - 0.5
  const d = Math.sqrt(dx * dx + dy * dy)
  const t = Math.min(1, d / 0.62)
  const [r, g, b] = lerp3([31, 150, 89], [6, 60, 34], t)
  if (fullBleed) return [r, g, b, 255]
  if (insideRoundedRect(nx - 0.5, ny - 0.5, 0.5, 0.5, 0.2)) return [r, g, b, 255]
  return [0, 0, 0, 0]
}

function sceneColor(nx, ny, opts) {
  const cs = opts.contentScale
  const hw = 0.165 * cs
  const hh = 0.235 * cs
  const cr = 0.03 * cs

  const front = cardAt(nx, ny, 0.5 + 0.055 * cs, 0.5, -8, hw, hh, cr, true)
  if (front) return front
  const back = cardAt(nx, ny, 0.5 - 0.075 * cs, 0.5, 12, hw, hh, cr, false)
  if (back) return back
  return background(nx, ny, opts.fullBleed)
}

function render(size, opts) {
  const ss = 2 // supersample factor
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          const nx = (x + (sx + 0.5) / ss) / size
          const ny = (y + (sy + 0.5) / ss) / size
          const [cr, cg, cb, ca] = sceneColor(nx, ny, opts)
          const af = ca / 255
          r += cr * af
          g += cg * af
          b += cb * af
          a += ca
        }
      }
      const n = ss * ss
      const idx = (y * size + x) * 4
      const alpha = a / n
      // un-premultiply for storage
      const af = alpha > 0 ? alpha / 255 : 1
      rgba[idx] = Math.round(r / n / af)
      rgba[idx + 1] = Math.round(g / n / af)
      rgba[idx + 2] = Math.round(b / n / af)
      rgba[idx + 3] = Math.round(alpha)
    }
  }
  return encodePNG(size, size, rgba)
}

function write(path, buf) {
  const full = resolve(PUBLIC, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, buf)
  console.log(`  ${path}  (${(buf.length / 1024).toFixed(1)} KB)`)
}

console.log('Generating icons…')
write('icons/icon-192.png', render(192, { contentScale: 1, fullBleed: false }))
write('icons/icon-512.png', render(512, { contentScale: 1, fullBleed: false }))
write('icons/icon-maskable-512.png', render(512, { contentScale: 0.78, fullBleed: true }))
write('apple-touch-icon.png', render(180, { contentScale: 0.92, fullBleed: true }))
write('favicon.png', render(48, { contentScale: 0.96, fullBleed: true }))
console.log('Done.')
