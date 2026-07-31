import { useState } from 'react'
import './RunaLimparMatematica.css'

// Runa da Matemática de "limpar": montar a "receita da limpeza de dados" —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Comparar cada valor com a faixa que faz sentido',
    dica: 'idade negativa ou de 250 anos não existe',
    porque: 'Sem uma faixa esperada, não dá pra saber o que é estranho.',
  },
  {
    titulo: 'Valor muito fora da faixa = outlier',
    dica: 'destoa demais do resto dos dados',
    porque: 'Outlier pode distorcer médias e conclusões se ficar sem tratar.',
  },
  {
    titulo: 'Espaço vazio = dado faltante',
    dica: 'não é um valor errado, é a ausência de valor',
    porque: 'Faltante e outlier são sujeiras diferentes — pedem tratamentos diferentes.',
  },
  {
    titulo: 'Decidir: remover o outlier ou preencher o faltante',
    dica: 'ex.: remover a linha, ou substituir o faltante pela média',
    porque: 'Só depois de limpo os dados ficam prontos pra qualquer análise em cima.',
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

export function RunaLimparMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-limpar-matematica">
      <div className="rlpm-sigma" aria-hidden="true">Σ</div>
      <p className="rlpm-lead">
        Antes de analisar qualquer coisa, tem uma <span className="rlpm-em">ordem natural</span>{' '}
        pra limpar dados bagunçados. Monte ela.
      </p>

      <ol className="rlpm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rlpm-slot-item">
            <span className="rlpm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rlpm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rlpm-card rlpm-card-placed${
                  status === 'errado' && id !== i ? ' rlpm-card-fora' : ''
                }${status === 'certo' ? ' rlpm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rlpm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rlpm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rlpm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rlpm-card rlpm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rlpm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rlpm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rlpm-feedback" role="status">
          Ainda não. Pense: o que você precisa saber ANTES de decidir o que fazer com um valor estranho?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rlpm-sucesso">
          <p className="rlpm-sucesso-msg" role="status">
            Faixa esperada, outlier, faltante, decisão: essa é a receita pra deixar
            qualquer dado bagunçado pronto pra análise.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rlpm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
