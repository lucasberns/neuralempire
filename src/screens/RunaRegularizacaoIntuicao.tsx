import { useMemo, useState } from 'react'
import './RunaRegularizacaoIntuicao.css'

// Runa da Intuição de "regularizacao" (GDD §5.1): uma tabela fixa de coeficientes por força de
// regularização — igual em espírito à curva fixa de treino x teste da runa de Validação, só que
// com N barras (uma por variável) em vez de 2 linhas. Props CONGELADAS.

type Var = { key: string; label: string; relevante: boolean }

// 3 variáveis relevantes (encolhem devagar, nunca zeram) + 2 de ruído (zeram rápido) — eco de
// creditopremium.csv (renda/tempo_emprego/num_cartoes relevantes; indice_x1/x2, ruído puro).
const VARS: readonly Var[] = [
  { key: 'renda', label: 'renda', relevante: true },
  { key: 'tempo_emprego', label: 'tempo de emprego', relevante: true },
  { key: 'num_cartoes', label: 'nº de cartões', relevante: true },
  { key: 'indice_x1', label: 'índice x1 (ruído)', relevante: false },
  { key: 'indice_x2', label: 'índice x2 (ruído)', relevante: false },
]

// Tabela didática fixa: coeficiente (valor absoluto) por força de 1 a 10. Não é uma regressão de
// verdade — são valores calibrados pra ilustrar o efeito (ruído zera rápido, relevante encolhe devagar).
const TABELA: readonly { forca: number; coefs: Record<string, number> }[] = [
  { forca: 1, coefs: { renda: 100, tempo_emprego: 80, num_cartoes: 60, indice_x1: 40, indice_x2: 35 } },
  { forca: 2, coefs: { renda: 95, tempo_emprego: 76, num_cartoes: 57, indice_x1: 28, indice_x2: 22 } },
  { forca: 3, coefs: { renda: 90, tempo_emprego: 72, num_cartoes: 54, indice_x1: 16, indice_x2: 9 } },
  { forca: 4, coefs: { renda: 85, tempo_emprego: 68, num_cartoes: 51, indice_x1: 4, indice_x2: 0 } },
  { forca: 5, coefs: { renda: 80, tempo_emprego: 64, num_cartoes: 48, indice_x1: 0, indice_x2: 0 } },
  { forca: 6, coefs: { renda: 75, tempo_emprego: 60, num_cartoes: 45, indice_x1: 0, indice_x2: 0 } },
  { forca: 7, coefs: { renda: 70, tempo_emprego: 56, num_cartoes: 42, indice_x1: 0, indice_x2: 0 } },
  { forca: 8, coefs: { renda: 65, tempo_emprego: 52, num_cartoes: 39, indice_x1: 0, indice_x2: 0 } },
  { forca: 9, coefs: { renda: 60, tempo_emprego: 48, num_cartoes: 36, indice_x1: 0, indice_x2: 0 } },
  { forca: 10, coefs: { renda: 55, tempo_emprego: 44, num_cartoes: 33, indice_x1: 0, indice_x2: 0 } },
]

const ORIGINAL = TABELA[0].coefs

export function RunaRegularizacaoIntuicao({ onComplete }: { onComplete: () => void }) {
  const [forca, setForca] = useState(1)
  const [solved, setSolved] = useState(false)

  const ponto = useMemo(() => TABELA.find((t) => t.forca === forca)!, [forca])

  const ruidoZerado = VARS.filter((v) => !v.relevante).every((v) => ponto.coefs[v.key] === 0)
  const relevanteSobrou = VARS.filter((v) => v.relevante).some(
    (v) => ponto.coefs[v.key] / ORIGINAL[v.key] > 0.3,
  )
  const isGood = ruidoZerado && relevanteSobrou
  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-regularizacao-intuicao">
      <p className="rri-lead">
        Cada barra é o peso (coeficiente) de uma variável. Aumente a força da regularização e veja o
        que acontece com o ruído vs. o que importa de verdade.
      </p>

      <div className="rri-barras" role="img" aria-label="Coeficiente de cada variável na força atual">
        {VARS.map((v) => {
          const valor = ponto.coefs[v.key]
          const pct = Math.round((valor / ORIGINAL[v.key]) * 100)
          const zerado = valor === 0
          return (
            <div key={v.key} className="rri-linha">
              <span className="rri-label">{v.label}</span>
              <div className="rri-trilha">
                <div
                  className={`rri-barra ${v.relevante ? 'is-relevante' : 'is-ruido'}${zerado ? ' is-zerado' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="rri-pct">{zerado ? 'zerado' : `${pct}%`}</span>
            </div>
          )
        })}
      </div>

      <label className="rri-slider">
        <span className="rri-slider-top">
          <span>força da regularização</span>
          <span className="rri-val">{forca}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={forca}
          aria-label="Força da regularização"
          onChange={(e) => setForca(Number(e.target.value))}
        />
      </label>

      <div className="rri-meter" aria-live="polite">
        <p className="rri-meter-hint">
          {isGood
            ? 'O ruído zerou, o que importa sobrou — é exatamente isso que Lasso faz com dados de verdade.'
            : 'Aumente a força até os dois "índices" (ruído) zerarem, sem zerar as variáveis relevantes.'}
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
