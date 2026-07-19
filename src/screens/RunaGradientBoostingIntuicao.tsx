import { useMemo, useState } from 'react'
import './RunaGradientBoostingIntuicao.css'

// Runa da Intuição de "gradient-boosting" (GDD §5.1): uma tabela fixa de erro residual por
// "passo" (nº de árvores já treinadas em sequência) — cada árvore nova só ataca o que sobrou de
// erro da anterior, não os dados originais. Mesmo espírito de "tabela fixa + slider" da runa de
// Validação, aplicado a uma barra que encolhe em vez de duas curvas. Props CONGELADAS.

const TABELA: readonly { passo: number; residuo: number }[] = [
  { passo: 1, residuo: 45 },
  { passo: 2, residuo: 30 },
  { passo: 3, residuo: 20 },
  { passo: 4, residuo: 14 },
  { passo: 5, residuo: 10 },
  { passo: 6, residuo: 7 },
  { passo: 7, residuo: 6 },
  { passo: 8, residuo: 5 },
]

const PASSO_META = 6 // resíduo baixo o suficiente a partir daqui

export function RunaGradientBoostingIntuicao({ onComplete }: { onComplete: () => void }) {
  const [passo, setPasso] = useState(1)
  const [solved, setSolved] = useState(false)

  const ponto = useMemo(() => TABELA.find((t) => t.passo === passo)!, [passo])

  const isGood = passo >= PASSO_META
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-gradient-boosting-intuicao">
      <p className="rgb-lead">
        Cada árvore nova não olha os dados originais de novo — ela olha só o que sobrou de erro da
        árvore anterior. Avance o passo e veja o resíduo encolher.
      </p>

      <div className="rgb-barra-wrap" aria-live="polite">
        <div className="rgb-trilha">
          <div className={`rgb-barra ${isGood ? 'is-good' : ''}`} style={{ width: `${ponto.residuo}%` }} />
        </div>
        <p className="rgb-residuo-txt">
          árvore {ponto.passo}: ainda sobra <b>{ponto.residuo}%</b> de erro pra próxima corrigir.
        </p>
      </div>

      <label className="rgb-slider">
        <span className="rgb-slider-top">
          <span>passo (árvores treinadas em sequência)</span>
          <span className="rgb-val">{passo}</span>
        </span>
        <input
          type="range"
          min={1}
          max={TABELA.length}
          step={1}
          value={passo}
          aria-label="Passo do boosting"
          onChange={(e) => setPasso(Number(e.target.value))}
        />
      </label>

      <div className="rgb-meter" aria-live="polite">
        <p className="rgb-meter-hint">
          {isGood
            ? 'É assim que Gradient Boosting refina a previsão aos poucos, uma correção de cada vez.'
            : `Meta: resíduo baixo o suficiente (a partir do passo ${PASSO_META}).`}
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
