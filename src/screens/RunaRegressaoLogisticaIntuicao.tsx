import { useMemo, useState } from 'react'
import './RunaRegressaoLogisticaIntuicao.css'

// Runa da Intuição de "regressao-logistica" (GDD §5.1): arrastar um limiar de decisão sobre um
// scatter de clientes e ver a acurácia mudar em tempo real — mesmo espírito da runa de regressão
// (arrastar e ver o erro), mas o alvo agora é acerto de classe. Props CONGELADAS.

type Cliente = { mesesUso: number; chamados: number; cancelou: boolean }

// Dataset fixo: 16 clientes, eixo x = meses de uso (quanto menor, mais risco de cancelar).
const CLIENTES: readonly Cliente[] = [
  { mesesUso: 2, chamados: 4, cancelou: true },
  { mesesUso: 3, chamados: 5, cancelou: true },
  { mesesUso: 4, chamados: 3, cancelou: true },
  { mesesUso: 5, chamados: 4, cancelou: true },
  { mesesUso: 6, chamados: 2, cancelou: true },
  { mesesUso: 8, chamados: 3, cancelou: true },
  { mesesUso: 9, chamados: 1, cancelou: false },
  { mesesUso: 11, chamados: 2, cancelou: true },
  { mesesUso: 13, chamados: 1, cancelou: false },
  { mesesUso: 15, chamados: 2, cancelou: false },
  { mesesUso: 18, chamados: 0, cancelou: false },
  { mesesUso: 21, chamados: 1, cancelou: false },
  { mesesUso: 24, chamados: 2, cancelou: false },
  { mesesUso: 27, chamados: 0, cancelou: false },
  { mesesUso: 30, chamados: 1, cancelou: false },
  { mesesUso: 33, chamados: 0, cancelou: false },
]

const X_MIN = 0, X_MAX = 35
const THRESHOLD_MIN = 0, THRESHOLD_MAX = 35, THRESHOLD_STEP = 1
const ACC_GOAL = 0.85 // 14/16 clientes classificados certo

const VB_W = 320, VB_H = 200
const PAD = { l: 16, r: 16, t: 16, b: 36 }
const PLOT_W = VB_W - PAD.l - PAD.r
const sx = (x: number) => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const rowY = (cancelou: boolean) => (cancelou ? PAD.t + 30 : VB_H - PAD.b - 30)

export function RunaRegressaoLogisticaIntuicao({ onComplete }: { onComplete: () => void }) {
  const [limiar, setLimiar] = useState(17)
  const [solved, setSolved] = useState(false)

  // Previsão do limiar: meses_uso < limiar => previsto cancela.
  const acc = useMemo(() => {
    let certos = 0
    for (const c of CLIENTES) {
      const previsto = c.mesesUso < limiar
      if (previsto === c.cancelou) certos += 1
    }
    return certos / CLIENTES.length
  }, [limiar])

  const isGood = acc >= ACC_GOAL
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-rl-intuicao">
      <p className="rli2-lead">
        Cada bolinha é um cliente. <span className="rli2-em">Vermelho</span> = cancelou,{' '}
        <span className="rli2-em-ok">verde</span> = ficou. Arraste o limiar até separar bem os dois grupos.
      </p>

      <svg
        className="rli2-plot"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Clientes que cancelaram ou ficaram, por meses de uso, com uma linha de limiar de decisão"
      >
        <line className="rli2-axis" x1={PAD.l} y1={VB_H - PAD.b} x2={VB_W - PAD.r} y2={VB_H - PAD.b} />
        <text className="rli2-axis-label" x={VB_W / 2} y={VB_H - 8} textAnchor="middle">
          meses de uso
        </text>

        <line
          className={`rli2-threshold ${isGood ? 'is-good' : ''}`}
          x1={sx(limiar)}
          y1={PAD.t}
          x2={sx(limiar)}
          y2={VB_H - PAD.b}
        />

        {CLIENTES.map((c, i) => {
          const previsto = c.mesesUso < limiar
          const errado = previsto !== c.cancelou
          return (
            <circle
              key={i}
              className={`rli2-dot ${c.cancelou ? 'is-cancelou' : 'is-ficou'}${errado ? ' is-errado' : ''}`}
              cx={sx(c.mesesUso)}
              cy={rowY(c.cancelou)}
              r={6}
            />
          )
        })}
      </svg>

      <label className="rli2-slider">
        <span className="rli2-slider-top">
          <span>limiar de decisão</span>
          <span className="rli2-val">{limiar} meses</span>
        </span>
        <input
          type="range"
          min={THRESHOLD_MIN}
          max={THRESHOLD_MAX}
          step={THRESHOLD_STEP}
          value={limiar}
          aria-label="Limiar de decisão em meses de uso"
          onChange={(e) => setLimiar(Number(e.target.value))}
        />
      </label>

      <div className="rli2-meter" aria-live="polite">
        <div className="rli2-meter-top">
          <span>acurácia</span>
          <span className={`rli2-acc ${isGood ? 'is-good' : ''}`}>{Math.round(acc * 100)}%</span>
        </div>
        <p className="rli2-meter-hint">
          {isGood
            ? 'Boa separação! É isso que o modelo faz sozinho, só que com uma curva em vez de uma linha reta.'
            : `Meta: acurácia de pelo menos ${Math.round(ACC_GOAL * 100)}%.`}
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
