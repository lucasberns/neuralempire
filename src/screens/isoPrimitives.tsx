// Primitivas de projeção isométrica compartilhadas entre as cenas de sede (garagem, Sala
// Comercial, Andar Inteiro, Prédio, ...) — extraído de GarageScene.tsx quando a 3ª sala tornou
// reaproveitar essas peças mais barato que duplicá-las de novo.

export type Pt = [number, number]

// Projeção isométrica 2:1. x cresce p/ direita-baixo, y p/ esquerda-baixo, z p/ cima.
const TW = 44
const TH = 22
const TZ = 38
const OX = 238
const OY = 104
export const iso = (x: number, y: number, z = 0): Pt => [
  OX + (x - y) * (TW / 2),
  OY + (x + y) * (TH / 2) - z * TZ,
]
export const pts = (...ps: Pt[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export const COLS = 6
export const ROWS = 6
export const WH = 2.4 // altura das paredes (unidades)

// viewBox justo nos limites do conteúdo (sala 6×6 + folga):
// em pé no celular, o quarto ocupa a largura toda em vez de boiar num mar preto.
export const ROOM_VIEWBOX = '92 4 284 247'

// Quadrilátero num plano de parede (y=0 → parede A; x=0 → parede B).
export const wallQuadA = (x1: number, x2: number, z1: number, z2: number) =>
  pts(iso(x1, 0, z1), iso(x2, 0, z1), iso(x2, 0, z2), iso(x1, 0, z2))
export const wallQuadB = (y1: number, y2: number, z1: number, z2: number) =>
  pts(iso(0, y1, z1), iso(0, y2, z1), iso(0, y2, z2), iso(0, y1, z2))

// Caixa (cuboide): topo + duas faces visíveis (+x e +y), sombreadas p/ dar volume.
export function Box({
  x,
  y,
  z,
  w,
  d,
  h,
  tone = 'steel',
}: {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  tone?: string
}) {
  const top = pts(iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h))
  const faceR = pts(iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z))
  const faceL = pts(iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z))
  return (
    <g className={`box tone-${tone}`}>
      <polygon className="f-l" points={faceL} />
      <polygon className="f-r" points={faceR} />
      <polygon className="f-t" points={top} />
    </g>
  )
}

export function Leds({ x, y, z, n, cls }: { x: number; y: number; z: number; n: number; cls: string }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const [sx, sy] = iso(x, y, z + i * 0.22)
        return (
          <circle
            key={i}
            className={cls}
            cx={sx}
            cy={sy}
            r={2.1}
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        )
      })}
    </g>
  )
}

export type Hotspot = 'pc' | 'door' | 'board'

// Paredes+piso+grade+tapete: idêntico em toda sala (garagem, Sala Comercial, Andar Inteiro,
// Prédio, ...) — extraído quando a 3ª sala (Prédio) tornou reaproveitar mais barato que duplicar
// de novo. Cada sala desenha o que é seu (porta, janela, quadro, decoração) por cima/depois disso.
export function RoomShell() {
  const grid: Pt[][] = []
  for (let i = 0; i <= COLS; i++) grid.push([iso(i, 0), iso(i, ROWS)])
  for (let j = 0; j <= ROWS; j++) grid.push([iso(0, j), iso(COLS, j)])

  const floor = pts(iso(0, 0), iso(COLS, 0), iso(COLS, ROWS), iso(0, ROWS))
  const wallA = pts(iso(0, 0, 0), iso(COLS, 0, 0), iso(COLS, 0, WH), iso(0, 0, WH))
  const wallB = pts(iso(0, 0, 0), iso(0, ROWS, 0), iso(0, ROWS, WH), iso(0, 0, WH))
  const rugOuter = pts(iso(2.1, 0.05), iso(5.4, 0.05), iso(5.4, 2.4), iso(2.1, 2.4))
  const rugInner = pts(iso(2.25, 0.2), iso(5.25, 0.2), iso(5.25, 2.25), iso(2.25, 2.25))

  return (
    <>
      <polygon className="wall" points={wallA} />
      <polygon className="wall wall-b" points={wallB} />
      <polygon className="floor" points={floor} />
      {grid.map(([a, b], i) => (
        <line key={i} className="grid" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      ))}
      <polygon className="rug-outer" points={rugOuter} />
      <polygon className="rug-inner" points={rugInner} />
    </>
  )
}
