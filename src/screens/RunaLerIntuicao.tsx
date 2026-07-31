import { useState } from 'react'
import './RunaLerIntuicao.css'

// Runa da Intuição de "ler" (GDD §5.1): a tabela é a fonte — aprender a responder
// perguntas simples só de olhar pra ela, sem calcular nada. Props CONGELADAS.

type Linha = { produto: string; categoria: string; preco: number; estoque: number }
type ColunaKey = 'produto' | 'categoria' | 'preco' | 'estoque'

const ESTOQUE: readonly Linha[] = [
  { produto: 'Teclado mecânico', categoria: 'Periférico', preco: 320, estoque: 12 },
  { produto: 'Mouse óptico', categoria: 'Periférico', preco: 45, estoque: 30 },
  { produto: 'Monitor 24"', categoria: 'Tela', preco: 890, estoque: 5 },
  { produto: 'Cabo HDMI', categoria: 'Cabo', preco: 25, estoque: 60 },
  { produto: 'Webcam HD', categoria: 'Periférico', preco: 150, estoque: 8 },
  { produto: 'SSD 480GB', categoria: 'Armazenamento', preco: 210, estoque: 15 },
  { produto: 'Headset gamer', categoria: 'Periférico', preco: 180, estoque: 3 },
  { produto: 'Monitor 27"', categoria: 'Tela', preco: 1200, estoque: 6 },
]

type Pergunta =
  | { tipo: 'linha'; texto: string; respostaIdx: number; coluna: ColunaKey }
  | { tipo: 'numero'; texto: string; resposta: number; coluna: ColunaKey }

const idxMaiorPreco = ESTOQUE.reduce((best, l, i) => (l.preco > ESTOQUE[best].preco ? i : best), 0)
const idxMenorEstoque = ESTOQUE.reduce((best, l, i) => (l.estoque < ESTOQUE[best].estoque ? i : best), 0)

const PERGUNTAS: readonly Pergunta[] = [
  {
    tipo: 'linha',
    texto: 'Clique na linha do produto com o MAIOR preço.',
    respostaIdx: idxMaiorPreco,
    coluna: 'preco',
  },
  {
    tipo: 'linha',
    texto: 'Clique na linha do produto com o MENOR estoque.',
    respostaIdx: idxMenorEstoque,
    coluna: 'estoque',
  },
  {
    tipo: 'numero',
    texto: "Quantos produtos são da categoria 'Periférico'?",
    resposta: ESTOQUE.filter((l) => l.categoria === 'Periférico').length,
    coluna: 'categoria',
  },
]

const COLUNAS: readonly { key: ColunaKey; label: string }[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'preco', label: 'Preço' },
  { key: 'estoque', label: 'Estoque' },
]

export function RunaLerIntuicao({ onComplete }: { onComplete: () => void }) {
  const [passo, setPasso] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'errado' | 'certo'>('idle')
  const [numInput, setNumInput] = useState('')
  const done = passo >= PERGUNTAS.length
  const atual = PERGUNTAS[passo]

  const acertou = () => {
    setFeedback('certo')
    // Delay proposital: dá tempo do jogador ver "✓ Isso mesmo!" e a linha
    // destacada antes de avançar — hoje pulava direto sem confirmação.
    window.setTimeout(() => {
      setFeedback('idle')
      setNumInput('')
      setPasso((p) => p + 1)
    }, 800)
  }

  const responderLinha = (idx: number) => {
    if (done || atual.tipo !== 'linha' || feedback === 'certo') return
    if (idx === atual.respostaIdx) acertou()
    else setFeedback('errado')
  }

  const responderNumero = () => {
    if (done || atual.tipo !== 'numero' || feedback === 'certo') return
    if (Number(numInput) === atual.resposta) acertou()
    else setFeedback('errado')
  }

  const colunaAtual = !done ? COLUNAS.find((c) => c.key === atual.coluna) : undefined

  return (
    <div className="runa runa-ler-intuicao">
      <p className="rli-lead">
        Antes de calcular qualquer coisa, dá pra achar muita coisa só de{' '}
        <span className="rli-em">olhar pra tabela</span>.
      </p>

      <div className="rli-table-wrap">
        <table className="rli-table">
          <thead>
            <tr>
              {COLUNAS.map((c) => (
                <th key={c.key} className={feedback === 'errado' && colunaAtual?.key === c.key ? 'rli-col-hint' : ''}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ESTOQUE.map((l, i) => (
              <tr
                key={l.produto}
                className={`rli-row${
                  !done && atual.tipo === 'linha' && feedback !== 'certo' ? ' rli-row-clickable' : ''
                }${feedback === 'certo' && !done && atual.tipo === 'linha' && i === atual.respostaIdx ? ' rli-row-certo' : ''}`}
                onClick={() => responderLinha(i)}
                role={!done && atual.tipo === 'linha' ? 'button' : undefined}
                tabIndex={!done && atual.tipo === 'linha' ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!done && atual.tipo === 'linha' && (e.key === 'Enter' || e.key === ' ')) {
                    if (e.key === ' ') e.preventDefault()
                    responderLinha(i)
                  }
                }}
              >
                <td className={feedback === 'errado' && colunaAtual?.key === 'produto' ? 'rli-col-hint' : ''}>
                  {l.produto}
                </td>
                <td className={feedback === 'errado' && colunaAtual?.key === 'categoria' ? 'rli-col-hint' : ''}>
                  {l.categoria}
                </td>
                <td
                  className={`rli-num${feedback === 'errado' && colunaAtual?.key === 'preco' ? ' rli-col-hint' : ''}`}
                >
                  R$ {l.preco}
                </td>
                <td
                  className={`rli-num${feedback === 'errado' && colunaAtual?.key === 'estoque' ? ' rli-col-hint' : ''}`}
                >
                  {l.estoque}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!done && (
        <div className="rli-task">
          <p className="rli-progresso">
            Pergunta {passo + 1} de {PERGUNTAS.length}
          </p>
          <p className="rli-pergunta">{atual.texto}</p>
          {atual.tipo === 'numero' && (
            <div className="rli-numero">
              <input
                type="number"
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') responderNumero()
                }}
                aria-label="Sua resposta"
                disabled={feedback === 'certo'}
              />
              <button
                type="button"
                className="rli-responder"
                onClick={responderNumero}
                disabled={feedback === 'certo'}
              >
                Responder
              </button>
            </div>
          )}
          {feedback === 'errado' && (
            <p className="rli-feedback" role="status">
              Ainda não é essa. Olhe de novo a coluna <b>{colunaAtual?.label}</b>.
            </p>
          )}
          {feedback === 'certo' && (
            <p className="rli-feedback rli-feedback-ok" role="status">
              ✓ Isso mesmo!
            </p>
          )}
        </div>
      )}

      {done && (
        <div className="rli-sucesso">
          <p className="rli-sucesso-msg" role="status">
            Isso: ler bem uma tabela já responde a maioria das perguntas do dia a dia —
            sem estatística nenhuma.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      )}
    </div>
  )
}
