import { kvGet, kvSet } from './db'
import { skillOfContract } from '../game/content'

/** Progresso das 3 runas de uma skill (GDD §5.1): intuição, matemática, código (kata). */
export interface RuneProgress {
  intuicao: boolean
  matematica: boolean
  codigo: boolean
}

export interface GameState {
  version: 3
  updatedAt: string // ISO
  money: number
  reputation: number // 0–100 global (GDD §4.3)
  streak: { count: number; lastDayISO: string | null }
  hardwareLevel: number // índice em HARDWARE (content.ts)
  contracts: { activeId: string | null; doneIds: string[] }
  /** Código do editor por contrato (o rascunho do jogador sobrevive à navegação). */
  codeByContract: Record<string, string>
  /** Runas concluídas por skill (GDD §5.1). */
  runes: Record<string, RuneProgress>
  turn: number // nº de entregas concluídas (avança o "mês")
  rentPaidUpTo: number // último turno em que o custo fixo já foi cobrado
  onboarded: boolean // já viu a introdução (o tio, o bilhete)?
  relampagoLastDayISO: string | null // controle do contrato-relâmpago diário
  achievements: string[] // conquistas desbloqueadas (GDD §8)
  // Economia de tensão (GDD §4.4)
  debt: number // dívida com o agiota (cresce com juros por dia)
  ngPlus: number // quantas falências superadas (New Game+)
  lastBillDayISO: string | null // último dia em que a conta do lab foi cobrada
  // Ferrugem / repetição espaçada (GDD §5.3): por skill, quando foi revisada e o nível do intervalo
  skillReview: Record<string, { lastISO: string; level: number }>
  // Economia com dente (Fase 2): dia em que cada contrato do bairro foi feito (teto de 1x/dia).
  bairroLastDayISO: Record<string, string>
  // Aprendizado obrigatório (Fase 1): cooldown do boss após reprovar/abandonar — cresce por tentativa.
  bossCooldown: Record<string, { untilMs: number; attempts: number }>
  // Equipe (GDD §4.2): skillIds com estagiário contratado (automatiza o contrato do bairro daquela skill).
  interns: string[]
  // Loja da Sala Comercial: comprada uma vez, desbloqueia estagiário + PC nível 3 + cena remodelada.
  salaComercialComprada: boolean
}

const SAVE_KEY = 'save'

export function newGameState(): GameState {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    money: 200, // começa apertado na garagem (GDD §2)
    reputation: 12,
    streak: { count: 0, lastDayISO: null },
    hardwareLevel: 0,
    contracts: { activeId: null, doneIds: [] },
    codeByContract: {},
    runes: {},
    turn: 0,
    rentPaidUpTo: 0,
    onboarded: false,
    relampagoLastDayISO: null,
    achievements: [],
    debt: 0,
    ngPlus: 0,
    lastBillDayISO: null,
    skillReview: {},
    bairroLastDayISO: {},
    bossCooldown: {},
    interns: [],
    salaComercialComprada: false,
  }
}

// Adiciona tolerantemente os campos que chegaram depois do v3 (sem bump de versão).
function normalize(raw: GameState): GameState {
  const base = newGameState()
  return {
    ...raw,
    achievements: raw.achievements ?? [],
    debt: raw.debt ?? 0,
    ngPlus: raw.ngPlus ?? 0,
    lastBillDayISO: raw.lastBillDayISO ?? null,
    skillReview: raw.skillReview ?? base.skillReview,
    bairroLastDayISO: raw.bairroLastDayISO ?? {},
    bossCooldown: raw.bossCooldown ?? {},
    interns: raw.interns ?? [],
    salaComercialComprada: raw.salaComercialComprada ?? false,
  }
}

// Fronteira de confiança: o save pode vir de um arquivo importado por fora.
// Validação explícita de shape — nunca aplicar JSON arbitrário no estado.
export function isGameState(v: unknown): v is GameState {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (o.version !== 3 || typeof o.updatedAt !== 'string') return false
  if (typeof o.money !== 'number' || typeof o.reputation !== 'number') return false
  if (typeof o.hardwareLevel !== 'number' || typeof o.turn !== 'number') return false
  if (typeof o.rentPaidUpTo !== 'number' || typeof o.onboarded !== 'boolean') return false
  const s = o.streak as Record<string, unknown> | undefined
  if (typeof s !== 'object' || s === null || typeof s.count !== 'number') return false
  const c = o.contracts as Record<string, unknown> | undefined
  if (typeof c !== 'object' || c === null || !Array.isArray(c.doneIds)) return false
  if (typeof o.codeByContract !== 'object' || o.codeByContract === null) return false
  if (typeof o.runes !== 'object' || o.runes === null) return false
  return true
}

// Save v1 (fase 0): só demo.code. Save v2: economia sem runas/turno.
function migrateOld(v: unknown): GameState | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>
  const base = newGameState()

  if (o.version === 1) {
    const demo = o.demo as Record<string, unknown> | undefined
    if (demo && typeof demo.code === 'string') base.codeByContract['previsao-padaria'] = demo.code
    return base
  }

  if (o.version === 2) {
    if (typeof o.money === 'number') base.money = o.money
    if (typeof o.reputation === 'number') base.reputation = o.reputation
    if (typeof o.hardwareLevel === 'number') base.hardwareLevel = o.hardwareLevel
    const s = o.streak as { count?: number; lastDayISO?: string | null } | undefined
    if (s && typeof s.count === 'number') base.streak = { count: s.count, lastDayISO: s.lastDayISO ?? null }
    const c = o.contracts as { activeId?: string | null; doneIds?: string[] } | undefined
    if (c && Array.isArray(c.doneIds)) {
      base.contracts = { activeId: c.activeId ?? null, doneIds: c.doneIds }
      base.turn = c.doneIds.length
      base.rentPaidUpTo = c.doneIds.length // não cobra aluguel retroativo
      base.onboarded = c.doneIds.length > 0
      // contratos já entregues: dá as runas como feitas p/ não re-travar, chaveado pela SKILL
      // (não pelo contrato — bug anterior deixava `runes` órfão pra qualquer save migrado)
      for (const id of c.doneIds) {
        const skillId = skillOfContract(id)?.id
        if (skillId) base.runes[skillId] = { intuicao: true, matematica: true, codigo: true }
      }
    }
    if (o.codeByContract && typeof o.codeByContract === 'object') {
      base.codeByContract = o.codeByContract as Record<string, string>
    }
    return base
  }

  return null
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await kvGet<unknown>(SAVE_KEY)
    if (isGameState(raw)) return normalize(raw)
    return migrateOld(raw)
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
  const state = isGameState(data) ? normalize(data) : migrateOld(data)
  if (!state) throw new Error('Este arquivo não é um save do Neural Empire.')
  await saveGame(state)
  return state
}
