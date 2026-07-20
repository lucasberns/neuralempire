// Cena do "Andar Inteiro" (Cap. 3, compra na Loja de Upgrades) — loft startup: mural de
// kanban/post-its grande na parede, mesa em pé vazia ("vaga aberta", time crescendo). Mesmo
// motor iso de GarageScene.tsx (projeção + mobília compartilhados via isoPrimitives/
// OfficeFurniture), geometria de parede/decoração própria.
import {
  Box,
  COLS,
  ROOM_VIEWBOX,
  ROWS,
  WH,
  type Hotspot,
  iso,
  pts,
  wallQuadA,
  wallQuadB,
} from './isoPrimitives'
import { OfficeFurniture } from './OfficeFurniture'

export function AndarInteiroScene({
  level,
  internCount,
  onSelect,
}: {
  level: number
  internCount: number
  onSelect: (h: Hotspot) => void
}) {
  const grid: [number, number][][] = []
  for (let i = 0; i <= COLS; i++) grid.push([iso(i, 0), iso(i, ROWS)])
  for (let j = 0; j <= ROWS; j++) grid.push([iso(0, j), iso(COLS, j)])

  const floor = pts(iso(0, 0), iso(COLS, 0), iso(COLS, ROWS), iso(0, ROWS))
  const wallA = pts(iso(0, 0, 0), iso(COLS, 0, 0), iso(COLS, 0, WH), iso(0, 0, WH))
  const wallB = pts(iso(0, 0, 0), iso(0, ROWS, 0), iso(0, ROWS, WH), iso(0, 0, WH))

  const rugOuter = pts(iso(2.1, 0.05), iso(5.4, 0.05), iso(5.4, 2.4), iso(2.1, 2.4))
  const rugInner = pts(iso(2.25, 0.2), iso(5.25, 0.2), iso(5.25, 2.25), iso(2.25, 2.25))

  return (
    <svg
      className="garage andar-inteiro"
      viewBox={ROOM_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Seu andar inteiro em vista isométrica"
    >
      {/* paredes */}
      <polygon className="wall" points={wallA} />
      <polygon className="wall wall-b" points={wallB} />

      {/* janela na parede B — vidro com brilho, sem moldura (mesma técnica da Sala Comercial) */}
      <g className="window" aria-hidden="true">
        <polygon className="window-glass" points={wallQuadB(0.85, 3.35, 0.3, 1.9)} />
      </g>

      {/* porta na parede B — mesmo vão/técnica já validados nesta sessão pra Sala Comercial */}
      <g
        className="hot"
        onClick={() => onSelect('door')}
        role="button"
        tabIndex={0}
        aria-label="Porta do andar"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect('door')
          }
        }}
      >
        <polygon className="office-door" points={wallQuadB(4.07, 5.43, 0, 2.0)} />
        <polygon className="office-door-window" points={wallQuadB(4.21, 5.29, 0.9, 1.64)} />
        <circle className="led" cx={iso(0, 4.19, 0.7)[0]} cy={iso(0, 4.19, 0.7)[1]} r={1.2} />
        <rect className="hit" x={116} y={70} width={35} height={97} />
      </g>

      {/* piso + grade */}
      <polygon className="floor" points={floor} />
      {grid.map(([a, b], i) => (
        <line key={i} className="grid" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      ))}
      <polygon className="rug-outer" points={rugOuter} />
      <polygon className="rug-inner" points={rugInner} />

      {/* mural de kanban/post-its (parede A) — hotspot 'board', maior que o quadro original */}
      <g
        className="hot"
        onClick={() => onSelect('board')}
        role="button"
        tabIndex={0}
        aria-label="Mural de skills"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect('board')
          }
        }}
      >
        <polygon className="panelboard" points={wallQuadA(0.25, 2.3, 0.65, 2.2)} />
        <polygon className="note n1" points={wallQuadA(0.4, 0.68, 1.85, 2.1)} />
        <polygon className="note n3" points={wallQuadA(0.78, 1.06, 1.85, 2.1)} />
        <polygon className="note n2" points={wallQuadA(1.16, 1.44, 1.85, 2.1)} />
        <polygon className="note n2" points={wallQuadA(0.55, 0.83, 1.5, 1.75)} />
        <polygon className="note n1" points={wallQuadA(0.95, 1.23, 1.5, 1.75)} />
        <polygon className="note n4" points={wallQuadA(1.35, 1.63, 1.5, 1.75)} />
        <polygon className="note n3" points={wallQuadA(0.7, 0.98, 1.15, 1.4)} />
        <rect className="hit" x={240} y={20} width={52} height={88} />
      </g>

      <OfficeFurniture level={level} onSelect={onSelect} />

      {/* mesa em pé vazia — "vaga aberta", time crescendo, sem precisar desenhar mais gente */}
      <Box x={1.5} y={4.6} z={0} w={0.45} d={0.3} h={1.0} tone="desk" />

      {/* mesa do estagiário (GDD §4.2) — mesma posição/coordenadas de GarageScene.tsx */}
      {internCount > 0 && (
        <g className="intern-desk">
          <Box x={0.3} y={4.6} z={0} w={0.5} d={0.35} h={0.55} tone="desk" />
          <Box x={0.38} y={5.0} z={0} w={0.36} d={0.28} h={0.22} tone="chair" />
          <Box x={0.38} y={5.22} z={0.18} w={0.36} d={0.08} h={0.34} tone="chair" />
          <Box x={0.44} y={5.04} z={0.22} w={0.22} d={0.18} h={0.28} tone="intern" />
          <circle
            className="intern-hood"
            cx={iso(0.55, 5.13, 0.64)[0]}
            cy={iso(0.55, 5.13, 0.64)[1]}
            r={5.6}
          />
        </g>
      )}
    </svg>
  )
}
