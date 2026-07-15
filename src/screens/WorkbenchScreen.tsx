import { useEffect, useState } from 'react'
import type { PyodideClient, ClientState } from '../pyodide/client'
import type { RunOutcome } from '../pyodide/messages'
import type { GameState } from '../persistence/saveGame'
import type { Contract } from '../engine/contracts'
import type { View } from '../components/BottomNav'
import { CodeEditor } from '../editor/CodeEditor'
import { DataPreview } from '../components/DataPreview'
import { TestResults } from '../components/TestResults'
import { completeContract, isDone } from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

export function WorkbenchScreen({
  contract,
  client,
  pyState,
  game,
  onGameChange,
  onNavigate,
}: {
  contract: Contract
  client: PyodideClient
  pyState: ClientState
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
}) {
  const [csv, setCsv] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [hintsOpen, setHintsOpen] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [reward, setReward] = useState<{ payout: number; rep: number } | null>(null)
  const [editorNonce, setEditorNonce] = useState(0) // bump → remonta o editor com o código novo

  const code = game.codeByContract[contract.id] ?? contract.starterCode
  const done = isDone(game, contract.id)
  const pyReady = pyState.phase === 'ready'

  useEffect(() => {
    fetch(contract.datasetUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setCsv, (e: unknown) => setCsvError(e instanceof Error ? e.message : String(e)))
  }, [contract.datasetUrl])

  function setCode(next: string) {
    onGameChange({ ...game, codeByContract: { ...game.codeByContract, [contract.id]: next } })
  }

  async function run() {
    if (!csv || running || !pyReady) return
    setRunning(true)
    setRunError(null)
    setOutcome(null)
    setReward(null)
    try {
      const result = await client.run({
        code,
        setup: contract.setupCode,
        csv,
        tests: contract.tests,
        metrics: contract.metricsCode,
      })
      setOutcome(result)
      if (result.ok && !done) {
        const { next, already } = completeContract(game, contract)
        if (!already) {
          onGameChange(next)
          setReward({ payout: contract.payout, rep: contract.reputacao })
        }
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">
          {contract.emoji} {contract.titulo}
        </h2>
        <p className="muted">
          Meta: <b>{contract.metaLabel}</b> · Paga {money(contract.payout)}
        </p>
      </div>

      <div className="panel briefing">
        <p>{contract.briefing}</p>
      </div>

      {csvError && <div className="panel error-card">Erro ao carregar o dataset: {csvError}</div>}
      {csv && (
        <DataPreview
          csv={csv}
          note={
            contract.id === 'previsao-padaria'
              ? 'Os primeiros 48 dias viram dados_treino; os 12 finais, dados_novos (entrega secreta).'
              : undefined
          }
        />
      )}

      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Seu código</h3>
          <span className="chip">python · sklearn</span>
        </div>
        <CodeEditor key={`${contract.id}:${editorNonce}`} initialCode={code} onChange={setCode} />

        {!pyReady && pyState.phase === 'loading' && (
          <p className="py-loading">
            <span className="spinner" /> Carregando o motor Python… ({pyState.progress.message})
          </p>
        )}
        {pyState.phase === 'error' && (
          <p className="py-loading err">
            Não consegui carregar o Python. No primeiro uso é preciso estar online (~60 MB).
            Verifique a conexão e recarregue.
          </p>
        )}

        <button
          className="btn btn-primary"
          onClick={() => void run()}
          disabled={!csv || running || !pyReady}
        >
          {running ? 'Treinando o modelo…' : '▶ Rodar testes'}
        </button>

        <div className="assist-row">
          {contract.hints.length > 0 && (
            <button
              className="btn btn-ghost"
              disabled={hintsOpen >= contract.hints.length}
              onClick={() => setHintsOpen((n) => n + 1)}
            >
              💡 {hintsOpen === 0 ? 'Pedir dica' : `Mais uma dica (${hintsOpen}/${contract.hints.length})`}
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowSolution((s) => !s)}>
            {showSolution ? 'Esconder solução' : '👁 Ver solução'}
          </button>
        </div>

        {hintsOpen > 0 && (
          <ol className="hints">
            {contract.hints.slice(0, hintsOpen).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        )}

        {showSolution && (
          <div className="solution">
            <p className="muted">
              Uma solução possível — leia, entenda, e depois escreva você mesmo. Aprender é o ativo.
            </p>
            <pre>{contract.solution}</pre>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setCode(contract.solution)
                setEditorNonce((n) => n + 1)
                setShowSolution(false)
              }}
            >
              Copiar para o editor
            </button>
          </div>
        )}
      </div>

      {runError && <div className="panel error-card">{runError}</div>}

      {reward && (
        <div className="panel reward-panel">
          <div className="reward-burst">✓</div>
          <h3 className="panel-title">Contrato entregue!</h3>
          <p>
            <b className="amber">+{money(reward.payout)}</b> no caixa e{' '}
            <b>+{reward.rep} de reputação</b>. Skill dominada na árvore.
          </p>
          <div className="assist-row">
            <button className="btn btn-primary" onClick={() => onNavigate('contratos')}>
              Próximo contrato →
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('skills')}>
              Ver árvore
            </button>
          </div>
        </div>
      )}

      {outcome && <TestResults outcome={outcome} />}
    </section>
  )
}
