import { kvGet, kvSet } from './db'

export interface GameState {
  version: 2
  updatedAt: string // ISO
  money: number
  reputation: number // 0–100 global (GDD §4.3)
  streak: { count: number; lastDayISO: string | null }
  hardwareLevel: number // índice em HARDWARE (content.ts)
  contracts: { activeId: string | null; doneIds: string[] }
  /** Código do editor por contrato (o rascunho do jogador sobrevive à navegação). */
  codeByContract: Record<string, string>
}

const SAVE_KEY = 'save'

export function newGameState(): GameState {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    money: 200, // começa apertado na garagem (GDD §2)
    reputation: 12,
    streak: { count: 0, lastDayISO: null },
    hardwareLevel: 0,
    contracts: { activeId: null, doneIds: [] },
    codeByContract: {},
  }
}

// Fronteira de confiança: o save pode vir de um arquivo importado por fora.
// Validação explícita de shape — nunca aplicar JSON arbitrário no estado.
export function isGameState(v: unknown): v is GameState {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (o.version !== 2 || typeof o.updatedAt !== 'string') return false
  if (typeof o.money !== 'number' || typeof o.reputation !== 'number') return false
  if (typeof o.hardwareLevel !== 'number') return false
  const s = o.streak as Record<string, unknown> | undefined
  if (typeof s !== 'object' || s === null || typeof s.count !== 'number') return false
  const c = o.contracts as Record<string, unknown> | undefined
  if (typeof c !== 'object' || c === null || !Array.isArray(c.doneIds)) return false
  if (typeof o.codeByContract !== 'object' || o.codeByContract === null) return false
  return true
}

// Save v1 (fase 0): só tinha demo.code. Recupera o rascunho e reinicia o resto.
function migrateV1(v: unknown): GameState | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  if (o.version !== 1) return null
  const demo = o.demo as Record<string, unknown> | undefined
  const base = newGameState()
  if (demo && typeof demo.code === 'string') {
    base.codeByContract['previsao-padaria'] = demo.code
  }
  return base
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await kvGet<unknown>(SAVE_KEY)
    if (isGameState(raw)) return raw
    return migrateV1(raw)
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
  const state = isGameState(data) ? data : migrateV1(data)
  if (!state) throw new Error('Este arquivo não é um save do Neural Empire.')
  await saveGame(state)
  return state
}
