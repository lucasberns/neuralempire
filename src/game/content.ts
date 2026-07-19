// Índice de conteúdo por capítulo (GDD §2, §6, §12) + regras puras da economia.
// ponytail: regras num arquivo só — a fatia hoje não justifica engine separada ainda;
// os módulos de engine/ guardam só os tipos p/ fases futuras.
import type { Contract } from '../engine/contracts'
import type { GameState } from '../persistence/saveGame'
import { SKILLS_CH1, CONTRACTS_CH1, RELAMPAGO, KATAS_CH1, REPEATABLE, LESSONS_CH1 } from './content/chapter1'
import { SKILLS_CH2, CONTRACTS_CH2, KATAS_CH2, LESSONS_CH2 } from './content/chapter2'
import { SKILLS_CH3, CONTRACTS_CH3, KATAS_CH3, LESSONS_CH3 } from './content/chapter3'
import { SKILLS_CH4, CONTRACTS_CH4, KATAS_CH4, LESSONS_CH4 } from './content/chapter4'
import { SPECIAL } from './content/special'

// ---------------------------------------------------------------- Economia
export const RENT_PER_TURN = 60 // energia + aluguel da garagem, cobrado a cada entrega (GDD §4.1)

// ---------------------------------------------------------------- Hardware
export interface Hardware {
  nome: string
  desc: string
  custo: number // custo para CHEGAR neste nível (0 = inicial)
}

// GDD §4.2: hardware limita modelos e cria desejo de progressão. Cap 1 = 3 níveis.
export const HARDWARE: Hardware[] = [
  { nome: 'PC de 2012', desc: 'Herança do tio. Roda o básico, reclama do resto.', custo: 0 },
  { nome: 'PC Gamer usado', desc: 'Comprado no desapego. Treinos mais rápidos, menos travadas.', custo: 350 },
  { nome: 'Rack de GPUs', desc: 'A garagem virou sala-cofre. Modelos maiores já cabem.', custo: 1200 },
]

// ---------------------------------------------------------------- Skills (Tier 1, GDD §6)
export interface SkillDef {
  id: string
  nome: string
  desc: string
  /** Boss da skill: contrato + interrogatório (GDD §5.2). */
  contractId: string
  /** Runa do Código: kata de prática (GDD §5.1), destravado antes do boss. */
  kataId: string
  /** Skills que precisam estar dominadas antes desta (grafo do GDD §6). */
  prereqSkillIds: string[]
}

export const SKILLS: SkillDef[] = [...SKILLS_CH1, ...SKILLS_CH2, ...SKILLS_CH3, ...SKILLS_CH4]

export const skillById = (id: string) => SKILLS.find((s) => s.id === id)
export const skillOfContract = (contractId: string) => SKILLS.find((s) => s.contractId === contractId)
export const skillOfKata = (kataId: string) => SKILLS.find((s) => s.kataId === kataId)
export const isKata = (id: string) => id.startsWith('kata-')

// ---------------------------------------------------------------- Contratos (bosses + katas)
export const CONTRACTS: Contract[] = [...CONTRACTS_CH1, ...CONTRACTS_CH2, ...CONTRACTS_CH3, ...CONTRACTS_CH4]
export const KATAS: Contract[] = [...KATAS_CH1, ...KATAS_CH2, ...KATAS_CH3, ...KATAS_CH4]
export { RELAMPAGO, REPEATABLE, SPECIAL }

// ---------------------------------------------------------------- Conquistas (GDD §8)
export interface Achievement {
  id: string
  nome: string
  desc: string
  test: (g: GameState) => boolean
}

const skillBossDone = (g: GameState) =>
  SKILLS.filter((s) => g.contracts.doneIds.includes(s.contractId)).length

/** Cap. 2 ("Sala Comercial") começa quando o jogador domina as 4 skills do Tier 1 — mesma
 *  condição da conquista `tier1-completo`. Fonte única pro custo fixo novo e pro rótulo do HUD. */
export const chapterOf = (g: GameState): 1 | 2 => (skillBossDone(g) >= SKILLS_CH1.length ? 2 : 1)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primeira-entrega', nome: 'Primeiro cliente', desc: 'Entregue seu primeiro contrato.', test: (g) => g.contracts.doneIds.length >= 1 },
  { id: 'primeira-skill', nome: 'Aprendiz', desc: 'Domine sua primeira skill.', test: (g) => skillBossDone(g) >= 1 },
  { id: 'meia-arvore', nome: 'Pegando o jeito', desc: 'Domine metade do Tier 1.', test: (g) => skillBossDone(g) >= 2 },
  { id: 'tier1-completo', nome: 'Fundamentos sólidos', desc: 'Domine as 4 skills do Tier 1.', test: (g) => skillBossDone(g) >= SKILLS_CH1.length },
  { id: 'turbinou', nome: 'Upgrade!', desc: 'Compre seu primeiro hardware melhor.', test: (g) => g.hardwareLevel >= 1 },
  { id: 'rack', nome: 'Sala-cofre', desc: 'Monte o rack de GPUs.', test: (g) => g.hardwareLevel >= 2 },
  { id: 'ritmo', nome: 'No embalo', desc: 'Chegue a um streak de 3.', test: (g) => g.streak.count >= 3 },
  { id: 'faxineiro', nome: 'Dados limpos', desc: 'Domine Limpar Dados.', test: (g) => g.contracts.doneIds.includes('faxina-cadastro') },
  { id: 'tier2-completo', nome: 'Classificação dominada', desc: 'Domine as 4 skills do Tier 2.', test: (g) => SKILLS_CH2.every((s) => isDone(g, s.contractId)) },
  { id: 'tier3-completo', nome: 'Andar de cima', desc: 'Domine as 4 skills do Tier 3.', test: (g) => SKILLS_CH3.every((s) => isDone(g, s.contractId)) },
  { id: 'primeiro-overfitting', nome: 'Primeiro overfitting', desc: 'Domine Validação e nomeie o que você já sentiu.', test: (g) => isDone(g, 'diagnostico-inadimplencia') },
  { id: 'estagiario-contratado', nome: 'Chefe', desc: 'Contrate seu primeiro estagiário.', test: (g) => g.interns.length >= 1 },
  { id: 'sobreviveu-agiota', nome: 'Sobreviveu ao agiota', desc: 'Supere uma falência (New Game+).', test: (g) => g.ngPlus >= 1 },
  { id: 'streak-7', nome: 'Uma semana de estudo', desc: 'Chegue a um streak de 7 dias.', test: (g) => g.streak.count >= 7 },
  { id: 'streak-30', nome: 'Um mês de estudo', desc: 'Chegue a um streak de 30 dias.', test: (g) => g.streak.count >= 30 },
  { id: 'streak-100', nome: 'Cem dias', desc: 'Chegue a um streak de 100 dias.', test: (g) => g.streak.count >= 100 },
]

/** Conquistas satisfeitas pelo estado mas ainda não registradas. */
export function pendingAchievements(g: GameState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.test(g) && !g.achievements.includes(a.id))
}

/** Currículo em texto puro (Configurações): skills dominadas + conquistas, pra exportar. */
export function curriculoText(g: GameState): string {
  const hw = currentHardware(g)
  const dominadas = SKILLS.filter((s) => skillStatus(g, s) === 'dominada')
  const linhas = [
    'NEURAL EMPIRE — CURRÍCULO',
    `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    `Reputação: ${g.reputation}/100`,
    `Streak atual: ${g.streak.count} dia(s)`,
    `Hardware: ${hw.nome}`,
  ]
  if (g.ngPlus > 0) linhas.push(`Falências superadas (New Game+): ${g.ngPlus}`)
  linhas.push('', `SKILLS DOMINADAS (${dominadas.length}/${SKILLS.length})`)
  linhas.push(...dominadas.map((s) => `  · ${s.nome} — ${s.desc}`))
  linhas.push('', `CONQUISTAS (${g.achievements.length}/${ACHIEVEMENTS.length})`)
  linhas.push(
    ...ACHIEVEMENTS.filter((a) => g.achievements.includes(a.id)).map((a) => `  🏆 ${a.nome} — ${a.desc}`),
  )
  return linhas.join('\n')
}

// ---------------------------------------------------------------- Aulas de código (ensino)
// GDD §3/§12: ensina o Python de verdade — "qual código colocar", linha a linha.
// Mapa por id do contrato (evita editar cada objeto). Aberta por padrão na Runa do Código.
export interface LessonStep {
  code: string
  explica: string
}
export interface Lesson {
  intro: string
  passos: LessonStep[]
}

export const LESSONS: Record<string, Lesson> = { ...LESSONS_CH1, ...LESSONS_CH2, ...LESSONS_CH3, ...LESSONS_CH4 }

export const lessonFor = (id: string): Lesson | undefined => LESSONS[id]

// ---------------------------------------------------------------- Regras puras
export const contractById = (id: string): Contract | undefined =>
  id === RELAMPAGO.id
    ? RELAMPAGO
    : (CONTRACTS.find((c) => c.id === id) ??
      KATAS.find((c) => c.id === id) ??
      REPEATABLE.find((c) => c.id === id) ??
      SPECIAL.find((c) => c.id === id))

export const isDone = (g: GameState, id: string) => g.contracts.doneIds.includes(id)

export const isAvailable = (g: GameState, c: Contract) =>
  !isDone(g, c.id) && c.prereqContractIds.every((id) => isDone(g, id))

// -------- Runas + boss (GDD §5): 3 runas (intuição, matemática, código) liberam o boss.
export const emptyRunes = { intuicao: false, matematica: false, codigo: false }
// Normaliza (saves antigos podem não ter 'codigo').
export const runesOf = (g: GameState, skillId: string) => ({ ...emptyRunes, ...(g.runes[skillId] ?? {}) })
export const runesComplete = (g: GameState, skillId: string) => {
  const r = runesOf(g, skillId)
  return r.intuicao && r.matematica && r.codigo
}

export type SkillStatus = 'bloqueada' | 'runas' | 'boss' | 'dominada'

export function skillStatus(g: GameState, s: SkillDef): SkillStatus {
  if (isDone(g, s.contractId)) return 'dominada'
  const prereqsOk = s.prereqSkillIds.every((id) => {
    const p = skillById(id)
    return p && isDone(g, p.contractId)
  })
  if (!prereqsOk) return 'bloqueada'
  return runesComplete(g, s.id) ? 'boss' : 'runas'
}

export function completeRune(
  g: GameState,
  skillId: string,
  rune: 'intuicao' | 'matematica' | 'codigo',
): GameState {
  const cur = runesOf(g, skillId)
  return { ...g, runes: { ...g.runes, [skillId]: { ...cur, [rune]: true } } }
}

export const currentHardware = (g: GameState) => HARDWARE[g.hardwareLevel] ?? HARDWARE[0]
export const nextHardware = (g: GameState): Hardware | undefined => HARDWARE[g.hardwareLevel + 1]

// Data em horário LOCAL (Fase 3): toISOString() é UTC → o dia virava às 21h no Brasil.
const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const nowMs = () => Date.now()

/**
 * Aplica a entrega de um contrato: paga (proporcional ao acerto do interrogatório),
 * cobra o custo fixo do turno, sobe reputação e streak. Idempotente p/ bosses.
 * `interrogationScore` ∈ [0,1] (1 = acertou tudo). Relâmpago não conta como boss.
 */
export function completeContract(
  g: GameState,
  c: Contract,
  interrogationScore = 1,
  payoutMultiplier = 1,
): { next: GameState; earned: number; rent: number } {
  const isRelampago = c.id === RELAMPAGO.id
  const isBoss = !c.repeatable && !isRelampago // boss = prova única (avança o "mês" e cobra aluguel)
  if (isBoss && isDone(g, c.id)) return { next: g, earned: 0, rent: 0 }

  const streakDay = today()
  // Fase 3: streak quebra em dia perdido. gap 0 = mesmo dia; 1 = consecutivo; >1 (ou nunca) = reset.
  const gap = g.streak.lastDayISO ? daysBetween(g.streak.lastDayISO, streakDay) : Infinity
  const streak =
    gap === 0
      ? g.streak
      : gap === 1
        ? { count: g.streak.count + 1, lastDayISO: streakDay }
        : { count: 1, lastDayISO: streakDay }

  // pagamento penaliza erros no interrogatório (mín. 50%), arredondado; contratos disputados
  // (GDD §7.2) multiplicam por cima (vitória ×1.2, derrota ×0.6 — nunca some, o trabalho foi
  // entregue e aprovado, só perdeu o cliente pro concorrente).
  let earned = Math.round(c.payout * (0.5 + 0.5 * interrogationScore) * payoutMultiplier)
  // Ferrugem (GDD §5.3): contrato do bairro de uma skill enferrujada paga menos.
  const rusty = c.repeatable && isRusted(g, c.skillId, streakDay)
  if (rusty) earned = Math.round(earned * 0.6)
  // Só o boss é um "mês" com custo fixo; bairro/relâmpago são gigas avulsas.
  const rent = isBoss ? RENT_PER_TURN : 0
  const turn = isBoss ? g.turn + 1 : g.turn
  const doneIds = isBoss ? [...g.contracts.doneIds, c.id] : g.contracts.doneIds
  // Entregar/refazer o trabalho de uma skill conta como revisão (tira ferrugem).
  const reviewSkillId = isBoss ? skillOfContract(c.id)?.id : c.repeatable ? c.skillId : undefined

  const next: GameState = {
    ...g,
    money: g.money + earned - rent,
    reputation: Math.min(100, g.reputation + c.reputacao),
    streak,
    turn,
    rentPaidUpTo: turn,
    contracts: { ...g.contracts, doneIds },
    relampagoLastDayISO: isRelampago ? streakDay : g.relampagoLastDayISO,
    skillReview: reviewSkillId ? bumpReview(g.skillReview, reviewSkillId, streakDay) : g.skillReview,
    // Teto diário do bairro (Fase 2): marca este contrato como feito hoje.
    bairroLastDayISO: c.repeatable
      ? { ...g.bairroLastDayISO, [c.id]: streakDay }
      : g.bairroLastDayISO,
  }
  return { next, earned, rent }
}

export function buyHardware(g: GameState): GameState | null {
  const nxt = nextHardware(g)
  if (!nxt || g.money < nxt.custo) return null
  return { ...g, money: g.money - nxt.custo, hardwareLevel: g.hardwareLevel + 1 }
}

/** Relâmpago liberado uma vez por dia (GDD §8). */
export const relampagoAvailable = (g: GameState) => g.relampagoLastDayISO !== today()

// ---------------------------------------------------------------- Fase 2: economia com dente
/** Contrato do bairro: 1x por dia (mata a renda infinita). Não-repetíveis sempre "disponíveis". */
export const bairroAvailable = (g: GameState, c: Contract, todayISO: string) =>
  !c.repeatable || (g.bairroLastDayISO[c.id] ?? null) !== todayISO

/** Hardware dá função (Fase 2): alguns contratos exigem um PC melhor. */
export const hardwareOk = (g: GameState, c: Contract) => (c.minHardware ?? 0) <= g.hardwareLevel

// ---------------------------------------------------------------- Fase 1: aprendizado obrigatório
/** Acerto mínimo no interrogatório pra entregar; abaixo disso, reprova (GDD §5.2). */
export const INTERROGATION_PASS = 2 / 3
export const interrogationPassed = (score: number) => score >= INTERROGATION_PASS - 1e-9

// Cooldown crescente por tentativa perdida (reprovar OU abandonar o boss).
const COOLDOWNS_MS = [30, 120, 720].map((min) => min * 60_000) // 30 min → 2 h → 12 h

export const bossCooldownMsLeft = (g: GameState, contractId: string, now: number) =>
  Math.max(0, (g.bossCooldown[contractId]?.untilMs ?? 0) - now)

export const bossOnCooldown = (g: GameState, contractId: string, now: number) =>
  bossCooldownMsLeft(g, contractId, now) > 0

/** Consome uma tentativa: aplica cooldown (que cresce a cada falha) e incrementa o contador. */
export function failBoss(g: GameState, contractId: string, now: number): GameState {
  const attempts = (g.bossCooldown[contractId]?.attempts ?? 0) + 1
  const dur = COOLDOWNS_MS[Math.min(attempts - 1, COOLDOWNS_MS.length - 1)]
  return {
    ...g,
    bossCooldown: { ...g.bossCooldown, [contractId]: { untilMs: now + dur, attempts } },
  }
}

/** "~2 h", "~28 min" — aproximação p/ o cartão do boss (sem countdown ao vivo). */
export function fmtCooldown(ms: number): string {
  const min = Math.ceil(ms / 60_000)
  return min >= 60 ? `~${Math.ceil(min / 60)} h` : `~${min} min`
}

// ---------------------------------------------------------------- Economia de tensão (GDD §4.4)
// Conta diária do laboratório (energia + aluguel) — cresce com o hardware.
// +50/dia (escritório) a partir do Cap. 2 — dobra a conta em torno da metade do jogo (GDD §4.1).
export const dailyBill = (hardwareLevel: number, chapter: 1 | 2 = 1) =>
  30 + hardwareLevel * 30 + (chapter === 2 ? 50 : 0)
export const LOAN = 400 // valor do empréstimo do agiota
const DEBT_INTEREST = 1.1 // juros por dia sobre a dívida

const daysBetween = (aISO: string, bISO: string) =>
  Math.floor((Date.parse(bISO) - Date.parse(aISO)) / 86_400_000)

/** Cobra a conta do lab uma vez por dia + aplica juros da dívida. Idempotente no mesmo dia. */
export function applyDailyBill(g: GameState, todayISO: string): { next: GameState; charged: number } {
  if (g.lastBillDayISO === todayISO) return { next: g, charged: 0 }
  const charged = dailyBill(g.hardwareLevel, chapterOf(g))
  const debt = g.debt > 0 ? Math.round(g.debt * DEBT_INTEREST) : 0
  return { next: { ...g, money: g.money - charged, debt, lastBillDayISO: todayISO }, charged }
}

export const agiotaAvailable = (g: GameState) => g.money < 0
export const takeLoan = (g: GameState): GameState => ({ ...g, money: g.money + LOAN, debt: g.debt + LOAN })
export function payAgiota(g: GameState): GameState {
  const pay = Math.min(Math.max(g.money, 0), g.debt)
  return { ...g, money: g.money - pay, debt: g.debt - pay }
}

/** Fundo do poço: sem saída plausível → pode declarar falência. */
export const falenciaAvailable = (g: GameState) => g.money <= -200 || g.debt >= 1500

/** Falência (GDD §4.4): perde lab, upgrades e dinheiro. NUNCA perde skills. New Game+. */
export function declararFalencia(g: GameState): GameState {
  return {
    ...g,
    money: 200,
    hardwareLevel: 0,
    debt: 0,
    ngPlus: g.ngPlus + 1,
    lastBillDayISO: today(),
    // mantém: contracts.doneIds (skills), runes, skillReview, achievements, streak, onboarded
  }
}

// ---------------------------------------------------------------- Ferrugem (GDD §5.3)
// Intervalos crescentes tipo SM-2: revisou 1x → enferruja em 3d; 2x → 7d; 3x → 21d; 4x+ → 60d.
const RUST_INTERVALS = [3, 7, 21, 60]

const bumpReview = (
  rev: GameState['skillReview'],
  skillId: string,
  todayISO: string,
): GameState['skillReview'] => {
  const level = (rev[skillId]?.level ?? 0) + 1
  return { ...rev, [skillId]: { lastISO: todayISO, level } }
}

/** Uma skill dominada enferruja se ficou sem uso além do intervalo atual. */
export function isRusted(g: GameState, skillId: string, todayISO: string): boolean {
  const s = skillById(skillId)
  if (!s || !isDone(g, s.contractId)) return false
  const rev = g.skillReview[skillId]
  if (!rev) return false
  const interval = RUST_INTERVALS[Math.min(rev.level - 1, RUST_INTERVALS.length - 1)] ?? RUST_INTERVALS[0]
  return daysBetween(rev.lastISO, todayISO) > interval
}

/** Revisão-relâmpago que tira a ferrugem e empurra o próximo intervalo (GDD §5.3). */
export function reviewSkill(g: GameState, skillId: string): GameState {
  return { ...g, skillReview: bumpReview(g.skillReview, skillId, today()) }
}

// ---------------------------------------------------------------- Equipe / Estagiários (GDD §4.2)
// Só as skills com um contrato do bairro (REPEATABLE) hoje — `ler` e `explorar` — têm o que
// automatizar. Custo único (não recorrente); entrega automática paga metade e NÃO conta como
// revisão de ferrugem (o jogador não exercitou a skill — só o estagiário trabalhou).
export const INTERN_COST = 250
export const INTERN_PAYOUT_SHARE = 0.5

export const internHireable = (g: GameState, skillId: string) =>
  !g.interns.includes(skillId) &&
  REPEATABLE.some((c) => c.skillId === skillId) &&
  !!skillById(skillId) &&
  isDone(g, skillById(skillId)!.contractId)

export function hireIntern(g: GameState, skillId: string): GameState | null {
  if (!internHireable(g, skillId) || g.money < INTERN_COST) return null
  return { ...g, money: g.money - INTERN_COST, interns: [...g.interns, skillId] }
}

/** Roda 1x/dia (chamado junto de `applyDailyBill`): cada estagiário entrega o contrato do bairro
 *  da sua skill, se ainda não entregue hoje. Ferrugem ainda desconta o pagamento (×0.6) — a
 *  "equipe" também enferruja; mas não bumpa `skillReview`, pra ferrugem do JOGADOR continuar
 *  avançando normalmente mesmo com o estagiário trabalhando. */
export function applyInternWork(
  g: GameState,
  todayISO: string,
): { next: GameState; earned: number; delivered: string[] } {
  let money = g.money
  let bairroLastDayISO = g.bairroLastDayISO
  let codeByContract = g.codeByContract
  const delivered: string[] = []
  for (const skillId of g.interns) {
    const c = REPEATABLE.find((r) => r.skillId === skillId)
    if (!c || !bairroAvailable({ ...g, bairroLastDayISO }, c, todayISO)) continue
    const rusty = isRusted(g, skillId, todayISO)
    const pay = Math.round(c.payout * INTERN_PAYOUT_SHARE * (rusty ? 0.6 : 1))
    money += pay
    bairroLastDayISO = { ...bairroLastDayISO, [c.id]: todayISO }
    if (c.id in codeByContract) {
      codeByContract = { ...codeByContract }
      delete codeByContract[c.id]
    }
    delivered.push(c.titulo)
  }
  if (delivered.length === 0) return { next: g, earned: 0, delivered: [] }
  return { next: { ...g, money, bairroLastDayISO, codeByContract }, earned: money - g.money, delivered }
}

export const todayISO = () => today()
