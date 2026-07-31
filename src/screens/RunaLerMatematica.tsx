import { useState } from 'react'
import './RunaLerMatematica.css'

// Runa da Matemática de "ler": montar a "receita do resumo" de uma tabela —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Contar quantas linhas existem',
    dica: 'quantos registros você tem no total',
    porque: 'Sem saber o tamanho da tabela, nenhum outro número faz sentido.',
  },
  {
    titulo: 'Achar o maior valor de uma coluna',
    dica: 'o topo do que existe ali',
    porque: 'O máximo mostra o teto — o caso mais extremo pra cima.',
  },
  {
    titulo: 'Achar o menor valor da mesma coluna',
    dica: 'o piso do que existe ali',
    porque: 'O mínimo mostra o outro extremo — junto com o máximo, dá a faixa toda.',
  },
  {
    titulo: 'Calcular a média (soma dividida pela quantidade)',
    dica: 'um número só que representa o "típico"',
    porque: 'A média resume a coluna inteira num único valor de referência.',
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

export function RunaLerMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-ler-matematica">
      <div className="rlm-sigma" aria-hidden="true">Σ</div>
      <p className="rlm-lead">
        Antes de tirar conclusões, tem uma <span className="rlm-em">ordem natural</span>{' '}
        pra resumir uma tabela. Monte ela.
      </p>

      <ol className="rlm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rlm-slot-item">
            <span className="rlm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rlm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rlm-card rlm-card-placed${
                  status === 'errado' && id !== i ? ' rlm-card-fora' : ''
                }${status === 'certo' ? ' rlm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rlm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rlm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rlm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rlm-card rlm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rlm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rlm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rlm-feedback" role="status">
          Ainda não. Pense: o que você precisa saber ANTES de calcular o resto?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rlm-sucesso">
          <p className="rlm-sucesso-msg" role="status">
            Contagem, máximo, mínimo e média: com esses 4 números você já entende o
            formato geral de qualquer tabela.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rlm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
