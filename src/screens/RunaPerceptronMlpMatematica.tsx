import { useState } from 'react'
import './RunaPerceptronMlpMatematica.css'

// Runa da Matemática de "perceptron-mlp": montar a "receita do forward pass" — mesmo
// mecanismo tap-to-place da runa de Random Forest, passos próprios. Notação pareada ao
// visual — o passo 5 já é a fórmula literal da previsão. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Entrada: x₁ = horas_por_mês normalizado, x₂ = valor_plano normalizado',
    dica: 'os dois números que descrevem o cliente, entre 0 e 1',
    porque: 'É tudo que a rede vê — o resto é aprendido a partir daqui.',
  },
  {
    titulo: 'Peso + viés da camada escondida: z = W₁·x + b₁',
    dica: 'combinação linear das entradas — ainda é só uma reta, por enquanto',
    porque: 'Sozinha, essa conta é exatamente o que um Perceptron faz — por isso ainda não basta.',
  },
  {
    titulo: 'Ativação da camada escondida (tanh): h = tanh(z)',
    dica: 'comprime o resultado pra entre -1 e 1, de um jeito não-linear',
    porque: 'É aqui que a rede ganha a capacidade de curvar a fronteira — sem essa ativação não-linear, empilhar camadas lineares ainda dá só uma reta.',
  },
  {
    titulo: 'Peso + viés da saída: y_lin = W₂·h + b₂',
    dica: 'combina os neurônios da camada escondida numa única saída',
    porque: 'Cada neurônio escondido "votou" numa direção — essa conta junta os votos.',
  },
  {
    titulo: 'Ativação da saída (sigmoid) = previsão: ŷ = sigmoid(y_lin)',
    dica: 'comprime o resultado pra um valor entre 0 e 1',
    porque: 'É esse número que a gente lê como "probabilidade de cancelar".',
  },
]

function embaralhar(): number[] {
  const a = PASSOS.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every((v, i) => v === i)) [a[0], a[1]] = [a[1], a[0]]
  return a
}

export function RunaPerceptronMlpMatematica({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<{ pool: number[]; slots: (number | null)[] }>(() => ({
    pool: embaralhar(),
    slots: [null, null, null, null, null],
  }))
  const [status, setStatus] = useState<'idle' | 'errado' | 'certo'>('idle')
  const { pool, slots } = state
  const cheio = slots.every((s) => s !== null)

  const pegarDoPool = (id: number) => {
    setState((s) => {
      const vaga = s.slots.indexOf(null)
      if (vaga === -1) return s
      return {
        pool: s.pool.filter((x) => x !== id),
        slots: s.slots.map((v, i) => (i === vaga ? id : v)),
      }
    })
    setStatus('idle')
  }

  const tirarDoSlot = (idx: number) => {
    if (status === 'certo') return
    setState((s) => {
      const id = s.slots[idx]
      if (id === null) return s
      return {
        pool: [...s.pool, id],
        slots: s.slots.map((v, i) => (i === idx ? null : v)),
      }
    })
    setStatus('idle')
  }

  const verificar = () => {
    setStatus(slots.every((id, i) => id === i) ? 'certo' : 'errado')
  }

  return (
    <div className="runa runa-perceptron-mlp-matematica">
      <div className="rpmm-formula" aria-hidden="true">sigmoid(W₂·tanh(W₁·x+b₁)+b₂)</div>
      <p className="rpmm-lead">
        Um neurônio sozinho só desenha uma reta. Monte a receita de como a informação atravessa a
        rede até virar uma previsão.
      </p>

      <ol className="rpmm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rpmm-slot-item">
            <span className="rpmm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rpmm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rpmm-card rpmm-card-placed${
                  status === 'errado' && id !== i ? ' rpmm-card-fora' : ''
                }${status === 'certo' ? ' rpmm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rpmm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rpmm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rpmm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rpmm-card rpmm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rpmm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rpmm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rpmm-feedback" role="status">
          Ainda não. Pense: o que precisa acontecer ANTES de virar previsão?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rpmm-sucesso">
          <p className="rpmm-sucesso-msg" role="status">
            É essa passagem por uma ativação não-linear (tanh) na camada escondida que faz o MLP
            conseguir o que um Perceptron sozinho não consegue.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rpmm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
