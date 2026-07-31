import { useState } from 'react'
import './RunaGradientBoostingMatematica.css'

// Runa da Matemática de "gradient boosting": montar a "receita do boosting sequencial" — mesmo
// mecanismo tap-to-place da runa de validação, passos próprios. Tier 4 (GDD §5.4): notação
// pareada ao visual — o passo 2 já é a fórmula literal do resíduo. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Treine uma primeira árvore simples nos dados originais',
    dica: 'o ponto de partida, ainda com bastante erro',
    porque: 'É a base sobre a qual todas as correções seguintes vão ser construídas.',
  },
  {
    titulo: 'Calcule o erro residual: resíduo = real − previsto',
    dica: 'o que a primeira árvore ainda não acertou',
    porque: 'Esse resíduo — não o alvo original — é o que a próxima árvore vai tentar prever.',
  },
  {
    titulo: 'Treine a PRÓXIMA árvore pra prever esse resíduo, não o alvo original',
    dica: 'cada árvore nova é especialista em corrigir o erro da rodada anterior',
    porque: 'É isso que torna o processo sequencial, diferente do voto simultâneo do Random Forest.',
  },
  {
    titulo: 'Previsão final = soma de todas as árvores, cada uma corrigindo a anterior',
    dica: 'não é voto — é soma acumulada de correções',
    porque: 'Cada árvore refina um pouco mais o que sobrou de erro, até o resíduo ficar pequeno.',
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

export function RunaGradientBoostingMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-gradient-boosting-matematica">
      <div className="rgbm-formula" aria-hidden="true">real − previsto</div>
      <p className="rgbm-lead">
        Gradient Boosting não vota — ele corrige. Monte a receita de como cada árvore refina a
        anterior.
      </p>

      <ol className="rgbm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rgbm-slot-item">
            <span className="rgbm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rgbm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rgbm-card rgbm-card-placed${
                  status === 'errado' && id !== i ? ' rgbm-card-fora' : ''
                }${status === 'certo' ? ' rgbm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rgbm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rgbm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rgbm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rgbm-card rgbm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rgbm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rgbm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rgbm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de calcular o resíduo?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rgbm-sucesso">
          <p className="rgbm-sucesso-msg" role="status">
            Essa correção sequencial é o que faz o boosting espremer o erro pra baixo, passo a
            passo.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rgbm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
