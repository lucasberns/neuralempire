import { useState } from 'react'
import './RunaExplorarIntuicao.css'

// Runa da Intuição de "explorar" (GDD §5.1): reconhecer direção/força de correlação
// à vista, sem calcular nada — 4 gráficos estáticos, aponte o certo. Props CONGELADAS.

type Ponto = readonly [number, number]

const POSITIVA_FORTE: readonly Ponto[] = [
  [1, 2], [2, 3], [3, 5], [4, 6], [5, 8], [6, 9], [7, 11], [8, 12],
]
const NEGATIVA_FORTE: readonly Ponto[] = [
  [1, 12], [2, 11], [3, 9], [4, 8], [5, 6], [6, 5], [7, 3], [8, 2],
]
const SEM_CORRELACAO: readonly Ponto[] = [
  [1, 7], [2, 3], [3, 9], [4, 2], [5, 8], [6, 4], [7, 6], [8, 5],
]
const POSITIVA_FRACA: readonly Ponto[] = [
  [1, 4], [2, 7], [3, 3], [4, 8], [5, 5], [6, 9], [7, 6], [8, 10],
]

type Grafico = { id: string; nome: string; pontos: readonly Ponto[] }

const GRAFICOS: readonly Grafico[] = [
  { id: 'a', nome: 'A', pontos: POSITIVA_FORTE },
  { id: 'b', nome: 'B', pontos: NEGATIVA_FORTE },
  { id: 'c', nome: 'C', pontos: SEM_CORRELACAO },
  { id: 'd', nome: 'D', pontos: POSITIVA_FRACA },
]

const PERGUNTAS: readonly { texto: string; respostaId: string }[] = [
  { texto: 'Clique no gráfico que mostra uma correlação POSITIVA forte (sobe junto, bem alinhado).', respostaId: 'a' },
  { texto: 'Clique no gráfico que mostra uma correlação NEGATIVA forte (um sobe, o outro desce).', respostaId: 'b' },
  { texto: 'Clique no gráfico que NÃO mostra correlação nenhuma (nuvem espalhada, sem padrão).', respostaId: 'c' },
]

const VB = 100
const PAD = 10
const sx = (x: number) => PAD + ((x - 1) / 7) * (VB - 2 * PAD)
const sy = (y: number) => VB - PAD - ((y - 1) / 11) * (VB - 2 * PAD)

export function RunaExplorarIntuicao({ onComplete }: { onComplete: () => void }) {
  const [passo, setPasso] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'errado'>('idle')
  const done = passo >= PERGUNTAS.length
  const atual = PERGUNTAS[passo]

  const responder = (id: string) => {
    if (done) return
    if (id === atual.respostaId) {
      setFeedback('idle')
      setPasso((p) => p + 1)
    } else {
      setFeedback('errado')
    }
  }

  return (
    <div className="runa runa-explorar-intuicao">
      <p className="rei-lead">
        Antes de calcular qualquer coeficiente, dá pra <span className="rei-em">ver</span> se
        duas coisas andam juntas só olhando o formato da nuvem de pontos.
      </p>

      <div className="rei-grid">
        {GRAFICOS.map((g) => (
          <button
            type="button"
            key={g.id}
            className="rei-card"
            onClick={() => responder(g.id)}
            aria-label={`Gráfico ${g.nome}`}
          >
            <svg viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label={`Dispersão do gráfico ${g.nome}`}>
              {g.pontos.map(([x, y], i) => (
                <circle key={i} cx={sx(x)} cy={sy(y)} r={2.4} className="rei-dot" />
              ))}
            </svg>
            <span className="rei-card-nome">{g.nome}</span>
          </button>
        ))}
      </div>

      {!done && (
        <div className="rei-task">
          <p className="rei-pergunta">{atual.texto}</p>
          {feedback === 'errado' && (
            <p className="rei-feedback" role="status">
              Não é esse. Olhe se os pontos sobem, descem ou não seguem padrão nenhum.
            </p>
          )}
        </div>
      )}

      {done && (
        <div className="rei-sucesso">
          <p className="rei-sucesso-msg" role="status">
            Isso: força e direção de correlação dá pra sentir só olhando — é exatamente
            isso que um coeficiente de correlação depois vai colocar em número.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      )}
    </div>
  )
}
