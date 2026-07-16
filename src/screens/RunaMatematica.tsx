import { useState } from 'react'
import './RunaMatematica.css'

// Runa da Matemática (GDD §5.1, §5.4 tier 1 = visual): montar a "receita do erro"
// (mínimos quadrados pra leigo) ordenando 4 passos embaralhados. Tap-to-place —
// sem drag, à prova de toque no celular. Sem notação formal. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

// Ordem correta = índice do array. `porque` só aparece no sucesso.
const PASSOS: readonly Passo[] = [
  {
    titulo: 'Ver o erro de cada dia',
    dica: 'o quanto errou = valor real − previsto',
    porque: 'Primeiro você precisa saber o tamanho de cada engano.',
  },
  {
    titulo: 'Elevar cada erro ao quadrado',
    dica: 'pra erro negativo não cancelar o positivo — e punir erro grande',
    porque: 'Ao quadrado, +3 e −3 viram os dois 9: nenhum some, e o errão pesa mais.',
  },
  {
    titulo: 'Somar todos os erros ao quadrado',
    dica: 'junta tudo num número só',
    porque: 'Um número só resume o quão longe a reta está de todos os pontos.',
  },
  {
    titulo: 'Ajustar a reta pra deixar essa soma a menor possível',
    dica: 'mexe na reta até esse número ficar mínimo',
    porque: 'Menor soma = melhor reta. É isso que a máquina procura sozinha.',
  },
]

// Embaralha os índices uma vez; garante que não saia já ordenado.
function embaralhar(): number[] {
  const a = PASSOS.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every((v, i) => v === i)) [a[0], a[1]] = [a[1], a[0]]
  return a
}

export function RunaMatematica({ onComplete }: { onComplete: () => void }) {
  const [pool, setPool] = useState<number[]>(embaralhar)
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null])
  // 'idle' | 'errado' | 'certo' — controla feedback do Verificar.
  const [status, setStatus] = useState<'idle' | 'errado' | 'certo'>('idle')

  const cheio = slots.every((s) => s !== null)

  const pegarDoPool = (id: number) => {
    const vaga = slots.indexOf(null)
    if (vaga === -1) return
    setSlots((s) => s.map((v, i) => (i === vaga ? id : v)))
    setPool((p) => p.filter((x) => x !== id))
    setStatus('idle')
  }

  const tirarDoSlot = (idx: number) => {
    const id = slots[idx]
    if (id === null || status === 'certo') return
    setSlots((s) => s.map((v, i) => (i === idx ? null : v)))
    setPool((p) => [...p, id])
    setStatus('idle')
  }

  const verificar = () => {
    setStatus(slots.every((id, i) => id === i) ? 'certo' : 'errado')
  }

  return (
    <div className="runa runa-matematica">
      <div className="rm-sigma" aria-hidden="true">Σ</div>
      <p className="rm-lead">
        Como a máquina mede se a reta é boa? Monte a{' '}
        <span className="rm-em">receita do erro</span> na ordem certa.
      </p>

      <ol className="rm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rm-slot-item">
            <span className="rm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rm-card rm-card-placed${
                  status === 'errado' && id !== i ? ' rm-card-fora' : ''
                }${status === 'certo' ? ' rm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && (
                  <span className="rm-card-porque">{PASSOS[id].porque}</span>
                )}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button
              type="button"
              key={id}
              className="rm-card rm-card-pool"
              onClick={() => pegarDoPool(id)}
            >
              <span className="rm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rm-feedback" role="status">
          Ainda não. Os passos fora de lugar estão marcados — pense: o que precisa vir
          primeiro pra você ter o que somar depois?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rm-sucesso">
          <p className="rm-sucesso-msg" role="status">
            É isso! Essa soma dos erros ao quadrado é a bússola da máquina: ela mexe na
            reta até deixá-la a menor possível.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="rm-verificar"
          onClick={verificar}
          disabled={!cheio}
        >
          Verificar
        </button>
      )}
    </div>
  )
}
