import { useEffect, useMemo, useRef, useState } from 'react'
import './RunaRegressaoIntuicao.css'

// Runa da Intuição (GDD §5.1 / Apêndice A): regressão linear visual — arrastar uma
// reta sobre os pontos e ver o erro (barras vermelhas) mudar em tempo real; concluir
// quando o erro fica abaixo de um limiar; botão "deixar o computador ajustar" anima
// os sliders até o ajuste ótimo por mínimos quadrados. Props CONGELADAS.

// Dataset fixo: vendas de pão (unidades) x temperatura (°C). Tendência positiva + ruído.
const DATA: ReadonlyArray<readonly [number, number]> = [
  [15, 100], [18, 118], [20, 125], [23, 140], [26, 150],
  [29, 165], [31, 168], [34, 185], [37, 195],
]

// Domínio do gráfico e limiar de "conseguiu".
const X_MIN = 10, X_MAX = 40, Y_MIN = 80, Y_MAX = 210
const THRESHOLD = 250 // erro total (SSE) para liberar a conclusão
const WORST = 3500 // referência de erro "ruim" para encher a barrinha

// Faixas dos sliders.
const SLOPE_MIN = 0, SLOPE_MAX = 8, SLOPE_STEP = 0.1
const INT_MIN = 0, INT_MAX = 120, INT_STEP = 1

// Ajuste ótimo por mínimos quadrados (fórmula fechada) — dataset fixo, calcula 1x.
const OPTIMAL = (() => {
  const n = DATA.length
  const mx = DATA.reduce((s, [x]) => s + x, 0) / n
  const my = DATA.reduce((s, [, y]) => s + y, 0) / n
  let sxy = 0, sxx = 0
  for (const [x, y] of DATA) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) * (x - mx)
  }
  const slope = sxy / sxx
  return { slope, intercept: my - slope * mx }
})()

// ViewBox do SVG (coordenadas internas, o CSS escala).
const VB_W = 320, VB_H = 240
const PAD = { l: 38, r: 12, t: 12, b: 28 }
const PLOT_W = VB_W - PAD.l - PAD.r
const PLOT_H = VB_H - PAD.t - PAD.b
const sx = (x: number) => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const sy = (y: number) => PAD.t + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * PLOT_H

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function RunaRegressaoIntuicao({ onComplete }: { onComplete: () => void }) {
  const [slope, setSlope] = useState(2)
  const [intercept, setIntercept] = useState(90)
  const [solved, setSolved] = useState(false)
  const rafRef = useRef<number | null>(null)

  // Erro total (soma dos erros ao quadrado) da reta atual.
  const sse = useMemo(() => {
    let s = 0
    for (const [x, y] of DATA) {
      const r = y - (slope * x + intercept)
      s += r * r
    }
    return s
  }, [slope, intercept])

  const isGood = sse <= THRESHOLD
  // Barrinha: enche conforme o erro diminui em direção ao limiar.
  const fill = clamp01((WORST - sse) / (WORST - THRESHOLD))

  // "solved" é permanente: uma vez atingido, o botão Concluir fica disponível.
  useEffect(() => {
    if (isGood) setSolved(true)
  }, [isGood])

  // Limpa animação pendente ao desmontar.
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  const animateToOptimal = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const fromS = slope, fromI = intercept
    const toS = OPTIMAL.slope, toI = OPTIMAL.intercept
    if (prefersReduced()) {
      setSlope(toS)
      setIntercept(toI)
      return
    }
    const start = performance.now()
    const DUR = 900
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DUR)
      const e = 1 - Math.pow(1 - t, 3) // ease-out cúbico
      setSlope(fromS + (toS - fromS) * e)
      setIntercept(fromI + (toI - fromI) * e)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else rafRef.current = null
    }
    rafRef.current = requestAnimationFrame(step)
  }

  return (
    <div className="runa runa-intuicao">
      <p className="ri-lead">
        Arraste a reta pra passar bem no meio dos pontos. As barras{' '}
        <span className="ri-em-red">vermelhas</span> são o erro de cada ponto — quanto
        menores, melhor o palpite.
      </p>

      <svg
        className="ri-plot"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Gráfico de dispersão: vendas de pão por temperatura, com a reta ajustável e as barras de erro."
      >
        {/* eixos */}
        <line className="ri-axis" x1={PAD.l} y1={sy(Y_MIN)} x2={sx(X_MAX)} y2={sy(Y_MIN)} />
        <line className="ri-axis" x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={sy(Y_MIN)} />
        <text className="ri-axis-label" x={sx((X_MIN + X_MAX) / 2)} y={VB_H - 6} textAnchor="middle">
          temperatura (°C)
        </text>
        <text
          className="ri-axis-label"
          x={10}
          y={PAD.t + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90 10 ${PAD.t + PLOT_H / 2})`}
        >
          vendas
        </text>

        {/* barras de erro (vermelhas) */}
        {DATA.map(([x, y]) => {
          const pred = slope * x + intercept
          return (
            <line
              key={`e${x}`}
              className="ri-error"
              x1={sx(x)}
              y1={sy(y)}
              x2={sx(x)}
              y2={sy(pred)}
            />
          )
        })}

        {/* reta ajustada */}
        <line
          className="ri-line"
          x1={sx(X_MIN)}
          y1={sy(slope * X_MIN + intercept)}
          x2={sx(X_MAX)}
          y2={sy(slope * X_MAX + intercept)}
        />

        {/* pontos de dados */}
        {DATA.map(([x, y]) => (
          <circle key={`p${x}`} className="ri-dot" cx={sx(x)} cy={sy(y)} r={4} />
        ))}
      </svg>

      <div className="ri-controls">
        <label className="ri-slider">
          <span className="ri-slider-top">
            <span>inclinação</span>
            <span className="ri-val">{slope.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={SLOPE_MIN}
            max={SLOPE_MAX}
            step={SLOPE_STEP}
            value={slope}
            aria-label="Inclinação da reta"
            onChange={(e) => setSlope(Number(e.target.value))}
          />
        </label>
        <label className="ri-slider">
          <span className="ri-slider-top">
            <span>deslocamento</span>
            <span className="ri-val">{Math.round(intercept)}</span>
          </span>
          <input
            type="range"
            min={INT_MIN}
            max={INT_MAX}
            step={INT_STEP}
            value={intercept}
            aria-label="Deslocamento (intercepto) da reta"
            onChange={(e) => setIntercept(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="ri-meter" aria-live="polite">
        <div className="ri-meter-top">
          <span>erro total</span>
          <span className={`ri-sse ${isGood ? 'is-good' : ''}`}>
            {Math.round(sse).toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="ri-bar" role="presentation">
          <div
            className={`ri-bar-fill ${isGood ? 'is-good' : ''}`}
            style={{ width: `${(fill * 100).toFixed(1)}%` }}
          />
          <div className="ri-bar-goal" style={{ left: '100%' }} />
        </div>
        <p className="ri-meter-hint">
          {isGood
            ? 'Mandou bem! A reta passa pertinho de todos os pontos.'
            : `Meta: erro abaixo de ${THRESHOLD.toLocaleString('pt-BR')}.`}
        </p>
      </div>

      <button type="button" className="ri-magic" onClick={animateToOptimal}>
        ✨ Deixar o computador ajustar
      </button>

      {solved && (
        <div className="ri-success">
          <p className="ri-success-msg">
            É isso que a máquina aprende sozinha: a reta que deixa o erro no mínimo.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      )}
    </div>
  )
}
