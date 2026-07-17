import { useState } from 'react'
import './RunaExplorarMatematica.css'

// Runa da Matemática de "explorar": montar a "receita da correlação" —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Ver se os pontos sobem juntos ou não',
    dica: 'quando um valor cresce, o outro também cresce (ou não)?',
    porque: 'Isso já diz se existe alguma relação antes de qualquer número.',
  },
  {
    titulo: 'Olhar o sinal: sobem juntos ou um sobe e o outro desce?',
    dica: 'sinal positivo = sobem juntos; negativo = um sobe, outro desce',
    porque: 'O sinal do coeficiente de correlação é exatamente essa direção.',
  },
  {
    titulo: 'Olhar o quão alinhados os pontos estão',
    dica: 'nuvem apertada numa linha imaginária = forte; espalhada = fraca',
    porque: 'Quanto mais perto de uma linha reta, mais perto de 1 (ou −1) fica o número.',
  },
  {
    titulo: 'Resumir tudo num número entre −1 e 1',
    dica: 'esse número é o coeficiente de correlação',
    porque: 'Direção (sinal) + força (tamanho) viram um único número comparável.',
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

export function RunaExplorarMatematica({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<{ pool: number[]; slots: (number | null)[] }>(() => ({
    pool: embaralhar(),
    slots: [null, null, null, null],
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
    <div className="runa runa-explorar-matematica">
      <div className="rem-sigma" aria-hidden="true">Σ</div>
      <p className="rem-lead">
        Antes de calcular qualquer coeficiente, tem uma <span className="rem-em">ordem natural</span>{' '}
        pra medir como duas coisas se relacionam. Monte ela.
      </p>

      <ol className="rem-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rem-slot-item">
            <span className="rem-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rem-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rem-card rem-card-placed${
                  status === 'errado' && id !== i ? ' rem-card-fora' : ''
                }${status === 'certo' ? ' rem-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rem-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rem-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rem-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rem-card rem-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rem-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rem-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rem-feedback" role="status">
          Ainda não. Pense: o que vem primeiro — perceber a direção, ou já cravar o número?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rem-sucesso">
          <p className="rem-sucesso-msg" role="status">
            Direção, sinal e alinhamento resumidos num único número entre −1 e 1: é
            assim que a máquina chega no coeficiente de correlação.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rem-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
