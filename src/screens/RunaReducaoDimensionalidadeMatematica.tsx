import { useState } from 'react'
import './RunaReducaoDimensionalidadeMatematica.css'

// Runa da Matemática de "redução de dimensionalidade": montar a "receita do PCA" — mesmo
// mecanismo tap-to-place da runa de validação, passos próprios. Tier 4 (GDD §5.4): notação
// pareada ao visual — o passo 3 já é a fórmula literal da projeção. Props CONGELADAS.

type Passo = { titulo: string; dica: string; porque: string }

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Padronize as variáveis (escalas diferentes dominariam senão)',
    dica: 'subtrai a média, divide pelo desvio padrão — mesma ideia de Feature Engineering',
    porque: 'Uma variável medida em centenas dominaria os componentes só pelo tamanho, não pela informação real.',
  },
  {
    titulo: 'Ache as direções de maior variância dos dados (componentes principais)',
    dica: 'a direção onde os pontos mais se espalham',
    porque: 'É nessa direção que está a maior parte da informação real dos dados.',
  },
  {
    titulo: 'Projete os dados nas 2 primeiras direções: componente = dados · direção',
    dica: 'cada ponto vira 2 números novos, combinação das colunas originais',
    porque: 'É essa projeção que "achata" os dados de alta dimensão pra um gráfico 2D.',
  },
  {
    titulo: 'A % de variância explicada diz quanta informação sobrou nos 2 eixos',
    dica: 'perto de 100% = quase nada se perdeu; baixo = perdeu bastante',
    porque: 'Sem essa checagem, você não sabe se o "achatamento" preservou o que importa.',
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

export function RunaReducaoDimensionalidadeMatematica({ onComplete }: { onComplete: () => void }) {
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
    <div className="runa runa-reducao-dimensionalidade-matematica">
      <div className="rrdm-formula" aria-hidden="true">dados · direção</div>
      <p className="rrdm-lead">
        PCA comprime várias colunas correlacionadas em poucas, sem perder o que importa. Monte a
        receita.
      </p>

      <ol className="rrdm-slots" aria-label="Passos na ordem que você montou">
        {slots.map((id, i) => (
          <li key={i} className="rrdm-slot-item">
            <span className="rrdm-slot-n">{i + 1}</span>
            {id === null ? (
              <span className="rrdm-slot-vazio">toque um card abaixo</span>
            ) : (
              <button
                type="button"
                className={`rrdm-card rrdm-card-placed${
                  status === 'errado' && id !== i ? ' rrdm-card-fora' : ''
                }${status === 'certo' ? ' rrdm-card-certo' : ''}`}
                onClick={() => tirarDoSlot(i)}
                disabled={status === 'certo'}
              >
                <span className="rrdm-card-titulo">{PASSOS[id].titulo}</span>
                {status === 'certo' && <span className="rrdm-card-porque">{PASSOS[id].porque}</span>}
              </button>
            )}
          </li>
        ))}
      </ol>

      {status !== 'certo' && (
        <div className="rrdm-pool" aria-label="Cards disponíveis">
          {pool.map((id) => (
            <button type="button" key={id} className="rrdm-card rrdm-card-pool" onClick={() => pegarDoPool(id)}>
              <span className="rrdm-card-titulo">{PASSOS[id].titulo}</span>
              <span className="rrdm-card-dica">{PASSOS[id].dica}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'errado' && (
        <p className="rrdm-feedback" role="status">
          Ainda não. Pense: o que precisa acontecer com as escalas ANTES do PCA rodar?
        </p>
      )}

      {status === 'certo' ? (
        <div className="rrdm-sucesso">
          <p className="rrdm-sucesso-msg" role="status">
            Foi essa receita que reduziu 6 biomarcadores pra 2 componentes sem perder quase nada de
            informação.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rrdm-verificar" onClick={verificar} disabled={!cheio}>
          Verificar
        </button>
      )}
    </div>
  )
}
