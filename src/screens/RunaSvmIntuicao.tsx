import { useMemo, useState } from 'react'
import './RunaSvmIntuicao.css'

// Runa da Intuição de "svm" (GDD §5.1): arrastar a posição de uma fronteira vertical entre dois
// grupos e maximizar a margem — a distância até o ponto mais próximo de cada lado. Os pontos mais
// próximos da fronteira são os vetores de suporte: só eles decidem onde ela fica. Props CONGELADAS.

type Peca = { x: number; y: number; classe: 'ok' | 'defeituosa' }

// Dataset fixo: 12 peças, 2 clusters bem separados (eco de pecas.csv) com um vão nítido entre eles.
const PECAS: readonly Peca[] = [
  { x: 1, y: 3, classe: 'ok' },
  { x: 1.5, y: 5, classe: 'ok' },
  { x: 2, y: 2, classe: 'ok' },
  { x: 2.5, y: 6, classe: 'ok' },
  { x: 3, y: 4, classe: 'ok' },
  { x: 3.5, y: 3, classe: 'ok' },
  { x: 6, y: 4, classe: 'defeituosa' },
  { x: 6.5, y: 2, classe: 'defeituosa' },
  { x: 7, y: 6, classe: 'defeituosa' },
  { x: 7.5, y: 3, classe: 'defeituosa' },
  { x: 8, y: 5, classe: 'defeituosa' },
  { x: 9, y: 4, classe: 'defeituosa' },
]

const POSICAO_MIN = 3.5, POSICAO_MAX = 6.5, POSICAO_STEP = 0.1
const MARGEM_META = 1.1

const VB = 200
const PAD = 16
const SCALE_X = 10
const SCALE_Y = 8
const sx = (x: number) => PAD + (x / SCALE_X) * (VB - 2 * PAD)
const sy = (y: number) => VB - PAD - (y / SCALE_Y) * (VB - 2 * PAD)

export function RunaSvmIntuicao({ onComplete }: { onComplete: () => void }) {
  const [posicao, setPosicao] = useState(4)
  const [solved, setSolved] = useState(false)

  const { margem, vetorEsquerda, vetorDireita } = useMemo(() => {
    const ok = PECAS.filter((p) => p.classe === 'ok')
    const defeituosa = PECAS.filter((p) => p.classe === 'defeituosa')
    const maisProximoOk = ok.reduce((a, b) => (b.x > a.x ? b : a))
    const maisProximoDef = defeituosa.reduce((a, b) => (b.x < a.x ? b : a))
    const margemEsq = posicao - maisProximoOk.x
    const margemDir = maisProximoDef.x - posicao
    return {
      margem: Math.min(margemEsq, margemDir),
      vetorEsquerda: maisProximoOk,
      vetorDireita: maisProximoDef,
    }
  }, [posicao])

  const isGood = margem >= MARGEM_META
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-svm-intuicao">
      <p className="rsi-lead">
        Ajuste a fronteira até maximizar a <span className="rsi-em">margem</span> — a distância até
        o ponto mais próximo de cada lado. Os pontos destacados são os{' '}
        <span className="rsi-em">vetores de suporte</span>: só eles decidem onde a fronteira fica.
      </p>

      <svg
        className="rsi-plot"
        viewBox={`0 0 ${VB} ${VB}`}
        role="img"
        aria-label="Peças OK e defeituosas, com uma fronteira ajustável entre os dois grupos"
      >
        {PECAS.map((p, i) => {
          const isVetor = p === vetorEsquerda || p === vetorDireita
          return (
            <circle
              key={i}
              className={`rsi-dot is-${p.classe}${isVetor ? ' is-vetor' : ''}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={isVetor ? 7 : 5}
            />
          )
        })}

        <line
          className={`rsi-fronteira ${isGood ? 'is-good' : ''}`}
          x1={sx(posicao)}
          y1={sy(SCALE_Y)}
          x2={sx(posicao)}
          y2={sy(0)}
        />
        <line
          className="rsi-margem"
          x1={sx(posicao - margem)}
          y1={sy(SCALE_Y)}
          x2={sx(posicao - margem)}
          y2={sy(0)}
        />
        <line
          className="rsi-margem"
          x1={sx(posicao + margem)}
          y1={sy(SCALE_Y)}
          x2={sx(posicao + margem)}
          y2={sy(0)}
        />
      </svg>

      <label className="rsi-slider">
        <span className="rsi-slider-top">
          <span>posição da fronteira</span>
          <span className="rsi-val">{posicao.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={POSICAO_MIN}
          max={POSICAO_MAX}
          step={POSICAO_STEP}
          value={posicao}
          aria-label="Posição da fronteira"
          onChange={(e) => setPosicao(Number(e.target.value))}
        />
      </label>

      <div className="rsi-meter" aria-live="polite">
        <div className="rsi-meter-top">
          <span>margem</span>
          <span className={`rsi-margem-v ${isGood ? 'is-good' : ''}`}>{margem.toFixed(2)}</span>
        </div>
        <p className="rsi-meter-hint">
          {isGood
            ? 'Margem maximizada! Uma peça nova com um pouco de ruído na medição ainda cai do lado certo.'
            : `Meta: margem ≥ ${MARGEM_META.toFixed(1)}.`}
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
