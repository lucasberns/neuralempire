import { useState } from 'react'
import './RunaSvmMatematica.css'

// Runa da Matemática de "svm": montar a "receita da margem máxima" — mesmo mecanismo tap-to-place
// da runa de validação, passos próprios. Tier 3 (GDD §5.4): dosagem mais conceitual (1º contato
// com SVM), nomeando margem e vetores de suporte antes de qualquer formalismo. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Ache uma reta que separe as duas classes sem erro',
    dica: 'primeiro, qualquer reta que funcione',
    porque: 'Sem isso não tem margem pra medir — a separação vem antes da otimização.',
  },
  {
    titulo: 'Meça a distância dos pontos mais próximos até essa reta, dos dois lados',
    dica: 'essa distância é a margem',
    porque: 'É essa distância — não a acurácia no treino — que o SVM tenta maximizar.',
  },
  {
    titulo: 'Só os pontos mais próximos (vetores de suporte) decidem onde a fronteira fica',
    dica: 'os outros pontos, mais longe, nem entram na conta',
    porque: 'Diferente de outros modelos que usam TODOS os pontos, o SVM final depende só de poucos vetores de suporte.',
  },
  {
    titulo: 'Quanto maior a margem, mais robusto o modelo a ruído em dados novos',
    dica: 'margem grande = folga antes de errar',
    porque: 'Uma medição nova com um pouco de ruído ainda cai do lado certo se a margem for larga.',
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

export function RunaSvmMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-svm-matematica">
      <div className="rsm-formula" aria-hidden="true">⟷</div>
      <p className="rsm-lead">
        SVM não procura só UMA reta que separe as classes — procura a <span className="rsm-em">MELHOR</span>.
        Monte a receita.
      </p>

      <ol className="rsm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rsm-slot-item">
            <span className="rsm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rsm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rsm-card rsm-card-placed${
                  status === 'errado' && id !== i ? ' rsm-card-fora' : ''
                }${status === 'certo' ? ' rsm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rsm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rsm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rsm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rsm-card rsm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rsm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rsm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rsm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de medir a margem?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rsm-sucesso">
          <p className="rsm-sucesso-msg" role="status">
            Essa é a ideia central do SVM: maximizar a margem, não só acertar o treino.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rsm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
