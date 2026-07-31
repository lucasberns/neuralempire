import { useState } from 'react'
import './RunaMetricasAvancadasMatematica.css'

// Runa da Matemática de "métricas avançadas": montar a "receita de precisão/recall/F1" — mesmo
// mecanismo tap-to-place da runa de validação, passos próprios. Tier 3 (GDD §5.4): notação pareada
// ao visual — os passos 2-4 já são as fórmulas literais. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Conte VP (verdadeiro positivo), FP, FN e VN pro limiar escolhido',
    dica: 'compare cada previsão com o real: os 4 casos possíveis',
    porque: 'Toda métrica de classificação sai desses 4 números — sem eles não tem conta pra fazer.',
  },
  {
    titulo: 'Precisão = VP / (VP + FP)',
    dica: 'dos que você disse que sim, quantos eram mesmo?',
    porque: 'Precisão baixa = você está "gritando lobo" demais, sinalizando gente que não devia.',
  },
  {
    titulo: 'Recall = VP / (VP + FN)',
    dica: 'dos que eram sim de verdade, quantos você pegou?',
    porque: 'Recall baixo = você está deixando passar casos reais — o oposto do problema da precisão.',
  },
  {
    titulo: 'F1 = 2 · (Precisão · Recall) / (Precisão + Recall)',
    dica: 'uma nota só que pune quando um dos dois está muito baixo',
    porque: 'Um F1 alto exige os DOIS razoáveis — não dá pra "trapacear" inflando só um dos dois.',
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

export function RunaMetricasAvancadasMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-metricas-avancadas-matematica">
      <div className="rmm-formula" aria-hidden="true">P · R</div>
      <p className="rmm-lead">
        Acurácia sozinha mente quando uma classe é rara. Monte a receita que conta a história
        completa.
      </p>

      <ol className="rmm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rmm-slot-item">
            <span className="rmm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rmm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rmm-card rmm-card-placed${
                  status === 'errado' && id !== i ? ' rmm-card-fora' : ''
                }${status === 'certo' ? ' rmm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rmm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rmm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rmm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rmm-card rmm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rmm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rmm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rmm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de calcular precisão ou recall?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rmm-sucesso">
          <p className="rmm-sucesso-msg" role="status">
            É exatamente essa conta que separa "parece bom" de "é bom de verdade" quando uma classe
            é rara.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rmm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
