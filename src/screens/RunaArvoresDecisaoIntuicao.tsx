import { useMemo, useState } from 'react'
import './RunaArvoresDecisaoIntuicao.css'

// Runa da Intuição de "arvores-decisao" (GDD §5.1): arrastar um corte sobre uma faixa 1D de
// pedidos e ver a impureza de Gini de cada lado mudar em tempo real — mesmo espírito de "arrastar
// e ver o número mudar" da Regressão Linear/Logística, aplicado a partição em vez de reta/limiar
// de classe. Props CONGELADAS.

type Pedido = { valorPedido: number; fraude: boolean }

// Dataset fixo: 16 pedidos, eixo x = valor_pedido. Um ponto de ruído (230, fraude) fica do lado
// "barato" — eco do dataset real (devolucoes.csv), onde 4 rótulos foram invertidos de propósito.
const PEDIDOS: readonly Pedido[] = [
  { valorPedido: 30, fraude: false },
  { valorPedido: 55, fraude: false },
  { valorPedido: 80, fraude: false },
  { valorPedido: 110, fraude: false },
  { valorPedido: 140, fraude: false },
  { valorPedido: 170, fraude: false },
  { valorPedido: 200, fraude: false },
  { valorPedido: 230, fraude: true },
  { valorPedido: 260, fraude: true },
  { valorPedido: 290, fraude: true },
  { valorPedido: 320, fraude: true },
  { valorPedido: 350, fraude: true },
  { valorPedido: 380, fraude: true },
  { valorPedido: 410, fraude: true },
  { valorPedido: 440, fraude: true },
  { valorPedido: 470, fraude: true },
]

const X_MIN = 0, X_MAX = 500
const CORTE_MIN = 20, CORTE_MAX = 480, CORTE_STEP = 5
const IMPUREZA_META = 0.15 // impureza combinada abaixo disso = corte bom

const VB_W = 320, VB_H = 200
const PAD = { l: 16, r: 16, t: 16, b: 36 }
const PLOT_W = VB_W - PAD.l - PAD.r
const sx = (x: number) => PAD.l + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const rowY = (fraude: boolean) => (fraude ? PAD.t + 30 : VB_H - PAD.b - 30)

function gini(pontos: readonly Pedido[]): number {
  if (pontos.length === 0) return 0
  const fraudes = pontos.filter((p) => p.fraude).length
  const pFraude = fraudes / pontos.length
  const pNaoFraude = 1 - pFraude
  return 1 - (pFraude * pFraude + pNaoFraude * pNaoFraude)
}

export function RunaArvoresDecisaoIntuicao({ onComplete }: { onComplete: () => void }) {
  const [corte, setCorte] = useState(100)
  const [solved, setSolved] = useState(false)

  const { esquerda, direita, giniEsquerda, giniDireita, impurezaTotal } = useMemo(() => {
    const esq = PEDIDOS.filter((p) => p.valorPedido < corte)
    const dir = PEDIDOS.filter((p) => p.valorPedido >= corte)
    const gEsq = gini(esq)
    const gDir = gini(dir)
    const total = (esq.length * gEsq + dir.length * gDir) / PEDIDOS.length
    return { esquerda: esq, direita: dir, giniEsquerda: gEsq, giniDireita: gDir, impurezaTotal: total }
  }, [corte])

  const isGood = impurezaTotal <= IMPUREZA_META
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-arvores-decisao-intuicao">
      <p className="rad-lead">
        Cada bolinha é um pedido de devolução. <span className="rad-em">Vermelho</span> = fraude,{' '}
        <span className="rad-em-ok">verde</span> = ok. Arraste o corte e veja a impureza de Gini de
        cada lado mudar — quanto mais perto de 0, mais pura (só uma classe) fica aquele lado.
      </p>

      <svg
        className="rad-plot"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Pedidos de devolução por valor, com um corte separando fraude de não-fraude"
      >
        <line className="rad-axis" x1={PAD.l} y1={VB_H - PAD.b} x2={VB_W - PAD.r} y2={VB_H - PAD.b} />
        <text className="rad-axis-label" x={VB_W / 2} y={VB_H - 8} textAnchor="middle">
          valor do pedido
        </text>

        <line
          className={`rad-corte ${isGood ? 'is-good' : ''}`}
          x1={sx(corte)}
          y1={PAD.t}
          x2={sx(corte)}
          y2={VB_H - PAD.b}
        />

        {PEDIDOS.map((p, i) => (
          <circle
            key={i}
            className={`rad-dot ${p.fraude ? 'is-fraude' : 'is-ok'}`}
            cx={sx(p.valorPedido)}
            cy={rowY(p.fraude)}
            r={6}
          />
        ))}
      </svg>

      <label className="rad-slider">
        <span className="rad-slider-top">
          <span>corte (valor do pedido)</span>
          <span className="rad-val">R$ {corte}</span>
        </span>
        <input
          type="range"
          min={CORTE_MIN}
          max={CORTE_MAX}
          step={CORTE_STEP}
          value={corte}
          aria-label="Posição do corte, em valor do pedido"
          onChange={(e) => setCorte(Number(e.target.value))}
        />
      </label>

      <div className="rad-meter" aria-live="polite">
        <p className="rad-lados">
          Esquerda: {esquerda.length} pedidos, Gini {giniEsquerda.toFixed(2)} · Direita:{' '}
          {direita.length} pedidos, Gini {giniDireita.toFixed(2)}
        </p>
        <div className="rad-meter-top">
          <span>impureza combinada</span>
          <span className={`rad-imp ${isGood ? 'is-good' : ''}`}>{impurezaTotal.toFixed(2)}</span>
        </div>
        <p className="rad-meter-hint">
          {isGood
            ? 'Corte achado! Foi assim, corte a corte, que a árvore de decisão separou fraude de não-fraude.'
            : `Meta: impureza combinada ≤ ${IMPUREZA_META.toFixed(2)}.`}
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
