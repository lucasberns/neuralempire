// Cena isométrica da garagem — o modo de jogo (estilo Game Dev Tycoon):
// você está dentro do espaço, na frente do PC, e ele evolui com o hardware.
// Projeção iso via SVG gerado por código (nada de path data na mão) → leve, offline,
// escala perfeito no mobile e combina com o visual neon-terminal do jogo.
import {
  Box,
  ROOM_VIEWBOX,
  ROWS,
  RoomShell,
  type Hotspot,
  type Pt,
  iso,
  pts,
  wallQuadA,
  wallQuadB,
} from './isoPrimitives'
import { OfficeFurniture } from './OfficeFurniture'

// Decoração da face frontal de uma caixa (etiqueta clara + 3 marcas escuras),
// como caixas de papelão de verdade — desenhada no mesmo plano da face "f-l" do Box.
function crateFace(x: number, y: number, d: number, w: number, h: number) {
  const label = pts(
    iso(x + w * 0.14, y + d, h * 0.56),
    iso(x + w * 0.48, y + d, h * 0.56),
    iso(x + w * 0.48, y + d, h * 0.76),
    iso(x + w * 0.14, y + d, h * 0.76),
  )
  const marks = [0.14, 0.27, 0.4].map((f) =>
    pts(
      iso(x + w * f, y + d, h * 0.28),
      iso(x + w * (f + 0.09), y + d, h * 0.28),
      iso(x + w * (f + 0.09), y + d, h * 0.38),
      iso(x + w * f, y + d, h * 0.38),
    ),
  )
  return (
    <>
      <polygon className="crate-label" points={label} />
      {marks.map((m, i) => (
        <polygon key={i} className="crate-mark" points={m} />
      ))}
    </>
  )
}

// Pilha de caixas — só a caixa de baixo (a de cima foi tirada, ficava perto
// demais do personagem), com fita cruzando topo+frente e o acabamento padrão.
// `big` varia o tamanho pra não ficarem todas iguais.
function CratePile({ x, y, big = 1 }: { x: number; y: number; big?: number }) {
  const w = 0.72 * big
  const d = 0.72 * big
  const h = 0.6 * big
  const tapeMidX = x + w * 0.5
  const tapeTopA = iso(x + w * 0.18, y + d, h)
  const tapeTopB = iso(x + w * 0.82, y, h)
  const tapeFlapTop = iso(tapeMidX, y + d, h)
  const tapeFlapBot = iso(tapeMidX, y + d, h * 0.8)
  return (
    <g>
      <Box x={x} y={y} z={0} w={w} d={d} h={h} tone="crate" />
      <line className="crate-tape" x1={tapeTopA[0]} y1={tapeTopA[1]} x2={tapeTopB[0]} y2={tapeTopB[1]} />
      <line className="crate-tape" x1={tapeFlapTop[0]} y1={tapeFlapTop[1]} x2={tapeFlapBot[0]} y2={tapeFlapBot[1]} />
      {crateFace(x, y, d, w, h)}
    </g>
  )
}

// Modelo 2: cluster de 3 caixas apoiadas (não empilhadas retas) — uma central, uma
// menor encostada à esquerda-atrás, uma menor ainda encostada à frente-direita.
// Ordem de pintura por profundidade (x+y): esquerda primeiro, central, frente por último.
function CratePileCluster({ x, y, big = 1 }: { x: number; y: number; big?: number }) {
  const wA = 0.6 * big
  const dA = 0.6 * big
  const hA = 0.66 * big
  const wB = 0.44 * big
  const dB = 0.44 * big
  const hB = 0.4 * big
  const wC = 0.38 * big
  const dC = 0.38 * big
  const hC = 0.3 * big
  const xB = x - wB - 0.04 * big
  const yB = y + 0.04 * big
  const xC = x + wA * 0.55
  const yC = y + dA * 0.85
  const tapeA = iso(x + wA * 0.18, y + dA, hA)
  const tapeB = iso(x + wA * 0.82, y, hA)
  return (
    <g>
      <Box x={xB} y={yB} z={0} w={wB} d={dB} h={hB} tone="crate2" />
      {crateFace(xB, yB, dB, wB, hB)}
      <Box x={x} y={y} z={0} w={wA} d={dA} h={hA} tone="crate" />
      <line className="crate-tape" x1={tapeA[0]} y1={tapeA[1]} x2={tapeB[0]} y2={tapeB[1]} />
      {crateFace(x, y, dA, wA, hA)}
      <Box x={xC} y={yC} z={0} w={wC} d={dC} h={hC} tone="crate2" />
      {crateFace(xC, yC, dC, wC, hC)}
    </g>
  )
}

// Modelo 3: caixa grande lisa (só a seta "pra cima") + uma pilha pequena decorada
// encostada do lado — como uma entrega recém-chegada ainda não desempacotada.
function CratePileArrow({ x, y, big = 1 }: { x: number; y: number; big?: number }) {
  const wBig = 0.66 * big
  const dBig = 0.66 * big
  const hBig = 0.62 * big
  const wS1 = 0.4 * big
  const dS1 = 0.4 * big
  const hS1 = 0.32 * big
  const wS2 = 0.3 * big
  const dS2 = 0.3 * big
  const hS2 = 0.24 * big
  const xSmall = x + wBig + 0.06 * big
  const ySmall = y + dBig * 0.3
  const dxTop = 0.05 * big
  const dyTop = -0.03 * big
  const arrowPts: [number, number][] = [
    [0.5, 0.72],
    [0.62, 0.52],
    [0.565, 0.52],
    [0.565, 0.28],
    [0.435, 0.28],
    [0.435, 0.52],
    [0.38, 0.52],
  ]
  const arrow = pts(...arrowPts.map(([fx, fz]) => iso(x + wBig * fx, y + dBig, hBig * fz)))
  return (
    <g>
      <Box x={x} y={y} z={0} w={wBig} d={dBig} h={hBig} tone="crate" />
      <polygon className="crate-arrow" points={arrow} />
      <Box x={xSmall} y={ySmall} z={0} w={wS1} d={dS1} h={hS1} tone="crate2" />
      {crateFace(xSmall, ySmall, dS1, wS1, hS1)}
      <Box x={xSmall + dxTop} y={ySmall + dyTop} z={hS1} w={wS2} d={dS2} h={hS2} tone="crate" />
      {crateFace(xSmall + dxTop, ySmall + dyTop, dS2, wS2, hS2)}
    </g>
  )
}

// Modelo 4: caixa grande fechada (fita + etiqueta) + uma caixa pequena fechada do lado.
function CratePileOpen({ x, y, big = 1 }: { x: number; y: number; big?: number }) {
  const wMain = 0.6 * big
  const dMain = 0.6 * big
  const hMain = 0.48 * big
  const wSide = 0.42 * big
  const dSide = 0.42 * big
  const hSide = 0.36 * big
  const xSide = x + wMain + 0.06 * big
  const ySide = y + dMain * 0.25
  const tapeA = iso(x + wMain * 0.18, y + dMain, hMain)
  const tapeB = iso(x + wMain * 0.82, y, hMain)
  return (
    <g>
      <Box x={x} y={y} z={0} w={wMain} d={dMain} h={hMain} tone="crate" />
      <line className="crate-tape" x1={tapeA[0]} y1={tapeA[1]} x2={tapeB[0]} y2={tapeB[1]} />
      {crateFace(x, y, dMain, wMain, hMain)}
      <Box x={xSide} y={ySide} z={0} w={wSide} d={dSide} h={hSide} tone="crate2" />
      {crateFace(xSide, ySide, dSide, wSide, hSide)}
    </g>
  )
}

export function GarageScene({
  level,
  remodeled,
  internCount,
  onSelect,
}: {
  level: number
  /** Sala Comercial comprada (loja de upgrades) — troca porta/parede/decoração; independente de `chapterOf`. */
  remodeled: boolean
  /** Estagiários contratados (GDD §4.2) — ≥1 mostra a mesa extra na cena. */
  internCount: number
  onSelect: (h: Hotspot) => void
}) {
  // Porta de garagem (seccional americana, inspirada em foto de referência) na parede B
  const GD_Y1 = 0.7
  const GD_Y2 = 3.5
  const GD_Z = 2.05
  const GD_BANDS: [number, number][] = [
    [0, 0.5],
    [0.5, 0.95],
    [0.95, 1.4],
    [1.4, GD_Z],
  ]
  // Metade das janelas de antes, redimensionadas p/ ocupar o mesmo espaço.
  const GD_WINDOWS: [number, number][] = [
    [0.83, 0.75],
    [1.725, 0.75],
    [2.62, 0.75],
  ]

  // Quadro de skills (corkboard) na parede A (y=0)
  const board = wallQuadA(0.5, 2.0, 1.0, 2.0)

  // Pôster de IA/ML (rede neural, eco do logo) na parede B — centralizado no vão
  // entre o fim do portão e o fim da parede (não num ponto fixo). Some no modo
  // remodeled: a porta da Sala Comercial ocupa esse mesmo vão (ver mais abaixo).
  const POSTER_W = 0.9
  const POSTER_CY = (GD_Y2 + ROWS) / 2
  const POSTER_Y1 = POSTER_CY - POSTER_W / 2
  const POSTER_Y2 = POSTER_CY + POSTER_W / 2
  const DOOR_Z = 2.0
  // +10px de largura visual em relação ao vão do pôster (10 / 22, escala de
  // wallQuadB em y — ver iso(): screen_x varia 22 por unidade de y).
  const DOOR_W = POSTER_W + 10 / 22
  const DOOR_Y1 = POSTER_CY - DOOR_W / 2
  const DOOR_Y2 = POSTER_CY + DOOR_W / 2
  const netLayers = [
    [
      { y: POSTER_CY - 0.26, z: 1.52 },
      { y: POSTER_CY - 0.26, z: 1.08 },
    ],
    [
      { y: POSTER_CY, z: 1.56 },
      { y: POSTER_CY, z: 1.04 },
    ],
    [
      { y: POSTER_CY + 0.26, z: 1.52 },
      { y: POSTER_CY + 0.26, z: 1.08 },
    ],
  ]
  const netEdges: [Pt, Pt][] = []
  for (let l = 0; l < netLayers.length - 1; l++)
    for (const a of netLayers[l])
      for (const b of netLayers[l + 1]) netEdges.push([iso(0, a.y, a.z), iso(0, b.y, b.z)])

  return (
    <svg
      className={`garage${remodeled ? ' remodeled' : ''}`}
      viewBox={ROOM_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={remodeled ? 'Sua sala comercial em vista isométrica' : 'Sua garagem em vista isométrica'}
    >
      <RoomShell />

      {/* pôster de IA/ML na parede B — rede neural (eco do logo). Some no modo
          remodeled (a porta da Sala Comercial ocupa esse vão — ver abaixo). */}
      {!remodeled && (
        <g className="poster">
          <polygon points={wallQuadB(POSTER_Y1, POSTER_Y2, 0.75, 1.85)} />
          {netEdges.map(([a, b], i) => (
            <line key={i} className="pne" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          ))}
          {netLayers.flat().map((n, i) => {
            const [cx, cy] = iso(0, n.y, n.z)
            return <circle key={i} className="pnn" cx={cx} cy={cy} r={2.2} />
          })}
        </g>
      )}

      {/* quadro de skills (parede A) — corkboard com recados */}
      <g
        className="hot"
        onClick={() => onSelect('board')}
        role="button"
        tabIndex={0}
        aria-label="Quadro de skills"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect('board')
          }
        }}
      >
        <polygon className="panelboard" points={board} />
        <polygon className="note n1" points={wallQuadA(0.68, 0.98, 1.55, 1.82)} />
        <polygon className="note n2" points={wallQuadA(1.1, 1.4, 1.5, 1.77)} />
        <polygon className="note n3" points={wallQuadA(1.52, 1.82, 1.56, 1.83)} />
        <polygon className="note n4" points={wallQuadA(0.75, 1.32, 1.12, 1.36)} />
        <rect className="hit" x={244} y={28} width={46} height={56} />
      </g>

      {/* porta: garagem (parede B) OU escritório na parede A + janela na parede B (remodeled) */}
      {!remodeled ? (
        <g
          className="hot"
          onClick={() => onSelect('door')}
          role="button"
          tabIndex={0}
          aria-label="Portão da garagem"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect('door')
            }
          }}
        >
          {/* trilhos laterais */}
          {[GD_Y1, GD_Y2].map((y) => (
            <line
              key={y}
              className="gdoor-rail"
              x1={iso(0, y, 0)[0]}
              y1={iso(0, y, 0)[1]}
              x2={iso(0, y, GD_Z)[0]}
              y2={iso(0, y, GD_Z)[1]}
            />
          ))}
          {/* painéis horizontais (tons alternados = relevo prensado) */}
          {GD_BANDS.map(([z1, z2], i) => (
            <polygon
              key={z1}
              className={`gdoor-panel ${i % 2 === 0 ? 'a' : 'b'}`}
              points={wallQuadB(GD_Y1, GD_Y2, z1, z2)}
            />
          ))}
          {/* fileira de janelas no painel superior */}
          {GD_WINDOWS.map(([y, w]) => (
            <polygon key={y} className="gdoor-window" points={wallQuadB(y, y + w, 1.55, 1.9)} />
          ))}
          {/* moldura por cima dos painéis — só o contorno, nítido */}
          <polygon className="gdoor" points={wallQuadB(GD_Y1, GD_Y2, 0, GD_Z)} />
          <rect className="hit" x={157} y={30} width={70} height={117} />
        </g>
      ) : (
        <>
          {/* janela na parede B (onde a porta da garagem ficava) — decorativa, vista da
              cidade. Sem prédios, sem moldura: só o vidro com um brilho suave (filter
              drop-shadow), efeito de luz entrando, não silhuetas de prédio. */}
          <g className="window" aria-hidden="true">
            <polygon className="window-glass" points={wallQuadB(0.85, 3.35, 0.3, 1.9)} />
          </g>
          {/* porta da Sala Comercial: vão do pôster na parede B (o pôster some nesse modo —
              ver acima), alargada em +10px em relação ao vão original do pôster. */}
          <g
            className="hot"
            onClick={() => onSelect('door')}
            role="button"
            tabIndex={0}
            aria-label="Porta da sala"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect('door')
              }
            }}
          >
            <polygon className="office-door" points={wallQuadB(DOOR_Y1, DOOR_Y2, 0, DOOR_Z)} />
            <polygon
              className="office-door-window"
              points={wallQuadB(DOOR_Y1 + 0.14, DOOR_Y2 - 0.14, DOOR_Z * 0.45, DOOR_Z * 0.82)}
            />
            <circle
              className="led"
              cx={iso(0, DOOR_Y1 + 0.12, DOOR_Z * 0.35)[0]}
              cy={iso(0, DOOR_Y1 + 0.12, DOOR_Z * 0.35)[1]}
              r={1.2}
            />
            <rect className="hit" x={116} y={70} width={35} height={97} />
          </g>
        </>
      )}

      <OfficeFurniture level={level} onSelect={onSelect} />

      {/* caixotes / tralha da garagem — 3 modelos diferentes, espalhados pela garagem.
          A pilha do canto do rack (modelo seta) some no nível 1, deixando o canto livre
          até o rack de verdade aparecer no nível 2. */}
      {/* rotação de papéis: modelo 3 (seta) agora é o que nunca some; modelo 1
          (clássica) some no estágio 3; modelo 2 (cluster) some no estágio 2,
          no canto do rack — modelo 4 (fechado) continua sempre visível. */}
      {remodeled ? (
        <>
          {/* planta — vaso (crate2) + folhagem (book1, reaproveita o verde-lima já existente).
              Canto vazio no fundo direito (longe do rack em x=0.3..1.15,y=0.3..1.15, do
              gabinete quando level<2, do armário e da mesa do estagiário) — antes ficava no
              meio do caminho (x=1.773,y=3.664, mesmo lugar da antiga pilha de caixas). */}
          <Box x={5.3} y={5.3} z={0} w={0.4} d={0.4} h={0.32} tone="crate2" />
          <Box x={5.35} y={5.35} z={0.32} w={0.3} d={0.3} h={0.4} tone="book1" />
          {/* armário de arquivo — tom "desk" (madeira), não "tower2" (ciano/metal do
              gabinete — lido como peça eletrônica misteriosa, não como móvel) */}
          <Box x={4.0} y={5.0} z={0} w={0.5} d={0.45} h={0.9} tone="desk" />
        </>
      ) : (
        <>
          <CratePileArrow x={4.7} y={2.4} big={0.85} />
          <CratePileOpen x={1.773} y={3.664} big={0.85} />
          {level < 2 && <CratePile x={4.0} y={5.0} big={1.05} />}
          {level < 1 && <CratePileCluster x={0.94} y={0.3} big={0.95} />}
        </>
      )}

      {/* mesa do estagiário (GDD §4.2): só aparece com ao menos 1 estagiário contratado —
          canto livre do piso, longe das pilhas de caixa e da porta.
          y nudado de 4.3 p/ 4.6 (afasta da janela da sala remodelada) e a figura
          senta À FRENTE da mesa (y>=5.0), numa cadeirinha própria — antes ela ficava
          dentro da própria pegada da mesa (em pé em cima dela). */}
      {internCount > 0 && (
        <g className="intern-desk">
          <Box x={0.3} y={4.6} z={0} w={0.5} d={0.35} h={0.55} tone="desk" />
          {/* cadeirinha (base+assento combinados + encosto), miniatura da cadeira principal */}
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
