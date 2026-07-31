import { useState } from 'react'
import './RunaRandomForestMatematica.css'

// Runa da Matemática de "random forest": montar a "receita do voto da floresta" — mesmo
// mecanismo tap-to-place da runa de validação, passos próprios. Tier 4 (GDD §5.4): notação
// pareada ao visual — o passo 3 já é a fórmula literal da moda. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Cada árvore treina numa amostra bootstrap diferente dos dados originais',
    dica: 'amostra COM reposição — algumas linhas repetem, outras ficam de fora',
    porque: 'Isso faz cada árvore "ver" um recorte levemente diferente da realidade.',
  },
  {
    titulo: 'A cada corte, a árvore só considera um subconjunto aleatório de features',
    dica: 'não todas as colunas de uma vez — só algumas, sorteadas a cada corte',
    porque: 'Isso evita que todas as árvores fiquem parecidas demais, dependentes da mesma feature forte.',
  },
  {
    titulo: 'Previsão final = moda dos votos: moda(árvore₁, árvore₂, ..., árvoreₙ)',
    dica: 'a classe que mais árvores escolheram',
    porque: 'O erro de uma árvore isolada tende a ser corrigido pelo voto das outras.',
  },
  {
    titulo: 'Importância de uma feature = quanto ela reduziu a impureza, somado por todas as árvores',
    dica: 'features que aparecem em cortes decisivos, em várias árvores, pontuam mais',
    porque: 'É assim que o Random Forest te diz quais variáveis realmente importam.',
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

export function RunaRandomForestMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-random-forest-matematica">
      <div className="rrfm-formula" aria-hidden="true">moda(·)</div>
      <p className="rrfm-lead">
        Uma árvore só decide sozinha, e pode errar sozinha. Monte a receita de como uma floresta
        inteira vota.
      </p>

      <ol className="rrfm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rrfm-slot-item">
            <span className="rrfm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rrfm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rrfm-card rrfm-card-placed${
                  status === 'errado' && id !== i ? ' rrfm-card-fora' : ''
                }${status === 'certo' ? ' rrfm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rrfm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rrfm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rrfm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rrfm-card rrfm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rrfm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rrfm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rrfm-feedback" role="status">
          Ainda não. Pense: o que cada árvore precisa ver de DIFERENTE antes de poder votar?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rrfm-sucesso">
          <p className="rrfm-sucesso-msg" role="status">
            É esse voto da maioria, com árvores vendo recortes diferentes, que faz o Random Forest
            robusto.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rrfm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
