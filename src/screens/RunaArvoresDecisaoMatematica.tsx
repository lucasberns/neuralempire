import { useState } from 'react'
import './RunaArvoresDecisaoMatematica.css'

// Runa da Matemática de "árvores de decisão": montar a "receita da impureza de Gini" — mesmo
// mecanismo tap-to-place da runa de validação, passos próprios. Tier 3 (GDD §5.4): notação pareada
// ao visual — o passo 3 já é a fórmula literal. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Conte quantos exemplos de cada classe caem de cada lado do corte',
    dica: 'quantos "fraude" e quantos "não-fraude" em cada metade',
    porque: 'Sem essa contagem não tem como medir o quão "misturado" cada lado ficou.',
  },
  {
    titulo: 'Para cada lado, calcule a proporção de cada classe (pᵢ)',
    dica: 'proporção = quantos daquela classe ÷ total daquele lado',
    porque: 'A proporção, não a contagem bruta, é o que entra na fórmula — um lado com 100 pontos e outro com 5 ainda são comparáveis.',
  },
  {
    titulo: 'Impureza de Gini = 1 − Σ pᵢ²',
    dica: 'a fórmula que resume o quão "misturado" está aquele lado',
    porque: 'Gini = 0 quando um lado tem só uma classe (puro); cresce conforme as classes se misturam.',
  },
  {
    titulo: 'Impureza total = média ponderada da impureza dos dois lados',
    dica: 'pondere pelo tamanho de cada lado, não uma média simples',
    porque: 'Um corte que deixa um lado gigante e puro e outro minúsculo e impuro não é tão bom quanto parece numa média simples.',
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

export function RunaArvoresDecisaoMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-arvores-decisao-matematica">
      <div className="ram-formula" aria-hidden="true">1 − Σ pᵢ²</div>
      <p className="ram-lead">
        Toda árvore de decisão escolhe cortes tentando <span className="ram-em">minimizar a impureza</span>.
        Monte a receita que calcula essa impureza.
      </p>

      <ol className="ram-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="ram-slot-item">
            <span className="ram-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="ram-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`ram-card ram-card-placed${
                  status === 'errado' && id !== i ? ' ram-card-fora' : ''
                }${status === 'certo' ? ' ram-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="ram-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="ram-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="ram-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="ram-card ram-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="ram-card-titulo">{PASSOS[id].titulo}</span>
              <span className="ram-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="ram-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de calcular a proporção de cada classe?
        </p>
      )}

      {status === 'certo' ? (
        <div className="ram-sucesso">
          <p className="ram-sucesso-msg" role="status">
            Impureza calculada corretamente — é exatamente essa conta que a árvore repete em cada
            corte, automaticamente.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="ram-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
