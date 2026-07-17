import { useEffect, useRef, useState } from 'react'
import { PyodideClient, type ClientState } from './pyodide/client'
import { TopBar } from './components/TopBar'
import type { View, RuneKind } from './nav'
import { LabScreen } from './screens/LabScreen'
import { ContractsScreen } from './screens/ContractsScreen'
import { SkillTreeScreen } from './screens/SkillTreeScreen'
import { WorkbenchScreen } from './screens/WorkbenchScreen'
import { RunaScreen } from './screens/RunaScreen'
import { Onboarding } from './screens/Onboarding'
import {
  LOAN,
  RELAMPAGO,
  agiotaAvailable,
  applyDailyBill,
  bossOnCooldown,
  completeRune,
  contractById,
  declararFalencia,
  failBoss,
  falenciaAvailable,
  isDone,
  isKata,
  nowMs,
  pendingAchievements,
  reviewSkill,
  skillById,
  skillOfKata,
  takeLoan,
  todayISO,
} from './game/content'
import {
  exportSave,
  importSave,
  loadGame,
  newGameState,
  saveGame,
  type GameState,
} from './persistence/saveGame'

export default function App() {
  const [pyState, setPyState] = useState<ClientState>({
    phase: 'loading',
    progress: { message: 'Iniciando…', loaded: 0, total: 1 },
  })
  const [game, setGame] = useState<GameState | null>(null)
  const [view, setView] = useState<View>('lab')
  const [runa, setRuna] = useState<{ skillId: string; kind: RuneKind } | null>(null)
  const [cameFromDesk, setCameFromDesk] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [askLeave, setAskLeave] = useState(false)
  const clientRef = useRef<PyodideClient | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    clientRef.current = new PyodideClient(setPyState)
    void loadGame().then((s) => setGame(s ?? newGameState()))
  }, [])

  useEffect(() => {
    if (!game) return
    const t = setTimeout(() => void saveGame(game).catch(() => undefined), 800)
    return () => clearTimeout(t)
  }, [game])

  // Conquistas: destrava as satisfeitas pelo estado atual e avisa (GDD §8).
  useEffect(() => {
    if (!game) return
    const novas = pendingAchievements(game)
    if (novas.length === 0) return
    setGame({ ...game, achievements: [...game.achievements, ...novas.map((a) => a.id)] })
    setNotice(`🏆 Conquista: ${novas.map((a) => a.nome).join(' · ')}`)
  }, [game])

  // Conta diária do lab (GDD §4.1): cobra uma vez por dia. Idempotente → não faz loop.
  useEffect(() => {
    if (!game) return
    const { next, charged } = applyDailyBill(game, todayISO())
    if (charged <= 0) return
    setGame(next)
    setNotice(`🧾 Conta do laboratório: −R$ ${charged} (energia + aluguel)`)
  }, [game])

  // Fase 1: avisa antes de fechar/recarregar no meio de uma Prova (a tentativa se perde).
  useEffect(() => {
    if (!game) return
    const c = game.contracts.activeId ? contractById(game.contracts.activeId) : undefined
    const inProgress =
      view === 'workbench' &&
      !!c &&
      !c.repeatable &&
      c.id !== RELAMPAGO.id &&
      !isKata(c.id) &&
      !isDone(game, c.id) &&
      !bossOnCooldown(game, c.id, nowMs())
    if (!inProgress) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [game, view])

  async function onImportFile(file: File) {
    try {
      setGame(await importSave(file))
      setNotice('Save importado com sucesso. ✅')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Falha ao importar o save.')
    }
  }

  if (!game) {
    return (
      <div className="boot">
        <span className="hud-logo big">◢◤</span>
        <p className="muted">Abrindo o laboratório…</p>
      </div>
    )
  }

  if (!game.onboarded) {
    return <Onboarding onDone={() => setGame({ ...game, onboarded: true })} />
  }

  // Agiota (GDD §4.4): aparece quando o caixa fica negativo. Empréstimo ou falência.
  if (agiotaAvailable(game)) {
    const money = `R$ ${game.money.toLocaleString('pt-BR')}`
    return (
      <div className="agiota-back">
        <div className="agiota" role="dialog" aria-label="O agiota tech">
          <span className="agiota-face">🦈</span>
          <h2 className="agiota-title">O agiota tech</h2>
          <p>
            Seu caixa está em <b className="red">{money}</b>. Sem dinheiro, o laboratório para.
            {game.debt > 0 && (
              <>
                {' '}
                Você já deve <b className="amber">R$ {game.debt.toLocaleString('pt-BR')}</b> (juros
                todo dia).
              </>
            )}
          </p>
          <button className="btn btn-primary" onClick={() => setGame(takeLoan(game))}>
            Pegar R$ {LOAN} emprestado (com juros)
          </button>
          {falenciaAvailable(game) && (
            <button
              className="btn btn-ghost danger"
              onClick={() => {
                setGame(declararFalencia(game))
                setNotice('💥 Falência. Perdeu o lab — mas o conhecimento é seu. New Game+.')
              }}
            >
              Declarar falência (recomeça a garagem, skills mantidas)
            </button>
          )}
          <p className="footnote left">
            Conhecimento é o único ativo à prova de falência. Suas skills nunca somem.
          </p>
        </div>
      </div>
    )
  }

  const active = game.contracts.activeId ? contractById(game.contracts.activeId) : undefined
  const goLab = () => {
    setCameFromDesk(view === 'workbench')
    setView('lab')
  }
  const bossInProgress =
    view === 'workbench' &&
    !!active &&
    !active.repeatable &&
    active.id !== RELAMPAGO.id &&
    !isKata(active.id) &&
    !isDone(game, active.id) &&
    !bossOnCooldown(game, active.id, nowMs())
  const back = view === 'runa' ? () => setView('skills') : goLab
  // Fase 1: sair do boss no meio consome a tentativa — pede confirmação antes.
  const requestBack = () => (bossInProgress ? setAskLeave(true) : back())
  const abandonBoss = () => {
    if (active) setGame(failBoss(game, active.id, nowMs()))
    setAskLeave(false)
    goLab()
  }

  return (
    <>
      {notice && (
        <div className="toast" onClick={() => setNotice(null)}>
          {notice} <span className="toast-x">✕</span>
        </div>
      )}

      {askLeave && (
        <div className="modal-back" role="dialog" aria-label="Sair da Prova">
          <div className="modal">
            <h2 className="modal-title">Sair da Prova de Domínio?</h2>
            <p>
              Se sair agora, você <b>perde a tentativa</b> e a Prova entra em cooldown antes de poder
              repetir. Sair mesmo?
            </p>
            <button className="btn btn-ghost danger" onClick={abandonBoss}>
              Sair e perder a tentativa
            </button>
            <button className="btn btn-primary" onClick={() => setAskLeave(false)}>
              Continuar a Prova
            </button>
          </div>
        </div>
      )}

      {view === 'lab' ? (
        <LabScreen
          game={game}
          onGameChange={setGame}
          onNavigate={(v) => {
            setCameFromDesk(false)
            setView(v)
          }}
          onExport={() => exportSave(game)}
          onImport={() => fileRef.current?.click()}
          arriveFromDesk={cameFromDesk}
        />
      ) : (
        <div className="app">
          <TopBar game={game} onBack={requestBack} />
          <main className="app-main">
            {view === 'contratos' && (
              <ContractsScreen game={game} onGameChange={setGame} onNavigate={setView} />
            )}
            {view === 'skills' && (
              <SkillTreeScreen
                game={game}
                onOpenRune={(skillId, kind) => {
                  setRuna({ skillId, kind })
                  setView('runa')
                }}
                onOpenKata={(skillId) => {
                  const kataId = skillById(skillId)?.kataId
                  if (!kataId) return
                  setGame({ ...game, contracts: { ...game.contracts, activeId: kataId } })
                  setView('workbench')
                }}
                onOpenBoss={(contractId) => {
                  setGame({ ...game, contracts: { ...game.contracts, activeId: contractId } })
                  setView('workbench')
                }}
                onReview={(skillId) => {
                  setGame(reviewSkill(game, skillId))
                  setNotice('✨ Ferrugem removida. A skill voltou a brilhar.')
                }}
              />
            )}
            {view === 'runa' && runa && (
              <RunaScreen
                skillId={runa.skillId}
                kind={runa.kind}
                skillNome={skillById(runa.skillId)?.nome ?? ''}
                onComplete={() => {
                  setGame(completeRune(game, runa.skillId, runa.kind))
                  setRuna(null)
                  setView('skills')
                }}
              />
            )}
            {view === 'workbench' && active && clientRef.current && (
              <WorkbenchScreen
                contract={active}
                mode={isKata(active.id) ? 'kata' : 'boss'}
                client={clientRef.current}
                pyState={pyState}
                game={game}
                onGameChange={setGame}
                onNavigate={setView}
                onKataDone={() => {
                  const s = skillOfKata(active.id)
                  if (s) setGame(completeRune(game, s.id, 'codigo'))
                  setView('skills')
                }}
              />
            )}
            {view === 'workbench' && !active && (
              <section className="screen">
                <div className="panel">
                  <h3 className="panel-title">Nenhum contrato aberto</h3>
                  <p className="muted">Escolha um contrato na mesa para abrir a bancada.</p>
                  <button className="btn btn-primary" onClick={() => setView('contratos')}>
                    Ir para os contratos →
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onImportFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}
