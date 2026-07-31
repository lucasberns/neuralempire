import { useState } from 'react'
import './RunaKnnMatematica.css'

// Runa da Matemática de "knn": montar a "receita da vizinhança" —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Medir a distância do ponto novo até todos os outros',
    dica: 'quanto mais perto, mais parecido',
    porque: 'KNN não calcula uma fórmula — ele compara o novo ponto com o que já existe.',
  },
  {
    titulo: 'Pegar os k mais pertinho',
    dica: 'k = quantos vizinhos você decide consultar',
    porque: 'Só os mais próximos importam pra decisão — os distantes são ignorados.',
  },
  {
    titulo: 'Ver qual classe é maioria entre eles',
    dica: 'conte os votos de cada grupo entre os k vizinhos',
    porque: 'A ideia é simples: você provavelmente é parecido com quem está por perto.',
  },
  {
    titulo: 'Essa maioria é a previsão',
    dica: 'sem fórmula nenhuma, só contagem de votos',
    porque: 'É por isso que KNN é chamado de "preguiçoso" — ele só compara na hora de prever.',
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

export function RunaKnnMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-knn-matematica">
      <div className="rkm-sigma" aria-hidden="true">Σ</div>
      <p className="rkm-lead">
        Prever a classe de um ponto novo não exige fórmula nenhuma — exige olhar pra{' '}
        <span className="rkm-em">vizinhança</span>. Monte a ordem certa.
      </p>

      <ol className="rkm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rkm-slot-item">
            <span className="rkm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rkm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rkm-card rkm-card-placed${
                  status === 'errado' && id !== i ? ' rkm-card-fora' : ''
                }${status === 'certo' ? ' rkm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rkm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rkm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rkm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rkm-card rkm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rkm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rkm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rkm-feedback" role="status">
          Ainda não. Pense: antes de votar, você precisa saber quem tá perto — o que vem primeiro?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rkm-sucesso">
          <p className="rkm-sucesso-msg" role="status">
            Medir distância, escolher os k vizinhos e contar os votos: é assim que o KNN
            decide sem nunca treinar uma fórmula.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rkm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
