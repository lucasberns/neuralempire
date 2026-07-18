import { useState } from 'react'
import './RunaRegularizacaoMatematica.css'

// Runa da Matemática de "regularização": montar a "receita da penalidade" — mesmo mecanismo
// tap-to-place da runa de validação, passos próprios. Tier 3 (GDD §5.4): notação pareada ao
// visual — o passo 2 já é a fórmula literal da penalidade. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Um modelo comum dá peso a TODA variável, mesmo ruído — ele decora em vez de generalizar',
    dica: 'sem penalidade, o modelo usa tudo que reduzir o erro no treino, até coincidências',
    porque: 'É por isso que ele vai pior em dados novos — aprendeu ruído específico do treino.',
  },
  {
    titulo: 'Regularização soma uma penalidade ao erro: λ · (peso das variáveis)',
    dica: 'quanto maior λ (força), mais caro fica manter pesos grandes',
    porque: 'O modelo passa a preferir explicações mais simples, mesmo abrindo mão de um pouco de ajuste no treino.',
  },
  {
    titulo: 'L1 (Lasso) pode zerar peso de vez — vira seleção automática de variável',
    dica: 'algumas variáveis somem completamente do modelo',
    porque: 'Isso é diferente de "encolher um pouco" — L1 decide que a variável simplesmente não ajuda.',
  },
  {
    titulo: 'L2 (Ridge) encolhe todo mundo um pouco, sem zerar — reduz o exagero sem descartar nada',
    dica: 'todos os pesos ficam menores, nenhum vira exatamente zero',
    porque: 'Útil quando você acredita que toda variável ajuda um pouco, só não quer nenhuma dominando sozinha.',
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

export function RunaRegularizacaoMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-regularizacao-matematica">
      <div className="rrm-formula" aria-hidden="true">λ</div>
      <p className="rrm-lead">
        Regularização é o modelo aprendendo a não confiar demais em nenhuma variável sozinha. Monte
        a receita.
      </p>

      <ol className="rrm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rrm-slot-item">
            <span className="rrm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rrm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rrm-card rrm-card-placed${
                  status === 'errado' && id !== i ? ' rrm-card-fora' : ''
                }${status === 'certo' ? ' rrm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rrm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rrm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rrm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rrm-card rrm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rrm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rrm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rrm-feedback" role="status">
          Ainda não. Pense: o que o modelo comum faz de errado ANTES de existir qualquer penalidade?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rrm-sucesso">
          <p className="rrm-sucesso-msg" role="status">
            Foi essa penalidade que fez o Lasso zerar o ruído e generalizar melhor no contrato.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rrm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
