// Gera os ícones do PWA na identidade do jogo (rede neural neon em fundo escuro),
// rasterizando em Node com supersampling — sem dependências (zlib do Node faz PNG).
import zlib from 'node:zlib'
import { writeFileSync } from 'node:fs'

const BG = [13, 17, 23]           // #0d1117
const LIME = [182, 241, 69]       // #b6f145
const CYAN = [88, 214, 255]       // #58d6ff

// Geometria no espaço 64x64 (idêntica ao favicon.svg).
const A = [19, 20.5], B = [19, 43.5], C = [45, 32]
const R_NODE = 5, R_OUT = 6.6, R_GLOW = 13, LW = 3.4 / 2

const distSeg = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const dist = (px, py, [cx, cy]) => Math.hypot(px - cx, py - cy)
const over = (bg, fg, a) => bg.map((c, i) => Math.round(c * (1 - a) + fg[i] * a))

// Cor (RGBA 0..255) de um ponto no espaço 64, dado se o fundo preenche (maskable=full).
function sample(x, y, gscale, fullBg) {
  // fundo: cantos arredondados (r=14) ou quadrado cheio no maskable
  let inBg = fullBg
  if (!fullBg) {
    const r = 14
    const qx = Math.max(r - x, x - (64 - r), 0)
    const qy = Math.max(r - y, y - (64 - r), 0)
    inBg = !(qx > 0 && qy > 0 && Math.hypot(qx, qy) > r)
  }
  if (!inBg) return [0, 0, 0, 0]
  let col = [...BG]
  // glyph num espaço escalado (maskable encolhe p/ safe zone)
  const gx = (x - 32) / gscale + 32, gy = (y - 32) / gscale + 32
  if (dist(gx, gy, C) <= R_GLOW) col = over(col, CYAN, 0.16)
  if (distSeg(gx, gy, A, C) <= LW || distSeg(gx, gy, B, C) <= LW) col = LIME.slice()
  if (dist(gx, gy, A) <= R_NODE || dist(gx, gy, B) <= R_NODE) col = LIME.slice()
  if (dist(gx, gy, C) <= R_OUT) col = CYAN.slice()
  return [col[0], col[1], col[2], 255]
}

function render(size, fullBg) {
  const gscale = fullBg ? 0.78 : 1
  const SS = 4 // supersampling p/ suavizar
  const buf = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const x = ((px + (sx + 0.5) / SS) / size) * 64
          const y = ((py + (sy + 0.5) / SS) / size) * 64
          const [cr, cg, cb, ca] = sample(x, y, gscale, fullBg)
          const af = ca / 255
          r += cr * af; g += cg * af; b += cb * af; a += ca
        }
      const n = SS * SS
      const af = a / 255 / n
      const o = (py * size + px) * 4
      // desfaz o premultiply p/ guardar cor + alpha
      buf[o] = af > 0 ? Math.round(r / n / af) : 0
      buf[o + 1] = af > 0 ? Math.round(g / n / af) : 0
      buf[o + 2] = af > 0 ? Math.round(b / n / af) : 0
      buf[o + 3] = Math.round(a / n)
    }
  }
  return buf
}

function png(size, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filtro none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = process.argv[2]
writeFileSync(`${out}/icon-192.png`, png(192, render(192, false)))
writeFileSync(`${out}/icon-512.png`, png(512, render(512, false)))
writeFileSync(`${out}/icon-maskable-512.png`, png(512, render(512, true)))
console.log('ok')
