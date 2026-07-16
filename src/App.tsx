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
import { completeRune, contractById, skillById, skillOfKata } from './game/content'
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
  const [wbKata, setWbKata] = useState(false) // workbench aberto como kata (runa do código)?
  const [cameFromDesk, setCameFromDesk] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
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

  const active = game.contracts.activeId ? contractById(game.contracts.activeId) : undefined
  const goLab = () => {
    setCameFromDesk(view === 'workbench')
    setView('lab')
  }
  const back = view === 'runa' ? () => setView('skills') : goLab

  return (
    <>
      {notice && (
        <div className="toast" onClick={() => setNotice(null)}>
          {notice} <span className="toast-x">✕</span>
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
          <TopBar game={game} onBack={back} />
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
                  setWbKata(true)
                  setGame({ ...game, contracts: { ...game.contracts, activeId: kataId } })
                  setView('workbench')
                }}
                onOpenBoss={(contractId) => {
                  setWbKata(false)
                  setGame({ ...game, contracts: { ...game.contracts, activeId: contractId } })
                  setView('workbench')
                }}
              />
            )}
            {view === 'runa' && runa && (
              <RunaScreen
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
                mode={wbKata ? 'kata' : 'boss'}
                client={clientRef.current}
                pyState={pyState}
                game={game}
                onGameChange={setGame}
                onNavigate={setView}
                onKataDone={() => {
                  const s = skillOfKata(active.id)
                  if (s) setGame(completeRune(game, s.id, 'codigo'))
                  setWbKata(false)
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
