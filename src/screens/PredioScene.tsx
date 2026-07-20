// Cena do "Prédio" (Cap. 4, compra na Loja de Upgrades) — sede própria, clima "corporate glass
// tower": janela panorâmica, paleta de aço/azul, quadro de estratégia (roadmap) em vez do mural
// de post-its, mesa de reunião no centro da sala (clientes corporativos, projetos de risco). Sem
// mesa de estagiário — nesta sede eles não aparecem na cena. Mesmo motor iso de GarageScene.tsx
// (projeção + mobília compartilhados via isoPrimitives/OfficeFurniture).
import {
  Box,
  ROOM_VIEWBOX,
  RoomShell,
  type Hotspot,
  iso,
  wallQuadA,
  wallQuadB,
} from './isoPrimitives'
import { OfficeFurniture } from './OfficeFurniture'

export function PredioScene({
  level,
  onSelect,
}: {
  level: number
  onSelect: (h: Hotspot) => void
}) {
  return (
    <svg
      className="garage predio"
      viewBox={ROOM_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Seu prédio em vista isométrica"
    >
      <RoomShell />

      {/* janela panorâmica na parede B — bem maior que a do Andar Inteiro (vista de skyline) */}
      <g className="window" aria-hidden="true">
        <polygon className="window-glass" points={wallQuadB(0.4, 3.9, 0.15, 2.15)} />
      </g>

      {/* porta na parede B — mesmo vão/técnica já validados nesta sessão */}
      <g
        className="hot"
        onClick={() => onSelect('door')}
        role="button"
        tabIndex={0}
        aria-label="Porta do prédio"
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

      {/* quadro branco de estratégia/roadmap (parede A) — hotspot 'board'. Mesmos limites já
          corrigidos do mural do Andar Inteiro (mesma mesa compartilhada, mesmo risco de colisão,
          já provado seguro nesta sessão). */}
      <g
        className="hot"
        onClick={() => onSelect('board')}
        role="button"
        tabIndex={0}
        aria-label="Quadro de estratégia"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect('board')
          }
        }}
      >
        <polygon className="panelboard" points={wallQuadA(0.25, 2.0, 0.65, 2.2)} />
        <line className="roadmap-mark" x1={iso(0, 0.5, 1.9)[0]} y1={iso(0, 0.5, 1.9)[1]} x2={iso(0, 1.8, 1.9)[0]} y2={iso(0, 1.8, 1.9)[1]} />
        <line className="roadmap-mark" x1={iso(0, 0.5, 1.55)[0]} y1={iso(0, 0.5, 1.55)[1]} x2={iso(0, 1.5, 1.55)[0]} y2={iso(0, 1.5, 1.55)[1]} />
        <polygon className="roadmap-box" points={wallQuadA(0.5, 0.85, 1.15, 1.4)} />
        <polygon className="roadmap-box" points={wallQuadA(1.05, 1.4, 1.15, 1.4)} />
        <line className="roadmap-mark" x1={iso(0, 0.85, 1.27)[0]} y1={iso(0, 0.85, 1.27)[1]} x2={iso(0, 1.05, 1.27)[0]} y2={iso(0, 1.05, 1.27)[1]} />
        <rect className="hit" x={240} y={18} width={45} height={88} />
      </g>

      <OfficeFurniture level={level} onSelect={onSelect} />

      {/* mesa de reunião + 4 cadeiras — centro da sala, decoração, sem hotspot. Longe da mobília
          compartilhada (y até 1.5, perto da parede A) e do tapete (y até 2.4). */}
      <Box x={2.1} y={3.1} z={0} w={1.9} d={1.1} h={0.6} tone="desk" />
      <Box x={2.35} y={2.85} z={0} w={0.35} d={0.3} h={0.42} tone="chair" />
      <Box x={3.3} y={2.85} z={0} w={0.35} d={0.3} h={0.42} tone="chair" />
      <Box x={2.35} y={4.25} z={0} w={0.35} d={0.3} h={0.42} tone="chair" />
      <Box x={3.3} y={4.25} z={0} w={0.35} d={0.3} h={0.42} tone="chair" />
    </svg>
  )
}
