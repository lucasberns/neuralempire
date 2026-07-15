import { kvGet, kvSet } from './db'

export interface LastResult {
  passed: number
  total: number
  at: string // ISO
}

export interface GameState {
  version: 1
  updatedAt: string // ISO
  demo: {
    code: string
    lastResult?: LastResult
  }
  // Fases seguintes penduram aqui: contratos ativos, skills/runas, carteira (GDD §12).
}

const SAVE_KEY = 'save'

export function newGameState(starterCode: string): GameState {
  return { version: 1, updatedAt: new Date().toISOString(), demo: { code: starterCode } }
}

// Fronteira de confiança: o save pode vir de um arquivo importado por fora.
// Validação explícita de shape — nunca aplicar JSON arbitrário no estado.
export function isGameState(v: unknown): v is GameState {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (o.version !== 1 || typeof o.updatedAt !== 'string') return false
  const demo = o.demo as Record<string, unknown> | undefined
  if (typeof demo !== 'object' || demo === null) return false
  if (typeof demo.code !== 'string' || demo.code.length > 100_000) return false
  if (demo.lastResult !== undefined) {
    const r = demo.lastResult as Record<string, unknown>
    if (typeof r !== 'object' || r === null) return false
    if (typeof r.passed !== 'number' || typeof r.total !== 'number' || typeof r.at !== 'string')
      return false
  }
  return true
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await kvGet<unknown>(SAVE_KEY)
    return isGameState(raw) ? raw : null
  } catch {
    return null // IndexedDB indisponível (ex.: navegação privada) → começa do zero
  }
}

export async function saveGame(state: GameState): Promise<void> {
  await kvSet(SAVE_KEY, { ...state, updatedAt: new Date().toISOString() })
}

export function exportSave(state: GameState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `neural-empire-save-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importSave(file: File): Promise<GameState> {
  if (file.size > 1_000_000) throw new Error('Arquivo grande demais para ser um save.')
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!isGameState(data)) throw new Error('Este arquivo não é um save do Neural Empire.')
  await saveGame(data)
  return data
}
