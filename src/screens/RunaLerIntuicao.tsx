import { useState } from 'react'
import './RunaLerIntuicao.css'

// Runa da Intuição de "ler" (GDD §5.1): a tabela é a fonte — aprender a responder
// perguntas simples só de olhar pra ela, sem calcular nada. Props CONGELADAS.

type Linha = { produto: string; categoria: string; preco: number; estoque: number }

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
  | { tipo: 'linha'; texto: string; respostaIdx: number }
  | { tipo: 'numero'; texto: string; resposta: number }

const PERGUNTAS: readonly Pergunta[] = [
  { tipo: 'linha', texto: 'Clique na linha do produto com o MAIOR preço.', respostaIdx: 7 },
  { tipo: 'linha', texto: 'Clique na linha do produto com o MENOR estoque.', respostaIdx: 6 },
  {
    tipo: 'numero',
    texto: "Quantos produtos são da categoria 'Periférico'?",
    resposta: ESTOQUE.filter((l) => l.categoria === 'Periférico').length,
  },
]

export function RunaLerIntuicao({ onComplete }: { onComplete: () => void }) {
  const [passo, setPasso] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'errado'>('idle')
  const [numInput, setNumInput] = useState('')
  const done = passo >= PERGUNTAS.length
  const atual = PERGUNTAS[passo]

  const acertou = () => {
    setFeedback('idle')
    setNumInput('')
    setPasso((p) => p + 1)
  }

  const responderLinha = (idx: number) => {
    if (atual.tipo !== 'linha') return
    if (idx === atual.respostaIdx) acertou()
    else setFeedback('errado')
  }

  const responderNumero = () => {
    if (atual.tipo !== 'numero') return
    if (Number(numInput) === atual.resposta) acertou()
    else setFeedback('errado')
  }

  return (
    <div className="runa runa-ler-intuicao">
      <p className="rli-lead">
        Antes de calcular qualquer coisa, dá pra achar muita coisa só de{' '}
        <span className="rli-em">olhar pra tabela</span>.
      </p>

      <table className="rli-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
          </tr>
        </thead>
        <tbody>
          {ESTOQUE.map((l, i) => (
            <tr
              key={l.produto}
              className={`rli-row${atual?.tipo === 'linha' ? ' rli-row-clickable' : ''}`}
              onClick={() => responderLinha(i)}
              role={atual?.tipo === 'linha' ? 'button' : undefined}
              tabIndex={atual?.tipo === 'linha' ? 0 : undefined}
              onKeyDown={(e) => {
                if (atual?.tipo === 'linha' && (e.key === 'Enter' || e.key === ' ')) responderLinha(i)
              }}
            >
              <td>{l.produto}</td>
              <td>{l.categoria}</td>
              <td>R$ {l.preco}</td>
              <td>{l.estoque}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!done && (
        <div className="rli-task">
          <p className="rli-pergunta">{atual.texto}</p>
          {atual.tipo === 'numero' && (
            <div className="rli-numero">
              <input
                type="number"
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                aria-label="Sua resposta"
              />
              <button type="button" className="rli-responder" onClick={responderNumero}>
                Responder
              </button>
            </div>
          )}
          {feedback === 'errado' && (
            <p className="rli-feedback" role="status">
              Ainda não é essa. Olhe de novo a coluna certa.
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
