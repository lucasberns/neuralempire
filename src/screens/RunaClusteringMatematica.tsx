import { useState } from 'react'
import './RunaClusteringMatematica.css'

// Runa da Matemática de "clustering": montar a "receita do K-means" — mesmo mecanismo
// tap-to-place da runa de validação, passos próprios. Tier 4 (GDD §5.4): notação pareada ao
// visual — o passo 2 já cita a fórmula de distância literal. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Escolha k centros iniciais (aleatórios, um por grupo esperado)',
    dica: 'k é decidido por você — quantos grupos você espera encontrar',
    porque: 'Sem centros de partida não tem o que comparar — mesmo que aleatórios, é preciso começar de algum lugar.',
  },
  {
    titulo: 'Cada ponto vai pro centro mais próximo: distância(ponto, centro)',
    dica: 'geralmente distância euclidiana — a régua normal entre 2 pontos',
    porque: 'É essa atribuição que forma os grupos temporários de cada rodada.',
  },
  {
    titulo: 'Recalcule cada centro como a média dos pontos que foram pra ele',
    dica: 'o novo centro é o "centro de massa" do grupo atual',
    porque: 'O centro se move pro meio de verdade do grupo, não fica fixo onde começou.',
  },
  {
    titulo: 'Repita atribuir → recalcular até os centros pararem de mudar (convergência)',
    dica: 'quando mais nenhum ponto muda de grupo, terminou',
    porque: 'É esse ciclo de repetição que faz o K-means "aprender" os grupos sem nenhum rótulo.',
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

export function RunaClusteringMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-clustering-matematica">
      <div className="rcm-formula" aria-hidden="true">↻</div>
      <p className="rcm-lead">
        K-means encontra grupos sem nenhum rótulo — só repetindo um ciclo simples. Monte a receita.
      </p>

      <ol className="rcm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rcm-slot-item">
            <span className="rcm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rcm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rcm-card rcm-card-placed${
                  status === 'errado' && id !== i ? ' rcm-card-fora' : ''
                }${status === 'certo' ? ' rcm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rcm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rcm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rcm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rcm-card rcm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rcm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rcm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rcm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de comparar distâncias?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rcm-sucesso">
          <p className="rcm-sucesso-msg" role="status">
            Esse ciclo (atribuir, recalcular, repetir) é toda a mágica por trás do K-means.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rcm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
