import { useEffect, useState } from 'react'
import type { PyodideClient, ClientState } from '../pyodide/client'
import type { RunOutcome } from '../pyodide/messages'
import type { GameState } from '../persistence/saveGame'
import type { Contract } from '../engine/contracts'
import type { View } from '../nav'
import { CodeEditor } from '../editor/CodeEditor'
import { DataPreview } from '../components/DataPreview'
import { TestResults } from '../components/TestResults'
import { Interrogatorio } from './Interrogatorio'
import {
  HARDWARE,
  RELAMPAGO,
  RENT_PER_TURN,
  bossCooldownMsLeft,
  bossOnCooldown,
  completeContract,
  failBoss,
  fmtCooldown,
  hardwareOk,
  interrogationPassed,
  isDone,
  lessonFor,
  nowMs,
  skillOfContract,
} from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

export function WorkbenchScreen({
  contract,
  mode = 'boss',
  client,
  pyState,
  game,
  onGameChange,
  onNavigate,
  onKataDone,
}: {
  contract: Contract
  /** 'kata' = Runa do Código (prática, não paga); 'boss' = Prova de Domínio. */
  mode?: 'kata' | 'boss'
  client: PyodideClient
  pyState: ClientState
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
  onKataDone?: () => void
}) {
  const [csv, setCsv] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [hintsOpen, setHintsOpen] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [interrogating, setInterrogating] = useState(false)
  const [kataPassed, setKataPassed] = useState(false)
  const [reward, setReward] = useState<{ earned: number; rep: number; rent: number } | null>(null)
  const [failed, setFailed] = useState<{ correct: number; total: number } | null>(null)
  const [editorNonce, setEditorNonce] = useState(0) // bump → remonta o editor com o código novo

  const code = game.codeByContract[contract.id] ?? contract.starterCode
  const done = isDone(game, contract.id)
  const pyReady = pyState.phase === 'ready'
  // Prova de verdade = boss único (não kata, não bairro, não relâmpago). Só aqui vale a Fase 1.
  const isProva = mode === 'boss' && !contract.repeatable && contract.id !== RELAMPAGO.id
  // Fase 1: no boss NÃO tem aula/dica/solução — treino e prova ficam separados.
  const lesson = isProva ? undefined : lessonFor(contract.id)
  const skill = skillOfContract(contract.id)
  const needsHardware = isProva && !done && !hardwareOk(game, contract)
  const onCooldown = isProva && !done && bossOnCooldown(game, contract.id, nowMs())
  const blocked = needsHardware || onCooldown

  useEffect(() => {
    fetch(contract.datasetUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setCsv, (e: unknown) => setCsvError(e instanceof Error ? e.message : String(e)))
  }, [contract.datasetUrl])

  function setCode(next: string) {
    onGameChange({ ...game, codeByContract: { ...game.codeByContract, [contract.id]: next } })
  }

  function finalize(interrogationScore: number) {
    const { next, earned, rent } = completeContract(game, contract, interrogationScore)
    onGameChange(next)
    setReward({ earned, rep: contract.reputacao, rent })
    setInterrogating(false)
  }

  async function run() {
    if (!csv || running || !pyReady || blocked) return
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
      if (result.ok) {
        if (mode === 'kata') setKataPassed(true) // runa do código: sem pagamento/interrogatório
        else if (!done) {
          if (contract.interrogation.length > 0) setInterrogating(true) // boss → interrogatório
          else finalize(1) // relâmpago / sem perguntas
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
          {mode === 'kata' ? (
            <>
              Runa do Código · treino, não paga · Meta: <b>{contract.metaLabel}</b>
            </>
          ) : contract.repeatable ? (
            <>
              Meta: <b>{contract.metaLabel}</b> · Paga {money(contract.payout)} · contrato do bairro
            </>
          ) : (
            <>
              Meta: <b>{contract.metaLabel}</b> · Paga até {money(contract.payout)} · Custo do mês{' '}
              {money(RENT_PER_TURN)}
            </>
          )}
        </p>
      </div>

      <div className="panel briefing">
        <p>{contract.briefing}</p>
      </div>

      {needsHardware && (
        <div className="panel error-card block-card">
          <h3 className="panel-title">🖥 Precisa de um PC melhor</h3>
          <p>
            Treinar isso de verdade não roda no {HARDWARE[game.hardwareLevel]?.nome}. Suba para{' '}
            <b>{HARDWARE[contract.minHardware ?? 0]?.nome}</b> na garagem e volte.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('lab')}>
            Voltar à garagem →
          </button>
        </div>
      )}

      {onCooldown && (
        <div className="panel error-card block-card">
          <h3 className="panel-title">⏳ Prova em cooldown</h3>
          {failed && (
            <p>
              Você acertou <b>{failed.correct}/{failed.total}</b> no interrogatório — o cliente
              precisava de pelo menos <b>⅔</b>. Trabalho recusado, sem pagamento.
            </p>
          )}
          <p className="muted">
            Tente de novo em <b>{fmtCooldown(bossCooldownMsLeft(game, contract.id, nowMs()))}</b>.
            {skill && (
              <> Enquanto isso, refaça as runas de <b>{skill.nome}</b> (Intuição · Matemática · Código) no quadro.</>
            )}
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('skills')}>
            Ir para o quadro de skills →
          </button>
        </div>
      )}

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

      {lesson && (
        <details className="panel lesson" open={mode === 'kata'}>
          <summary>
            <span className="lesson-title">📖 Como escrever esse código</span>
            <span className="lesson-hint">passo a passo</span>
          </summary>
          <p className="lesson-intro">{lesson.intro}</p>
          <ol className="lesson-steps">
            {lesson.passos.map((p, i) => (
              <li key={i}>
                <code className="lesson-code">{p.code}</code>
                <span className="lesson-explica">{p.explica}</span>
              </li>
            ))}
          </ol>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setCode(contract.solution)
              setEditorNonce((n) => n + 1)
            }}
          >
            Escrever esse exemplo no editor pra mim
          </button>
        </details>
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
          disabled={!csv || running || !pyReady || blocked}
        >
          {running ? 'Treinando o modelo…' : '▶ Rodar testes'}
        </button>

        {isProva ? (
          <p className="footnote left">
            ⚔ Prova de Domínio — sem dica nem solução. Se precisar, treine no kata do quadro primeiro.
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>

      {runError && <div className="panel error-card">{runError}</div>}

      {kataPassed && (
        <div className="panel reward-panel">
          <div className="reward-burst">◆</div>
          <h3 className="panel-title">Runa do Código concluída!</h3>
          <p className="muted">Mão treinada. Agora a Prova de Domínio pode liberar no quadro.</p>
          <button className="btn btn-primary" onClick={() => onKataDone?.()}>
            Voltar ao quadro →
          </button>
        </div>
      )}

      {reward && (
        <div className="panel reward-panel">
          <div className="reward-burst">✓</div>
          <h3 className="panel-title">Contrato entregue!</h3>
          <p>
            <b className="amber">+{money(reward.earned)}</b> no caixa e{' '}
            <b>+{reward.rep} de reputação</b>.
          </p>
          {reward.rent > 0 && (
            <p className="muted">
              Custo fixo do mês descontado: −{money(reward.rent)} (energia + aluguel).
            </p>
          )}
          <div className="assist-row">
            <button className="btn btn-primary" onClick={() => onNavigate('lab')}>
              Voltar à garagem →
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('skills')}>
              Ver árvore
            </button>
          </div>
        </div>
      )}

      {outcome && <TestResults outcome={outcome} />}

      {interrogating && (
        <Interrogatorio
          questions={contract.interrogation}
          onFinish={(score) => {
            if (interrogationPassed(score)) {
              finalize(score)
              return
            }
            // Reprovação real (Fase 1): consome a tentativa, aplica cooldown, aponta o que refazer.
            onGameChange(failBoss(game, contract.id, nowMs()))
            setInterrogating(false)
            setFailed({
              correct: Math.round(score * contract.interrogation.length),
              total: contract.interrogation.length,
            })
          }}
        />
      )}
    </section>
  )
}
