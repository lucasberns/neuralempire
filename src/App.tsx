import { useEffect, useRef, useState } from 'react'
import { PyodideClient, type ClientState } from './pyodide/client'
import { LoadingScreen } from './components/LoadingScreen'
import { DemoScreen } from './demo/DemoScreen'
import { DEMO_CONTRACT } from './demo/contract'
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
  const [saveKey, setSaveKey] = useState(0) // muda ao importar → remonta o editor
  const [notice, setNotice] = useState<string | null>(null)
  const clientRef = useRef<PyodideClient | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    clientRef.current = new PyodideClient(setPyState)
    void loadGame().then((s) => setGame(s ?? newGameState(DEMO_CONTRACT.starterCode)))
  }, [])

  // Autosave com debounce a cada mudança de estado (código do editor incluso).
  useEffect(() => {
    if (!game) return
    const t = setTimeout(() => void saveGame(game).catch(() => undefined), 800)
    return () => clearTimeout(t)
  }, [game])

  async function onImportFile(file: File) {
    try {
      const imported = await importSave(file)
      setGame(imported)
      setSaveKey((k) => k + 1)
      setNotice('Save importado com sucesso. ✅')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Falha ao importar o save.')
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>⚡ Neural Empire</h1>
        <div className="header-actions">
          <button onClick={() => game && exportSave(game)} disabled={!game}>
            Exportar save
          </button>
          <button onClick={() => fileRef.current?.click()}>Importar</button>
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
      </header>

      {notice && (
        <div className="card notice" onClick={() => setNotice(null)}>
          {notice}
        </div>
      )}

      <main>
        {pyState.phase === 'loading' && <LoadingScreen progress={pyState.progress} />}
        {pyState.phase === 'error' && (
          <div className="card error-card">
            <h3>Não consegui carregar o Python 😞</h3>
            <p>
              No primeiro uso é preciso estar online para baixar o motor de ML. Verifique a
              conexão e recarregue a página.
            </p>
            <details>
              <summary>Detalhe técnico</summary>
              <pre>{pyState.message}</pre>
            </details>
          </div>
        )}
        {pyState.phase === 'ready' && game && clientRef.current && (
          <DemoScreen key={saveKey} client={clientRef.current} game={game} onGameChange={setGame} />
        )}
      </main>
    </>
  )
}
