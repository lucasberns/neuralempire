import { useEffect, useRef, useState } from 'react'
import { PyodideClient, type ClientState } from './pyodide/client'
import { StatHud } from './components/StatHud'
import { BottomNav, type View } from './components/BottomNav'
import { LabScreen } from './screens/LabScreen'
import { ContractsScreen } from './screens/ContractsScreen'
import { SkillTreeScreen } from './screens/SkillTreeScreen'
import { WorkbenchScreen } from './screens/WorkbenchScreen'
import { contractById } from './game/content'
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
  const [notice, setNotice] = useState<string | null>(null)
  const clientRef = useRef<PyodideClient | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    clientRef.current = new PyodideClient(setPyState)
    void loadGame().then((s) => setGame(s ?? newGameState()))
  }, [])

  // Autosave com debounce a cada mudança de estado.
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

  const active = game.contracts.activeId ? contractById(game.contracts.activeId) : undefined
  const onWorkbench = view === 'workbench' && active && clientRef.current

  return (
    <div className="app">
      <StatHud game={game} />

      {notice && (
        <div className="toast" onClick={() => setNotice(null)}>
          {notice} <span className="toast-x">✕</span>
        </div>
      )}

      <main className="app-main">
        {view === 'lab' && (
          <LabScreen
            game={game}
            onGameChange={setGame}
            onNavigate={setView}
            onExport={() => exportSave(game)}
            onImport={() => fileRef.current?.click()}
          />
        )}
        {view === 'contratos' && (
          <ContractsScreen game={game} onGameChange={setGame} onNavigate={setView} />
        )}
        {view === 'skills' && (
          <SkillTreeScreen game={game} onGameChange={setGame} onNavigate={setView} />
        )}
        {onWorkbench && (
          <WorkbenchScreen
            contract={active}
            client={clientRef.current!}
            pyState={pyState}
            game={game}
            onGameChange={setGame}
            onNavigate={setView}
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

      <BottomNav view={view} onNavigate={setView} hasActive={!!active} />

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
    </div>
  )
}
