import { useState } from 'react'
import './RunaLimparIntuicao.css'

// Runa da Intuição de "limpar" (GDD §5.1): achar outliers e valores faltantes numa
// lista, sem fórmula — clique pra marcar, confira, tente de novo se errar.
// Props CONGELADAS.

type Valor = { id: number; label: string; sujeira: boolean }

const IDADES: readonly Valor[] = [
  { id: 0, label: '23', sujeira: false },
  { id: 1, label: '25', sujeira: false },
  { id: 2, label: '19', sujeira: false },
  { id: 3, label: '31', sujeira: false },
  { id: 4, label: '250', sujeira: true },
  { id: 5, label: '22', sujeira: false },
  { id: 6, label: '—', sujeira: true },
  { id: 7, label: '28', sujeira: false },
  { id: 8, label: '−4', sujeira: true },
  { id: 9, label: '26', sujeira: false },
  { id: 10, label: '24', sujeira: false },
  { id: 11, label: '—', sujeira: true },
]

const TOTAL_SUJEIRA = IDADES.filter((v) => v.sujeira).length

export function RunaLimparIntuicao({ onComplete }: { onComplete: () => void }) {
  const [marcados, setMarcados] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<'idle' | 'errado' | 'certo'>('idle')

  const toggle = (id: number) => {
    if (status === 'certo') return
    setMarcados((m) => {
      const next = new Set(m)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setStatus('idle')
  }

  const verificar = () => {
    const certos = IDADES.every((v) => marcados.has(v.id) === v.sujeira)
    setStatus(certos ? 'certo' : 'errado')
  }

  return (
    <div className="runa runa-limpar-intuicao">
      <p className="rlpi-lead">
        Idade dos clientes cadastrados. Clique em todo valor que parece{' '}
        <span className="rlpi-em">sujeira</span>: um número impossível ou um dado faltando.
      </p>

      <div className="rlpi-chips" aria-label="Idades cadastradas">
        {IDADES.map((v) => (
          <button
            type="button"
            key={v.id}
            className={`rlpi-chip${marcados.has(v.id) ? ' rlpi-chip-marcado' : ''}${
              status === 'errado'
                ? marcados.has(v.id) !== v.sujeira
                  ? ' rlpi-chip-errado'
                  : ''
                : ''
            }${status === 'certo' ? ' rlpi-chip-certo' : ''}`}
            onClick={() => toggle(v.id)}
            disabled={status === 'certo'}
            aria-pressed={marcados.has(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {status === 'errado' && (
        <p className="rlpi-feedback" role="status">
          Ainda não bateu — tem {TOTAL_SUJEIRA} valores sujos ao todo. Marcados errado
          estão destacados; reveja também os que faltou marcar.
        </p>
      )}

      {status === 'certo' ? (
        <div className="rlpi-sucesso">
          <p className="rlpi-sucesso-msg" role="status">
            Isso: valores impossíveis (fora da faixa que faz sentido) e espaços vazios
            são os dois tipos de sujeira mais comuns antes de qualquer análise.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      ) : (
        <button type="button" className="rlpi-verificar" onClick={verificar}>
          Verificar
        </button>
      )}
    </div>
  )
}
