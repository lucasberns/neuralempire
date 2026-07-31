import { useMemo, useState } from 'react'
import './RunaKnnIntuicao.css'

// Runa da Intuição de "knn" (GDD §5.1, exemplo citado explicitamente): regular o k e ver os
// vizinhos mais próximos + o voto majoritário mudarem ao vivo. Props CONGELADAS.

type Ponto = { x: number; y: number; classe: 'popular' | 'alto' }

const PONTOS: readonly Ponto[] = [
  { x: 1, y: 2, classe: 'popular' }, { x: 2, y: 1, classe: 'popular' },
  { x: 2, y: 3, classe: 'popular' }, { x: 3, y: 2, classe: 'popular' },
  { x: 1.5, y: 1.5, classe: 'popular' }, { x: 3, y: 1, classe: 'popular' },
  { x: 8, y: 8, classe: 'alto' }, { x: 9, y: 7, classe: 'alto' },
  { x: 7, y: 9, classe: 'alto' }, { x: 8.5, y: 8.5, classe: 'alto' },
  { x: 7.5, y: 7.5, classe: 'alto' }, { x: 9, y: 9, classe: 'alto' },
  { x: 4.5, y: 5, classe: 'popular' }, { x: 5.5, y: 4.5, classe: 'alto' },
]

const CONSULTA = { x: 5, y: 5 }
const K_MIN = 1, K_MAX = 9

const VB = 200
const PAD = 16
const SCALE = 10
const sx = (x: number) => PAD + (x / SCALE) * (VB - 2 * PAD)
const sy = (y: number) => VB - PAD - (y / SCALE) * (VB - 2 * PAD)

function distancia(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function RunaKnnIntuicao({ onComplete }: { onComplete: () => void }) {
  const [k, setK] = useState(1)
  const [solved, setSolved] = useState(false)

  const { vizinhos, previsao } = useMemo(() => {
    const ordenados = [...PONTOS]
      .map((p) => ({ ...p, dist: distancia(p, CONSULTA) }))
      .sort((a, b) => a.dist - b.dist)
    const viz = ordenados.slice(0, k)
    const votos = { popular: 0, alto: 0 }
    for (const v of viz) votos[v.classe] += 1
    const previsto = votos.popular >= votos.alto ? 'popular' : 'alto'
    return { vizinhos: viz, previsao: previsto as 'popular' | 'alto' }
  }, [k])

  // O ponto de consulta "de verdade" é da categoria alto (está mais perto do grupo alto) — usado
  // só como gabarito interno pra saber quando o jogador achou um k que funciona.
  const isGood = previsao === 'alto'
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-knn-intuicao">
      <p className="rki-lead">
        O ponto <span className="rki-em">◆</span> é um imóvel novo. Regule o <span className="rki-em">k</span>{' '}
        (quantos vizinhos consultar) e veja a categoria prevista mudar.
      </p>

      <svg className="rki-plot" viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label="Imóveis por categoria, com o ponto novo e seus k vizinhos mais próximos">
        {PONTOS.map((p, i) => {
          const isVizinho = vizinhos.some((v) => v.x === p.x && v.y === p.y)
          return (
            <circle
              key={i}
              className={`rki-dot is-${p.classe}${isVizinho ? ' is-vizinho' : ''}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={isVizinho ? 7 : 5}
            />
          )
        })}
        {vizinhos.map((v, i) => (
          <line
            key={i}
            className="rki-linha"
            x1={sx(CONSULTA.x)}
            y1={sy(CONSULTA.y)}
            x2={sx(v.x)}
            y2={sy(v.y)}
          />
        ))}
        <text className="rki-consulta" x={sx(CONSULTA.x)} y={sy(CONSULTA.y) + 4} textAnchor="middle">
          ◆
        </text>
      </svg>

      <label className="rki-slider">
        <span className="rki-slider-top">
          <span>k (vizinhos consultados)</span>
          <span className="rki-val">{k}</span>
        </span>
        <input
          type="range"
          min={K_MIN}
          max={K_MAX}
          step={1}
          value={k}
          aria-label="Número de vizinhos (k)"
          onChange={(e) => setK(Number(e.target.value))}
        />
      </label>

      <div className="rki-meter" aria-live="polite">
        <p className="rki-previsao">
          Voto dos {k} vizinhos mais próximos: <b className={`rki-classe is-${previsao}`}>{previsao}</b>
        </p>
        {!isGood && <p className="rki-meter-hint">Tente outro k até a previsão fazer sentido pra esse ponto.</p>}
      </div>

      {solved && (
        <button type="button" className="runa-cta" onClick={onComplete}>
          Concluir runa
        </button>
      )}
    </div>
  )
}
