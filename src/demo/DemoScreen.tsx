import { useEffect, useState } from 'react'
import type { PyodideClient } from '../pyodide/client'
import type { RunOutcome } from '../pyodide/messages'
import type { GameState } from '../persistence/saveGame'
import { CodeEditor } from '../editor/CodeEditor'
import { DataPreview } from '../components/DataPreview'
import { TestResults } from '../components/TestResults'
import { DEMO_CONTRACT, loadDemoCsv } from './contract'

interface Props {
  client: PyodideClient
  game: GameState
  onGameChange: (g: GameState) => void
}

export function DemoScreen({ client, game, onGameChange }: Props) {
  const [csv, setCsv] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    loadDemoCsv().then(setCsv, (e: unknown) => setCsvError(e instanceof Error ? e.message : String(e)))
  }, [])

  async function run() {
    if (!csv || running) return
    setRunning(true)
    setRunError(null)
    setOutcome(null)
    try {
      const result = await client.run({
        code: game.demo.code,
        setup: DEMO_CONTRACT.setupCode,
        csv,
        tests: DEMO_CONTRACT.tests,
        metrics: DEMO_CONTRACT.metricsCode,
      })
      setOutcome(result)
      if (result.error) return // quebrou antes dos testes → não conta como execução
      onGameChange({
        ...game,
        demo: {
          ...game.demo,
          lastResult: {
            passed: result.tests.filter((t) => t.passed).length,
            total: result.tests.length,
            at: new Date().toISOString(),
          },
        },
      })
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="demo-screen">
      <div className="card briefing">
        <h2>🥖 {DEMO_CONTRACT.titulo}</h2>
        <p>{DEMO_CONTRACT.briefing}</p>
        {game.demo.lastResult && (
          <p className="muted">
            Última execução: {game.demo.lastResult.passed}/{game.demo.lastResult.total} testes.
          </p>
        )}
      </div>

      {csvError && <div className="card error-card">Erro ao carregar o dataset: {csvError}</div>}
      {csv && <DataPreview csv={csv} />}

      <div className="card">
        <h3>🐍 Seu código</h3>
        <CodeEditor
          initialCode={game.demo.code}
          onChange={(code) => onGameChange({ ...game, demo: { ...game.demo, code } })}
        />
        <button className="btn-primary" onClick={() => void run()} disabled={!csv || running}>
          {running ? 'Treinando o modelo…' : '▶ Rodar testes'}
        </button>
      </div>

      {runError && <div className="card error-card">{runError}</div>}
      {outcome && <TestResults outcome={outcome} />}
    </div>
  )
}
