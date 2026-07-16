// Cena isométrica da garagem — o modo de jogo (estilo Game Dev Tycoon):
// você está dentro do espaço, na frente do PC, e ele evolui com o hardware.
// Projeção iso via SVG gerado por código (nada de path data na mão) → leve, offline,
// escala perfeito no mobile e combina com o visual neon-terminal do jogo.

type Pt = [number, number]

// Projeção isométrica 2:1. x cresce p/ direita-baixo, y p/ esquerda-baixo, z p/ cima.
const TW = 44
const TH = 22
const TZ = 38
const OX = 238
const OY = 104
const iso = (x: number, y: number, z = 0): Pt => [
  OX + (x - y) * (TW / 2),
  OY + (x + y) * (TH / 2) - z * TZ,
]
const pts = (...ps: Pt[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

const COLS = 6
const ROWS = 5
const WH = 2.4 // altura das paredes (unidades)

// viewBox justo nos limites do conteúdo (X 128–370, Y 13–225 + folga):
// em pé no celular, o quarto ocupa a largura toda em vez de boiar num mar preto.
export const GARAGE_VIEWBOX = '114 4 262 236'

// Quadrilátero num plano de parede (y=0 → parede A; x=0 → parede B).
const wallQuadA = (x1: number, x2: number, z1: number, z2: number) =>
  pts(iso(x1, 0, z1), iso(x2, 0, z1), iso(x2, 0, z2), iso(x1, 0, z2))
const wallQuadB = (y1: number, y2: number, z1: number, z2: number) =>
  pts(iso(0, y1, z1), iso(0, y2, z1), iso(0, y2, z2), iso(0, y1, z2))

// Caixa (cuboide): topo + duas faces visíveis (+x e +y), sombreadas p/ dar volume.
function Box({
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

function Leds({ x, y, z, n, cls }: { x: number; y: number; z: number; n: number; cls: string }) {
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

export function GarageScene({
  level,
  notify,
  onSelect,
}: {
  level: number
  /** Contratos esperando → badge de notificação sobre a porta. */
  notify: number
  onSelect: (h: Hotspot) => void
}) {
  // Grade do piso
  const grid: Pt[][] = []
  for (let i = 0; i <= COLS; i++) grid.push([iso(i, 0), iso(i, ROWS)])
  for (let j = 0; j <= ROWS; j++) grid.push([iso(0, j), iso(COLS, j)])

  const floor = pts(iso(0, 0), iso(COLS, 0), iso(COLS, ROWS), iso(0, ROWS))
  const wallA = pts(iso(0, 0, 0), iso(COLS, 0, 0), iso(COLS, 0, WH), iso(0, 0, WH)) // direita-fundo (y=0)
  const wallB = pts(iso(0, 0, 0), iso(0, ROWS, 0), iso(0, ROWS, WH), iso(0, 0, WH)) // esquerda-fundo (x=0)

  // Porta na parede B (x=0), y 1.4..2.6
  const door = wallQuadB(1.4, 2.6, 0, 1.9)
  // Quadro de skills (corkboard) na parede A (y=0)
  const board = wallQuadA(0.5, 2.0, 1.0, 2.0)
  // Tapete sob a mesa/cadeira
  const rug = pts(iso(2.2, 0.1), iso(5.3, 0.1), iso(5.3, 2.3), iso(2.2, 2.3))
  // Capacho na frente da porta
  const mat = pts(iso(0.12, 1.55), iso(0.75, 1.55), iso(0.75, 2.45), iso(0.12, 2.45))

  // Lâmpada pendente sobre a mesa (antes flutuava solta sobre o tapete)
  const lamp = { x: 3.4, y: 1.2 }
  const [bulbX, bulbY] = iso(lamp.x, lamp.y, 1.78)
  const [poolX, poolY] = iso(lamp.x, lamp.y)

  const [badgeX, badgeY] = iso(0, 2.0, 2.2) // ancorado logo acima da porta

  return (
    <svg
      className="garage"
      viewBox={GARAGE_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Sua garagem em vista isométrica"
    >
      {/* paredes */}
      <polygon className="wall" points={wallA} />
      <polygon className="wall wall-b" points={wallB} />

      {/* portão de garagem (lâminas) no trecho direito da parede A */}
      <g className="roll-door">
        <polygon points={wallQuadA(4.55, 5.85, 0, 2.0)} />
        {[0.4, 0.8, 1.2, 1.6].map((z) => (
          <line
            key={z}
            x1={iso(4.55, 0, z)[0]}
            y1={iso(4.55, 0, z)[1]}
            x2={iso(5.85, 0, z)[0]}
            y2={iso(5.85, 0, z)[1]}
          />
        ))}
      </g>

      {/* pôster neon na parede B */}
      <g className="poster">
        <polygon points={wallQuadB(3.25, 4.2, 0.95, 1.85)} />
        <polygon className="p-art a1" points={wallQuadB(3.45, 3.7, 1.45, 1.66)} />
        <polygon className="p-art a2" points={wallQuadB(3.45, 4.0, 1.18, 1.36)} />
        <polygon className="p-art a3" points={wallQuadB(3.78, 4.0, 1.45, 1.66)} />
      </g>

      {/* piso + grade + luz */}
      <polygon className="floor" points={floor} />
      {grid.map(([a, b], i) => (
        <line key={i} className="grid" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      ))}
      <ellipse className="light-pool" cx={poolX} cy={poolY} rx={62} ry={30} />
      <polygon className="rug" points={rug} />
      <polygon className="door-mat" points={mat} />

      {/* quadro de skills (parede A) — corkboard com recados */}
      <g
        className="hot"
        onClick={() => onSelect('board')}
        role="button"
        tabIndex={0}
        aria-label="Quadro de skills"
        onKeyDown={(e) => e.key === 'Enter' && onSelect('board')}
      >
        <polygon className="panelboard" points={board} />
        <polygon className="note n1" points={wallQuadA(0.68, 0.98, 1.55, 1.82)} />
        <polygon className="note n2" points={wallQuadA(1.1, 1.4, 1.5, 1.77)} />
        <polygon className="note n3" points={wallQuadA(1.52, 1.82, 1.56, 1.83)} />
        <polygon className="note n4" points={wallQuadA(0.75, 1.32, 1.12, 1.36)} />
        <rect className="hit" x={244} y={28} width={46} height={56} />
      </g>

      {/* porta (parede B) */}
      <g
        className="hot"
        onClick={() => onSelect('door')}
        role="button"
        tabIndex={0}
        aria-label={notify > 0 ? `Porta — ${notify} contrato(s) esperando` : 'Porta'}
        onKeyDown={(e) => e.key === 'Enter' && onSelect('door')}
      >
        <polygon className="door" points={door} />
        <polygon className="door-inset" points={wallQuadB(1.55, 2.45, 0.25, 1.05)} />
        <polygon className="door-inset" points={wallQuadB(1.55, 2.45, 1.2, 1.72)} />
        <circle className="door-knob" cx={iso(0, 1.58, 0.95)[0]} cy={iso(0, 1.58, 0.95)[1]} r={2} />
        {notify > 0 && (
          <g className="notify">
            <circle className="notify-dot" cx={badgeX} cy={badgeY} r={8.5} />
            <text className="notify-n" x={badgeX} y={badgeY + 3.2}>
              {notify}
            </text>
          </g>
        )}
        <rect className="hit" x={174} y={40} width={42} height={100} />
      </g>

      {/* rack de GPUs (nível 2) — canto do fundo */}
      {level >= 2 && (
        <g>
          <Box x={0.3} y={0.3} z={0} w={0.85} d={0.85} h={2.05} tone="rack" />
          <Leds x={0.35} y={1.15} z={0.3} n={6} cls="led cyan" />
        </g>
      )}

      {/* prateleira com livros sobre a mesa */}
      <Box x={2.7} y={0} z={1.58} w={1.8} d={0.2} h={0.07} tone="desk" />
      <Box x={2.85} y={0.02} z={1.65} w={0.14} d={0.16} h={0.34} tone="book1" />
      <Box x={3.03} y={0.02} z={1.65} w={0.14} d={0.16} h={0.3} tone="book2" />
      <Box x={3.21} y={0.02} z={1.65} w={0.14} d={0.16} h={0.37} tone="book3" />
      <Box x={4.1} y={0.02} z={1.65} w={0.3} d={0.18} h={0.22} tone="crate" />

      {/* mesa encostada na parede A */}
      <Box x={2.4} y={0.15} z={0} w={2.6} d={0.78} h={0.82} tone="desk" />

      {/* monitor principal (brilho cresce com o nível) */}
      <g
        className="hot"
        onClick={() => onSelect('pc')}
        role="button"
        tabIndex={0}
        aria-label="Computador — abrir a bancada"
        onKeyDown={(e) => e.key === 'Enter' && onSelect('pc')}
      >
        <Box x={3.0} y={0.34} z={0.82} w={0.95} d={0.12} h={level >= 1 ? 0.7 : 0.56} tone="mon" />
        <polygon
          className={`screen ${level >= 1 ? 'bright' : ''}`}
          points={pts(
            iso(3.05, 0.34, 0.9),
            iso(3.9, 0.34, 0.9),
            iso(3.9, 0.34, level >= 1 ? 1.46 : 1.32),
            iso(3.05, 0.34, level >= 1 ? 1.46 : 1.32),
          )}
        />
        {/* linhas de código "digitando" na tela */}
        <line
          className="code-line"
          x1={iso(3.12, 0.34, 1.24)[0]}
          y1={iso(3.12, 0.34, 1.24)[1]}
          x2={iso(3.62, 0.34, 1.24)[0]}
          y2={iso(3.62, 0.34, 1.24)[1]}
        />
        <line
          className="code-line slow"
          x1={iso(3.12, 0.34, 1.1)[0]}
          y1={iso(3.12, 0.34, 1.1)[1]}
          x2={iso(3.48, 0.34, 1.1)[0]}
          y2={iso(3.48, 0.34, 1.1)[1]}
        />
        {/* segundo monitor a partir do nível 1 */}
        {level >= 1 && (
          <>
            <Box x={4.05} y={0.34} z={0.82} w={0.8} d={0.12} h={0.6} tone="mon" />
            <polygon
              className="screen cyan"
              points={pts(iso(4.1, 0.34, 0.9), iso(4.8, 0.34, 0.9), iso(4.8, 0.34, 1.36), iso(4.1, 0.34, 1.36))}
            />
          </>
        )}
        {/* torre do PC ao lado da mesa (nível 0 e 1) */}
        {level < 2 && (
          <>
            <Box x={2.5} y={0.95} z={0} w={0.38} d={0.4} h={0.78} tone="tower" />
            <Leds x={2.55} y={0.95} z={0.2} n={level >= 1 ? 3 : 1} cls={`led ${level >= 1 ? 'cyan' : ''}`} />
          </>
        )}
        <rect className="hit" x={288} y={74} width={62} height={46} />
      </g>

      {/* cadeira + personagem (de costas, digitando — estilo GDT) */}
      <g className="dev">
        <Box x={3.15} y={1.05} z={0} w={0.6} d={0.55} h={0.45} tone="chair" />
        <Box x={3.24} y={1.08} z={0.45} w={0.44} d={0.36} h={0.6} tone="person" />
        <Box x={3.15} y={1.6} z={0.45} w={0.6} d={0.14} h={0.7} tone="chair" />
        {/* capuz atrás da cabeça */}
        <circle className="dev-hood" cx={iso(3.46, 1.28, 1.24)[0]} cy={iso(3.46, 1.28, 1.24)[1]} r={6.6} />
        <circle className="dev-head" cx={iso(3.46, 1.26, 1.28)[0]} cy={iso(3.46, 1.26, 1.28)[1]} r={5} />
      </g>

      {/* caixotes / tralha da garagem */}
      <Box x={4.7} y={3.3} z={0} w={0.75} d={0.75} h={0.75} tone="crate" />
      <Box x={4.75} y={3.35} z={0.75} w={0.6} d={0.6} h={0.55} tone="crate" />
      {level >= 1 && <Box x={0.5} y={3.6} z={0} w={0.7} d={0.7} h={0.7} tone="crate" />}

      {/* lâmpada pendente sobre a mesa */}
      <line
        className="lamp-wire"
        x1={iso(lamp.x, lamp.y, WH)[0]}
        y1={iso(lamp.x, lamp.y, WH)[1]}
        x2={bulbX}
        y2={bulbY - 4}
      />
      <circle className="bulb" cx={bulbX} cy={bulbY} r={4} />
    </svg>
  )
}
