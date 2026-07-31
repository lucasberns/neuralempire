import { useMemo, useState } from 'react'
import './RunaReducaoDimensionalidadeIntuicao.css'

// Runa da Intuição de "reducao-dimensionalidade" (GDD §5.1): uma tabela fixa de variância
// acumulada por nº de componentes — cada componente a mais preserva mais informação, mas o
// ganho cai rápido (eco real: 2 componentes já capturam 96% da variância verificada). Mesmo
// espírito de "tabela fixa + slider" da runa de Validação. Props CONGELADAS.

const TABELA: readonly { componentes: number; varianciaAcumulada: number }[] = [
  { componentes: 1, varianciaAcumulada: 65 },
  { componentes: 2, varianciaAcumulada: 92 },
  { componentes: 3, varianciaAcumulada: 96 },
  { componentes: 4, varianciaAcumulada: 98 },
  { componentes: 5, varianciaAcumulada: 99 },
  { componentes: 6, varianciaAcumulada: 100 },
]

const COMPONENTES_META = 2
const VARIANCIA_META = 90

export function RunaReducaoDimensionalidadeIntuicao({ onComplete }: { onComplete: () => void }) {
  const [componentes, setComponentes] = useState(1)
  const [solved, setSolved] = useState(false)

  const ponto = useMemo(() => TABELA.find((t) => t.componentes === componentes)!, [componentes])

  const isGood = componentes === COMPONENTES_META && ponto.varianciaAcumulada >= VARIANCIA_META
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-reducao-dimensionalidade-intuicao">
      <p className="rrdi-lead">
        Cada componente a mais preserva um pouco mais da informação original — mas o ganho cai
        rápido. Ache o ponto onde poucos componentes já bastam.
      </p>

      <div className="rrdi-barra-wrap" aria-live="polite">
        <div className="rrdi-trilha">
          <div
            className={`rrdi-barra ${isGood ? 'is-good' : ''}`}
            style={{ width: `${ponto.varianciaAcumulada}%` }}
          />
          <div className="rrdi-cotovelo" style={{ left: `${(COMPONENTES_META / TABELA.length) * 100}%` }} />
        </div>
        <p className="rrdi-txt">
          com {ponto.componentes} componente{ponto.componentes > 1 ? 's' : ''}:{' '}
          <b>{ponto.varianciaAcumulada}%</b> da informação original preservada.
        </p>
      </div>

      <label className="rrdi-slider">
        <span className="rrdi-slider-top">
          <span>nº de componentes</span>
          <span className="rrdi-val">{componentes}</span>
        </span>
        <input
          type="range"
          min={1}
          max={TABELA.length}
          step={1}
          value={componentes}
          aria-label="Número de componentes"
          onChange={(e) => setComponentes(Number(e.target.value))}
        />
      </label>

      <div className="rrdi-meter" aria-live="polite">
        <p className="rrdi-meter-hint">
          {isGood
            ? '2 componentes já preservam quase tudo — é por isso que dá pra visualizar 6 biomarcadores num gráfico 2D só.'
            : `Meta: ${COMPONENTES_META} componentes capturando ≥ ${VARIANCIA_META}% da variância.`}
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
