import { useState } from 'react'
import './RunaFeatureEngineeringMatematica.css'

// Runa da Matemática de "feature-engineering": montar a "receita do preparo" de uma tabela —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Identificar colunas de texto/categoria',
    dica: 'cidade, categoria, tipo — qualquer coisa que não é número',
    porque: 'A maioria dos modelos só entende número — texto precisa virar outra coisa primeiro.',
  },
  {
    titulo: 'Transformar cada categoria numa coluna própria (0 ou 1)',
    dica: 'uma coluna nova pra cada valor possível',
    porque: 'Assim o modelo enxerga "é dessa categoria ou não" sem inventar uma ordem que não existe.',
  },
  {
    titulo: 'Identificar colunas numéricas em escalas diferentes',
    dica: 'ex.: idade (dezenas) e faturamento (milhares)',
    porque: 'Escalas muito diferentes fazem uma coluna dominar as outras só pelo tamanho.',
  },
  {
    titulo: 'Reescalar todas pra uma faixa comparável antes de treinar',
    dica: 'todas ficam com espalhamento parecido',
    porque: 'Só assim cada coluna pesa pela sua importância real, não pelo tamanho dos números.',
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

export function RunaFeatureEngineeringMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-feature-engineering-matematica">
      <div className="rfem-sigma" aria-hidden="true">Σ</div>
      <p className="rfem-lead">
        Antes de treinar qualquer modelo, tem uma <span className="rfem-em">ordem natural</span>{' '}
        pra preparar uma tabela crua. Monte ela.
      </p>

      <ol className="rfem-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rfem-slot-item">
            <span className="rfem-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rfem-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rfem-card rfem-card-placed${
                  status === 'errado' && id !== i ? ' rfem-card-fora' : ''
                }${status === 'certo' ? ' rfem-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rfem-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rfem-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rfem-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rfem-card rfem-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rfem-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rfem-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rfem-feedback" role="status">
          Ainda não. Pense: dá pra reescalar uma coluna que ainda não virou número?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rfem-sucesso">
          <p className="rfem-sucesso-msg" role="status">
            Categorias viraram colunas de 0 e 1, e as escalas numéricas ficaram comparáveis:
            agora a tabela está pronta pro modelo treinar sem viés de formato.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rfem-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
