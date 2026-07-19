import { useMemo, useState } from 'react'
import './RunaClusteringIntuicao.css'

// Runa da Intuição de "clustering" (GDD §5.1): mover os centros do K-means, iteração a iteração,
// até convergir — cada ponto colorido pelo centro mais próximo NAQUELA iteração. Mesmo padrão de
// scatter fixo de RunaKnnIntuicao.tsx, com centros pré-calculados por iteração em vez de um k
// variável. Props CONGELADAS.

type Pt = { x: number; y: number }

// Dataset fixo: 18 pontos, 3 grupos visuais nítidos.
const PONTOS: readonly Pt[] = [
  { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 1.5, y: 2.5 }, { x: 2.5, y: 1.5 }, { x: 1, y: 1 },
  { x: 5, y: 7 }, { x: 4.5, y: 6.5 }, { x: 5.5, y: 7.5 }, { x: 5, y: 6 }, { x: 4, y: 7 }, { x: 6, y: 7 },
  { x: 8, y: 3 }, { x: 7.5, y: 2.5 }, { x: 8.5, y: 3.5 }, { x: 8, y: 2 }, { x: 7, y: 3 }, { x: 9, y: 3 },
]

// 4 iterações pré-calculadas à mão: começa mal posicionado (perto do meio), converge pros
// centroides reais dos 3 grupos.
const CENTROS_POR_ITER: readonly Pt[][] = [
  [{ x: 4, y: 4 }, { x: 5, y: 4.5 }, { x: 4.5, y: 5 }],
  [{ x: 2.5, y: 2.5 }, { x: 5, y: 6 }, { x: 7, y: 4 }],
  [{ x: 1.8, y: 2 }, { x: 5, y: 6.7 }, { x: 7.9, y: 3 }],
  [{ x: 1.67, y: 1.83 }, { x: 5, y: 6.83 }, { x: 8, y: 2.83 }],
]

const CORES = ['is-c0', 'is-c1', 'is-c2']

const VB = 200
const PAD = 16
const SCALE = 10
const sx = (x: number) => PAD + (x / SCALE) * (VB - 2 * PAD)
const sy = (y: number) => VB - PAD - (y / SCALE) * (VB - 2 * PAD)

function distancia(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function RunaClusteringIntuicao({ onComplete }: { onComplete: () => void }) {
  const [iteracao, setIteracao] = useState(0)
  const [solved, setSolved] = useState(false)

  const centros = CENTROS_POR_ITER[iteracao]

  const atribuicoes = useMemo(
    () =>
      PONTOS.map((p) => {
        let melhor = 0
        let menor = Infinity
        centros.forEach((c, i) => {
          const d = distancia(p, c)
          if (d < menor) {
            menor = d
            melhor = i
          }
        })
        return melhor
      }),
    [centros],
  )

  const isGood = iteracao === CENTROS_POR_ITER.length - 1
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-clustering-intuicao">
      <p className="rci-lead">
        Os centros (✕) começam em qualquer lugar. Avance a iteração e veja cada ponto mudar de cor
        pro centro mais próximo, enquanto os centros se movem pro meio do próprio grupo.
      </p>

      <svg
        className="rci-plot"
        viewBox={`0 0 ${VB} ${VB}`}
        role="img"
        aria-label="Pontos agrupados pelo centro mais próximo, com os centros de cada iteração do K-means"
      >
        {PONTOS.map((p, i) => (
          <circle key={i} className={`rci-dot ${CORES[atribuicoes[i]]}`} cx={sx(p.x)} cy={sy(p.y)} r={5} />
        ))}
        {centros.map((c, i) => (
          <text key={i} className={`rci-centro ${CORES[i]}`} x={sx(c.x)} y={sy(c.y) + 4} textAnchor="middle">
            ✕
          </text>
        ))}
      </svg>

      <label className="rci-slider">
        <span className="rci-slider-top">
          <span>iteração do K-means</span>
          <span className="rci-val">{iteracao}</span>
        </span>
        <input
          type="range"
          min={0}
          max={CENTROS_POR_ITER.length - 1}
          step={1}
          value={iteracao}
          aria-label="Iteração do K-means"
          onChange={(e) => setIteracao(Number(e.target.value))}
        />
      </label>

      <div className="rci-meter" aria-live="polite">
        <p className="rci-meter-hint">
          {isGood
            ? 'Isso é K-means: atribuir → recalcular → repetir até parar de mudar (convergência).'
            : 'Avance até os centros pararem de se mover.'}
        </p>
      </div>

      {solved && (
        <button type="button" className="runa-cta" onClick={onComplete}>
          Concluir runa
        </button>
      )}
    </div>
  )
}
