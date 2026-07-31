import { useState } from 'react'
import './RunaRegressaoLogisticaMatematica.css'

// Runa da Matemática de "regressao-logistica": montar a "receita da sigmoide" —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Calcular uma pontuação linear a partir das features',
    dica: 'igual à regressão: um número que combina as entradas',
    porque: 'É o mesmo ponto de partida da regressão linear — só o que vem depois muda.',
  },
  {
    titulo: 'Espremer essa pontuação entre 0 e 1 (função sigmoide)',
    dica: 'não importa o quão grande ou negativa, sempre vira algo entre 0 e 1',
    porque: 'Um número entre 0 e 1 pode ser lido como uma probabilidade.',
  },
  {
    titulo: 'Esse número é a probabilidade da classe',
    dica: 'ex.: 0.8 = 80% de chance de cancelar',
    porque: 'É isso que o modelo realmente calcula — uma chance, não um "sim" ou "não" direto.',
  },
  {
    titulo: 'Aplicar um limiar (ex.: 0,5) pra virar decisão',
    dica: 'acima do limiar = uma classe; abaixo = a outra',
    porque: 'A decisão final (sim/não) é só essa probabilidade cortada em algum ponto.',
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

export function RunaRegressaoLogisticaMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-regressao-logistica-matematica">
      <div className="rlgm-sigma" aria-hidden="true">Σ</div>
      <p className="rlgm-lead">
        Antes de tirar conclusões, tem uma <span className="rlgm-em">ordem natural</span>{' '}
        pra chegar da pontuação até a decisão. Monte ela.
      </p>

      <ol className="rlgm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rlgm-slot-item">
            <span className="rlgm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rlgm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rlgm-card rlgm-card-placed${
                  status === 'errado' && id !== i ? ' rlgm-card-fora' : ''
                }${status === 'certo' ? ' rlgm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rlgm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rlgm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rlgm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rlgm-card rlgm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rlgm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rlgm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rlgm-feedback" role="status">
          Ainda não. Pense: o que vem primeiro — a pontuação ou a probabilidade?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rlgm-sucesso">
          <p className="rlgm-sucesso-msg" role="status">
            Pontuação, sigmoide, probabilidade e limiar: é assim que a regressão
            logística transforma números em decisão.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rlgm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
