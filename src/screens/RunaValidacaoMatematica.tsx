import { useState } from 'react'
import './RunaValidacaoMatematica.css'

// Runa da Matemática de "validação": montar a "receita do diagnóstico" —
// mesmo mecanismo tap-to-place da runa de regressão, passos próprios. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Separar uma fatia que o modelo nunca vê no treino',
    dica: 'guarde uma parte dos dados de lado antes de treinar',
    porque: 'Sem essa fatia intocada, não existe forma honesta de medir generalização.',
  },
  {
    titulo: 'Comparar o erro no treino com o erro nessa fatia',
    dica: 'os dois números, lado a lado',
    porque: 'A diferença entre os dois é o que realmente conta a história.',
  },
  {
    titulo: 'Os dois erros altos = o modelo não aprendeu o suficiente',
    dica: 'subajuste — o modelo é simples demais até pro que já viu',
    porque: 'Se nem no treino vai bem, o problema é o modelo, não a novidade dos dados.',
  },
  {
    titulo: 'Treino baixo mas fatia alto = o modelo decorou',
    dica: 'sobreajuste — foi bem no que já viu, mal no que é novo',
    porque: 'Diferente do caso anterior (que ia mal nos dois), aqui ele foi bem no treino — só isso já muda o diagnóstico.',
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

export function RunaValidacaoMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-validacao-matematica">
      <div className="rvm-sigma" aria-hidden="true">Σ</div>
      <p className="rvm-lead">
        Um modelo que só foi visto no treino pode estar <span className="rvm-em">enganando você</span>.
        Monte a receita que separa acerto de decoreba.
      </p>

      <ol className="rvm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rvm-slot-item">
            <span className="rvm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rvm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rvm-card rvm-card-placed${
                  status === 'errado' && id !== i ? ' rvm-card-fora' : ''
                }${status === 'certo' ? ' rvm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rvm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rvm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rvm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rvm-card rvm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rvm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rvm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rvm-feedback" role="status">
          Ainda não. Pense: o que precisa existir ANTES de você poder comparar treino com o novo?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rvm-sucesso">
          <p className="rvm-sucesso-msg" role="status">
            Fatia separada, erros comparados: agora você sabe diagnosticar subajuste e
            sobreajuste só olhando os números.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rvm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
