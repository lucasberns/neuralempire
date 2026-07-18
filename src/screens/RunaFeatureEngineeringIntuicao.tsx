import { useState } from 'react'
import './RunaFeatureEngineeringIntuicao.css'

// Runa da Intuição de "feature-engineering" (GDD §5.1): ver o efeito de codificar uma coluna
// categórica e de normalizar colunas em escalas diferentes — 2 tarefas em sequência, sem fórmula.
// Props CONGELADAS.

const ALUNOS: readonly { cidade: string; idade: number; faturamento: number }[] = [
  { cidade: 'SP', idade: 32, faturamento: 8500 },
  { cidade: 'RJ', idade: 45, faturamento: 12000 },
  { cidade: 'BH', idade: 27, faturamento: 4200 },
  { cidade: 'SP', idade: 51, faturamento: 9800 },
]

const CIDADES = ['SP', 'RJ', 'BH'] as const

export function RunaFeatureEngineeringIntuicao({ onComplete }: { onComplete: () => void }) {
  const [codificado, setCodificado] = useState(false)
  const [normalizado, setNormalizado] = useState(false)
  const done = codificado && normalizado

  const idades = ALUNOS.map((a) => a.idade)
  const faturamentos = ALUNOS.map((a) => a.faturamento)
  const idadeMin = Math.min(...idades)
  const idadeMax = Math.max(...idades)
  const fatMin = Math.min(...faturamentos)
  const fatMax = Math.max(...faturamentos)
  const norm = (v: number, min: number, max: number) => (v - min) / (max - min)

  return (
    <div className="runa runa-fe-intuicao">
      <p className="rfe-lead">
        Duas sujeiras diferentes numa tabela de alunos: uma coluna de texto e duas colunas em
        escalas bem diferentes.
      </p>

      <div className="rfe-task">
        <p className="rfe-task-title">1. Codificar a cidade</p>
        <table className="rfe-table">
          <thead>
            <tr>
              {!codificado ? (
                <th>cidade</th>
              ) : (
                CIDADES.map((c) => <th key={c}>{`cidade_${c}`}</th>)
              )}
              <th>idade</th>
              <th>faturamento</th>
            </tr>
          </thead>
          <tbody>
            {ALUNOS.map((a, i) => (
              <tr key={i}>
                {!codificado ? (
                  <td>{a.cidade}</td>
                ) : (
                  CIDADES.map((c) => <td key={c}>{a.cidade === c ? 1 : 0}</td>)
                )}
                <td>{normalizado ? norm(a.idade, idadeMin, idadeMax).toFixed(2) : a.idade}</td>
                <td>{normalizado ? norm(a.faturamento, fatMin, fatMax).toFixed(2) : a.faturamento}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="rfe-toggle" onClick={() => setCodificado((v) => !v)}>
          {codificado ? '✓ Codificado' : 'Codificar cidade'}
        </button>
      </div>

      <div className="rfe-task">
        <p className="rfe-task-title">2. Normalizar idade e faturamento</p>
        <p className="rfe-hint">
          Faturamento vai de {fatMin} a {fatMax}; idade só de {idadeMin} a {idadeMax}. Sem
          normalizar, o faturamento domina qualquer cálculo de distância só pelo tamanho.
        </p>
        <button type="button" className="rfe-toggle" onClick={() => setNormalizado((v) => !v)}>
          {normalizado ? '✓ Normalizado (0 a 1)' : 'Normalizar as duas colunas'}
        </button>
      </div>

      {done && (
        <div className="rfe-sucesso">
          <p className="rfe-sucesso-msg" role="status">
            Texto virou número, e as escalas ficaram comparáveis. Agora sim a tabela está pronta
            pra qualquer modelo.
          </p>
          <button type="button" className="runa-cta" onClick={onComplete}>
            Concluir runa
          </button>
        </div>
      )}
    </div>
  )
}
