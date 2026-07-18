import { useMemo, useState } from 'react'
import './RunaValidacaoIntuicao.css'

// Runa da Intuição de "validacao" (GDD §5.2/§7.1): a clássica curva de erro de treino x teste
// contra a complexidade do modelo — subajuste, ponto doce, sobreajuste. Props CONGELADAS.

// Curva fixa (erro em %, complexidade de 1 a 10): treino sempre cai; teste forma um U.
const CURVA: readonly { complexidade: number; erroTreino: number; erroTeste: number }[] = [
  { complexidade: 1, erroTreino: 42, erroTeste: 45 },
  { complexidade: 2, erroTreino: 34, erroTeste: 36 },
  { complexidade: 3, erroTreino: 27, erroTeste: 29 },
  { complexidade: 4, erroTreino: 21, erroTeste: 23 },
  { complexidade: 5, erroTreino: 16, erroTeste: 18 },
  { complexidade: 6, erroTreino: 12, erroTeste: 17 },
  { complexidade: 7, erroTreino: 8, erroTeste: 20 },
  { complexidade: 8, erroTreino: 5, erroTeste: 26 },
  { complexidade: 9, erroTreino: 3, erroTeste: 34 },
  { complexidade: 10, erroTreino: 1, erroTeste: 44 },
]

const SWEET_SPOT = 5 // complexidade com o menor erro de teste

const VB_W = 300, VB_H = 220
const PAD = { l: 34, r: 12, t: 12, b: 28 }
const PLOT_W = VB_W - PAD.l - PAD.r
const PLOT_H = VB_H - PAD.t - PAD.b
const sx = (c: number) => PAD.l + ((c - 1) / 9) * PLOT_W
const sy = (erro: number) => PAD.t + (1 - erro / 50) * PLOT_H

export function RunaValidacaoIntuicao({ onComplete }: { onComplete: () => void }) {
  const [complexidade, setComplexidade] = useState(1)
  const [solved, setSolved] = useState(false)

  const ponto = useMemo(() => CURVA.find((c) => c.complexidade === complexidade)!, [complexidade])

  const diagnostico = useMemo(() => {
    if (complexidade < SWEET_SPOT - 1) return 'subajuste'
    if (complexidade > SWEET_SPOT + 1) return 'sobreajuste'
    return 'bom'
  }, [complexidade])

  const isGood = diagnostico === 'bom'
  if (isGood && !solved) setSolved(true)

  const linhaTreino = CURVA.map((c) => `${sx(c.complexidade)},${sy(c.erroTreino)}`).join(' ')
  const linhaTeste = CURVA.map((c) => `${sx(c.complexidade)},${sy(c.erroTeste)}`).join(' ')

  return (
    <div className="runa runa-validacao-intuicao">
      <p className="rvi-lead">
        Duas curvas: erro no <span className="rvi-em-treino">treino</span> e erro no{' '}
        <span className="rvi-em-teste">teste</span>. Arraste a complexidade até achar o ponto doce.
      </p>

      <svg
        className="rvi-plot"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Curvas de erro de treino e de teste contra a complexidade do modelo"
      >
        <line className="rvi-axis" x1={PAD.l} y1={sy(0)} x2={VB_W - PAD.r} y2={sy(0)} />
        <line className="rvi-axis" x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={sy(0)} />
        <text className="rvi-axis-label" x={VB_W / 2} y={VB_H - 6} textAnchor="middle">
          complexidade do modelo
        </text>

        <polyline className="rvi-linha-treino" points={linhaTreino} />
        <polyline className="rvi-linha-teste" points={linhaTeste} />

        <line
          className={`rvi-cursor ${isGood ? 'is-good' : ''}`}
          x1={sx(complexidade)}
          y1={PAD.t}
          x2={sx(complexidade)}
          y2={sy(0)}
        />
      </svg>

      <label className="rvi-slider">
        <span className="rvi-slider-top">
          <span>complexidade</span>
          <span className="rvi-val">{complexidade}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={complexidade}
          aria-label="Complexidade do modelo"
          onChange={(e) => setComplexidade(Number(e.target.value))}
        />
      </label>

      <div className="rvi-meter" aria-live="polite">
        <p className="rvi-erros">
          Erro treino: <b className="rvi-em-treino">{ponto.erroTreino}%</b> · Erro teste:{' '}
          <b className="rvi-em-teste">{ponto.erroTeste}%</b>
        </p>
        <p className={`rvi-diagnostico is-${diagnostico}`}>
          {diagnostico === 'subajuste' && 'Subajuste: o modelo é simples demais, erra os dois.'}
          {diagnostico === 'sobreajuste' && 'Sobreajuste: treino ótimo, mas o teste piora — decorou.'}
          {diagnostico === 'bom' && 'Ponto doce: o erro de teste está no seu menor valor.'}
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
