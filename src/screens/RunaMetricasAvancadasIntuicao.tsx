import { useMemo, useState } from 'react'
import './RunaMetricasAvancadasIntuicao.css'

// Runa da Intuição de "metricas-avancadas" (GDD §5.1): arrastar um limiar de decisão sobre uma
// lista de pacientes já pontuados e ver a matriz de confusão (VP/FP/FN/VN) e a precisão/recall
// mudarem em tempo real — mesmo espírito da Regressão Logística, agora nomeando os 4 quadrantes.
// Props CONGELADAS.

type Paciente = { score: number; risco: boolean }

// Dataset fixo: 14 pacientes, minoria em risco (eco do desbalanceamento real de diagnostico.csv).
const PACIENTES: readonly Paciente[] = [
  { score: 0.1, risco: false },
  { score: 0.15, risco: false },
  { score: 0.2, risco: false },
  { score: 0.25, risco: false },
  { score: 0.3, risco: false },
  { score: 0.35, risco: false },
  { score: 0.4, risco: false },
  { score: 0.45, risco: false },
  { score: 0.5, risco: false },
  { score: 0.55, risco: true },
  { score: 0.65, risco: false },
  { score: 0.7, risco: true },
  { score: 0.8, risco: true },
  { score: 0.9, risco: true },
]

const LIMIAR_MIN = 0, LIMIAR_MAX = 1, LIMIAR_STEP = 0.05
const META = 0.6 // recall E precisão precisam bater essa meta simultaneamente

const VB_W = 320, VB_H = 180
const PAD = { l: 16, r: 16, t: 16, b: 36 }
const PLOT_W = VB_W - PAD.l - PAD.r
const sx = (score: number) => PAD.l + score * PLOT_W
const rowY = (risco: boolean) => (risco ? PAD.t + 30 : VB_H - PAD.b - 30)

export function RunaMetricasAvancadasIntuicao({ onComplete }: { onComplete: () => void }) {
  const [limiar, setLimiar] = useState(0.2)
  const [solved, setSolved] = useState(false)

  const { vp, fp, fn, vn, precisao, recall } = useMemo(() => {
    let vp = 0, fp = 0, fn = 0, vn = 0
    for (const p of PACIENTES) {
      const previsto = p.score >= limiar
      if (previsto && p.risco) vp += 1
      else if (previsto && !p.risco) fp += 1
      else if (!previsto && p.risco) fn += 1
      else vn += 1
    }
    const precisao = vp + fp === 0 ? 0 : vp / (vp + fp)
    const recall = vp + fn === 0 ? 0 : vp / (vp + fn)
    return { vp, fp, fn, vn, precisao, recall }
  }, [limiar])

  const isGood = precisao >= META && recall >= META
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-metricas-avancadas-intuicao">
      <p className="rma-lead">
        Cada bolinha é um paciente com um score (0 a 1) e um risco real (só visível aqui, pra você
        aprender). Arraste o limiar e veja a matriz de confusão mudar.
      </p>

      <svg
        className="rma-plot"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Pacientes por score de risco, com um limiar de decisão"
      >
        <line className="rma-axis" x1={PAD.l} y1={VB_H - PAD.b} x2={VB_W - PAD.r} y2={VB_H - PAD.b} />
        <text className="rma-axis-label" x={VB_W / 2} y={VB_H - 8} textAnchor="middle">
          score do modelo
        </text>

        <line
          className={`rma-limiar ${isGood ? 'is-good' : ''}`}
          x1={sx(limiar)}
          y1={PAD.t}
          x2={sx(limiar)}
          y2={VB_H - PAD.b}
        />

        {PACIENTES.map((p, i) => (
          <circle
            key={i}
            className={`rma-dot ${p.risco ? 'is-risco' : 'is-ok'}`}
            cx={sx(p.score)}
            cy={rowY(p.risco)}
            r={6}
          />
        ))}
      </svg>

      <label className="rma-slider">
        <span className="rma-slider-top">
          <span>limiar de decisão</span>
          <span className="rma-val">{limiar.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={LIMIAR_MIN}
          max={LIMIAR_MAX}
          step={LIMIAR_STEP}
          value={limiar}
          aria-label="Limiar de decisão"
          onChange={(e) => setLimiar(Number(e.target.value))}
        />
      </label>

      <div className="rma-matriz" aria-live="polite">
        <div className="rma-quad is-vp">
          <span className="rma-quad-k">VP</span>
          <span className="rma-quad-v">{vp}</span>
        </div>
        <div className="rma-quad is-fp">
          <span className="rma-quad-k">FP</span>
          <span className="rma-quad-v">{fp}</span>
        </div>
        <div className="rma-quad is-fn">
          <span className="rma-quad-k">FN</span>
          <span className="rma-quad-v">{fn}</span>
        </div>
        <div className="rma-quad is-vn">
          <span className="rma-quad-k">VN</span>
          <span className="rma-quad-v">{vn}</span>
        </div>
      </div>

      <div className="rma-meter" aria-live="polite">
        <p className="rma-scores">
          precisão: <b className={precisao >= META ? 'is-good' : ''}>{Math.round(precisao * 100)}%</b>
          {' · '}
          recall: <b className={recall >= META ? 'is-good' : ''}>{Math.round(recall * 100)}%</b>
        </p>
        <p className="rma-meter-hint">
          {isGood
            ? 'Bom limiar! Limiar baixo demais sinaliza gente demais (recall alto, precisão baixa); alto demais, o oposto.'
            : `Meta: precisão e recall ≥ ${Math.round(META * 100)}%, os dois ao mesmo tempo.`}
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
