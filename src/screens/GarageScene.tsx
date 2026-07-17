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
const ROWS = 6
const WH = 2.4 // altura das paredes (unidades)

// viewBox justo nos limites do conteúdo (sala 6×6 + folga):
// em pé no celular, o quarto ocupa a largura toda em vez de boiar num mar preto.
export const GARAGE_VIEWBOX = '92 4 284 247'

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

// Modelo 4: caixa grande ABERTA (cavidade escura no topo, ainda sem etiqueta/fita —
// acabou de ser rasgada) + uma caixa pequena fechada do lado, já com o acabamento padrão.
function CratePileOpen({ x, y, big = 1 }: { x: number; y: number; big?: number }) {
  const wMain = 0.6 * big
  const dMain = 0.6 * big
  const hMain = 0.48 * big
  const wSide = 0.42 * big
  const dSide = 0.42 * big
  const hSide = 0.36 * big
  const xSide = x + wMain + 0.06 * big
  const ySide = y + dMain * 0.25
  const cavity = pts(
    iso(x + wMain * 0.15, y + dMain * 0.15, hMain),
    iso(x + wMain * 0.85, y + dMain * 0.15, hMain),
    iso(x + wMain * 0.85, y + dMain * 0.85, hMain),
    iso(x + wMain * 0.15, y + dMain * 0.85, hMain),
  )
  return (
    <g>
      <Box x={x} y={y} z={0} w={wMain} d={dMain} h={hMain} tone="crate" />
      <polygon className="crate-open" points={cavity} />
      <Box x={xSide} y={ySide} z={0} w={wSide} d={dSide} h={hSide} tone="crate2" />
      {crateFace(xSide, ySide, dSide, wSide, hSide)}
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
  // Tapete sob a mesa/cadeira — camada externa opaca (esconde a grade do piso) + interna clara.
  const rugOuter = pts(iso(2.1, 0.05), iso(5.4, 0.05), iso(5.4, 2.4), iso(2.1, 2.4))
  const rugInner = pts(iso(2.25, 0.2), iso(5.25, 0.2), iso(5.25, 2.25), iso(2.25, 2.25))

  // Pôster de IA/ML (rede neural, eco do logo) na parede B — centralizado no vão
  // entre o fim do portão e o fim da parede (não num ponto fixo).
  const POSTER_W = 0.9
  const POSTER_CY = (GD_Y2 + ROWS) / 2
  const POSTER_Y1 = POSTER_CY - POSTER_W / 2
  const POSTER_Y2 = POSTER_CY + POSTER_W / 2
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

  const [badgeX, badgeY] = iso(0, 2.1, 2.25) // logo acima do portão

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

      {/* pôster de IA/ML na parede B — rede neural (eco do logo) */}
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

      {/* piso + grade */}
      <polygon className="floor" points={floor} />
      {grid.map(([a, b], i) => (
        <line key={i} className="grid" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      ))}
      {/* tapete: camada externa opaca (não deixa a grade "vazar") + interna clara */}
      <polygon className="rug-outer" points={rugOuter} />
      <polygon className="rug-inner" points={rugInner} />

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

      {/* porta de garagem seccional (parede B) — hotspot dos contratos */}
      <g
        className="hot"
        onClick={() => onSelect('door')}
        role="button"
        tabIndex={0}
        aria-label={notify > 0 ? `Portão — ${notify} contrato(s) esperando` : 'Portão da garagem'}
        onKeyDown={(e) => e.key === 'Enter' && onSelect('door')}
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
        {notify > 0 && (
          <g className="notify">
            <circle className="notify-dot" cx={badgeX} cy={badgeY} r={8.5} />
            <text className="notify-n" x={badgeX} y={badgeY + 3.2}>
              {notify}
            </text>
          </g>
        )}
        <rect className="hit" x={157} y={30} width={70} height={117} />
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

      {/* mesa encostada na parede A: tampo fino sobre duas pernas (vão visível embaixo) */}
      <Box x={2.42} y={0.17} z={0} w={0.1} d={0.1} h={0.68} tone="desk" />
      <Box x={4.85} y={0.17} z={0} w={0.1} d={0.1} h={0.68} tone="desk" />
      <Box x={2.4} y={0.15} z={0.68} w={2.6} d={0.78} h={0.14} tone="desk" />

      {/* monitor principal (brilho cresce com o nível) */}
      <g
        className="hot"
        onClick={() => onSelect('pc')}
        role="button"
        tabIndex={0}
        aria-label="Computador — abrir a bancada"
        onKeyDown={(e) => e.key === 'Enter' && onSelect('pc')}
      >
        {/* pé/base do monitor — mais estreito que a carcaça, dá sensação de "pescoço" */}
        <Box x={3.3} y={0.36} z={0.82} w={0.3} d={0.08} h={0.06} tone="mon" />
        <Box x={3.0} y={0.34} z={0.88} w={0.95} d={0.12} h={level >= 1 ? 0.7 : 0.56} tone="mon" />
        {/* tela: +1px direita / +2px cima em relação à leva anterior */}
        <polygon
          className={`screen ${level >= 1 ? 'bright' : ''}`}
          points={pts(
            iso(2.883, 0.34, 0.868),
            iso(3.673, 0.34, 0.868),
            iso(3.673, 0.34, level >= 1 ? 1.408 : 1.268),
            iso(2.883, 0.34, level >= 1 ? 1.408 : 1.268),
          )}
        />
        {/* linhas de código "digitando" na tela (acompanham o deslocamento da tela) */}
        <line
          className="code-line"
          x1={iso(2.954, 0.34, 1.208)[0]}
          y1={iso(2.954, 0.34, 1.208)[1]}
          x2={iso(3.424, 0.34, 1.208)[0]}
          y2={iso(3.424, 0.34, 1.208)[1]}
        />
        <line
          className="code-line slow"
          x1={iso(2.954, 0.34, 1.068)[0]}
          y1={iso(2.954, 0.34, 1.068)[1]}
          x2={iso(3.284, 0.34, 1.068)[0]}
          y2={iso(3.284, 0.34, 1.068)[1]}
        />
        {/* led de power — +2px pra direita (mesma altura em tela) */}
        <circle className="led" cx={iso(3.729, 0.34, 0.873)[0]} cy={iso(3.729, 0.34, 0.873)[1]} r={1.3} />
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
        <rect className="hit" x={288} y={74} width={62} height={46} />
      </g>

      {/* gabinete ao lado direito da mesa — evolui de torre simples p/ case melhor */}
      {level < 2 && (
        <g
          className="hot"
          onClick={() => onSelect('pc')}
          role="button"
          tabIndex={0}
          aria-label="Gabinete do computador — abrir a bancada"
          onKeyDown={(e) => e.key === 'Enter' && onSelect('pc')}
        >
          <Box
            x={5.05}
            y={0.3}
            z={0}
            w={0.4}
            d={0.42}
            h={level >= 1 ? 0.95 : 0.8}
            tone={level >= 1 ? 'tower2' : 'tower'}
          />
          {/* luz no centro-baixo da face frontal do gabinete (face frontal = y+d, não y) */}
          <Leds x={5.25} y={0.7} z={0.1} n={level >= 1 ? 3 : 1} cls={`led ${level >= 1 ? 'cyan' : ''}`} />
          <rect className="hit" x={326} y={120} width={32} height={58} />
        </g>
      )}

      {/* cadeira (parada, sem animação) — voltou ao formato de antes da última leva */}
      <g className="chair">
        <Box x={3.3} y={1.2} z={0} w={0.3} d={0.25} h={0.34} tone="chair" />
        <Box x={3.15} y={1.05} z={0.34} w={0.6} d={0.55} h={0.11} tone="chair" />
        <Box x={3.15} y={1.62} z={0.45} w={0.6} d={0.13} h={0.68} tone="chair" />
      </g>

      {/* personagem (de costas, digitando — estilo GDT), com bob próprio.
          z começa um pouco acima do assento (0.48 vs assento em 0.45) — gap visível
          de propósito, pra não parecer que o corpo se funde/atravessa a cadeira. */}
      <g className="dev">
        <Box x={3.24} y={1.08} z={0.48} w={0.44} d={0.36} h={0.6} tone="person" />
        {/* capuz: uma única forma (sem cabeça separada) */}
        <circle className="dev-hood" cx={iso(3.46, 1.28, 1.27)[0]} cy={iso(3.46, 1.28, 1.27)[1]} r={7.2} />
      </g>

      {/* caixotes / tralha da garagem — 3 modelos diferentes, espalhados pela garagem.
          A pilha do canto do rack (modelo seta) some no nível 1, deixando o canto livre
          até o rack de verdade aparecer no nível 2. */}
      <CratePile x={4.7} y={2.4} big={1.05} />
      <CratePileOpen x={1.773} y={3.664} big={0.85} />
      {level < 2 && <CratePileCluster x={4.0} y={5.0} big={0.95} />}
      {level < 1 && <CratePileArrow x={0.55} y={0.3} big={0.85} />}
    </svg>
  )
}
