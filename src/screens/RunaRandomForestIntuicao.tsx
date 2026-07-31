import { useMemo, useState } from 'react'
import './RunaRandomForestIntuicao.css'

// Runa da Intuição de "random-forest" (GDD §5.1): regular quantas árvores votam e ver o resultado
// (a moda dos votos) estabilizar — cada árvore viu uma amostra/subconjunto diferente dos dados
// (bagging), então o voto de poucas árvores é instável. Props CONGELADAS.

type Voto = 'cancela' | 'fica'

// 7 "árvores" com votos fixos pré-calibrados pro mesmo cliente de consulta — maioria real
// (5 de 7) é "cancela", mas com poucas árvores votando o resultado ainda oscila.
const VOTOS: readonly Voto[] = ['fica', 'cancela', 'cancela', 'fica', 'cancela', 'cancela', 'cancela']
const GABARITO: Voto = 'cancela'
const N_MIN_ESTAVEL = 5

export function RunaRandomForestIntuicao({ onComplete }: { onComplete: () => void }) {
  const [nArvores, setNArvores] = useState(1)
  const [solved, setSolved] = useState(false)

  const { moda, cancela, fica } = useMemo(() => {
    const ativos = VOTOS.slice(0, nArvores)
    const cancela = ativos.filter((v) => v === 'cancela').length
    const fica = ativos.length - cancela
    return { moda: (cancela >= fica ? 'cancela' : 'fica') as Voto, cancela, fica }
  }, [nArvores])

  const isGood = moda === GABARITO && nArvores >= N_MIN_ESTAVEL
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-random-forest-intuicao">
      <p className="rrf-lead">
        Cada árvore vota sozinha, olhando uma amostra diferente dos dados (bagging). Regule quantas
        árvores votam e veja o resultado final — a maioria — estabilizar.
      </p>

      <div className="rrf-arvores" role="img" aria-label="Árvores votando cancela ou fica">
        {VOTOS.map((v, i) => (
          <span
            key={i}
            className={`rrf-arvore ${i < nArvores ? `is-ativa is-${v}` : 'is-inativa'}`}
          >
            🌲
          </span>
        ))}
      </div>

      <label className="rrf-slider">
        <span className="rrf-slider-top">
          <span>quantas árvores votam</span>
          <span className="rrf-val">{nArvores}</span>
        </span>
        <input
          type="range"
          min={1}
          max={VOTOS.length}
          step={1}
          value={nArvores}
          aria-label="Número de árvores votando"
          onChange={(e) => setNArvores(Number(e.target.value))}
        />
      </label>

      <div className="rrf-meter" aria-live="polite">
        <p className="rrf-contagem">
          cancela: <b className="is-cancela">{cancela}</b> · fica: <b className="is-fica">{fica}</b>
        </p>
        <p className={`rrf-resultado ${isGood ? 'is-good' : ''}`}>
          Voto da maioria: <b>{moda}</b>
        </p>
        <p className="rrf-meter-hint">
          {isGood
            ? 'Com árvores suficientes votando, o resultado deixa de depender de uma decisão frágil — isso é bagging.'
            : 'Aumente o número de árvores até o resultado estabilizar.'}
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
