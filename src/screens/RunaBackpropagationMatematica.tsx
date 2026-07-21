import { useState } from 'react'
import './RunaBackpropagationMatematica.css'

// Runa da Matemática de "backpropagation": montar a "receita do passo backward" — mesmo
// mecanismo tap-to-place das runas anteriores, passos próprios (foco no backward, complementa
// o forward pass já coberto na runa de Perceptron/MLP). Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Forward pass: calcular a previsão ŷ',
    dica: 'passa a entrada pelas camadas até chegar na saída',
    porque: 'É preciso saber o que a rede prevê ANTES de saber o quanto ela errou.',
  },
  {
    titulo: 'Calcular o erro: L = 0,5·(ŷ - y)²',
    dica: 'compara a previsão com o valor certo',
    porque: 'A perda mede numericamente o tamanho do erro — é o que queremos reduzir.',
  },
  {
    titulo: 'Gradiente da saída: dL/dŷ = ŷ - y',
    dica: 'derivada mais simples de toda a cadeia',
    porque: 'É o ponto de partida de tudo que vem depois — sem ele não dá pra propagar nada.',
  },
  {
    titulo: 'Propagar pela regra da cadeia: dL/dw = dL/dẑ · entrada',
    dica: 'o erro "anda de volta" multiplicando pelas derivadas de cada camada',
    porque: 'É o "backward" de backpropagation: o erro volta pela rede, camada por camada.',
  },
  {
    titulo: 'Atualizar o peso: w_novo = w - η·∂L/∂w',
    dica: 'dá um passo na direção contrária ao gradiente, do tamanho do learning rate',
    porque: 'É aqui que a rede realmente aprende — calcular o gradiente sem aplicar não muda nada.',
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

export function RunaBackpropagationMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-backpropagation-matematica">
      <div className="rbpm-formula" aria-hidden="true">w_novo = w - η·∂L/∂w</div>
      <p className="rbpm-lead">
        Calcular o gradiente não adianta nada sozinho. Monte a receita completa, do forward pass
        até o peso realmente mudar.
      </p>

      <ol className="rbpm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rbpm-slot-item">
            <span className="rbpm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rbpm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rbpm-card rbpm-card-placed${
                  status === 'errado' && id !== i ? ' rbpm-card-fora' : ''
                }${status === 'certo' ? ' rbpm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rbpm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rbpm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rbpm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rbpm-card rbpm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rbpm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rbpm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rbpm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de calcular um gradiente?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rbpm-sucesso">
          <p className="rbpm-sucesso-msg" role="status">
            Esse é o ciclo completo de backpropagation: prever, medir o erro, propagar o gradiente
            pela regra da cadeia, e só então atualizar os pesos.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rbpm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
