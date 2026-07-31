import type { SkillDef } from './content'

export const NODE_R = 30
const SLOT_W = 112
const ROW_H = 118
const LABEL_H = 34
const PAD = 44

export interface GraphNode {
  id: string
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
}

export interface SkillGraphLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  byId: Map<string, GraphNode>
  bounds: { x: number; y: number; w: number; h: number }
}

// Nível topológico: 0 se não tem pré-requisito, senão 1 + o maior nível dos pais.
// Suporta grafo geral (múltiplos pais), não só a cadeia linear de hoje.
function computeTiers(skills: readonly SkillDef[]): Map<string, number> {
  const byId = new Map(skills.map((s) => [s.id, s]))
  const tierOf = new Map<string, number>()
  const visiting = new Set<string>()

  function tier(id: string): number {
    const cached = tierOf.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) {
      throw new Error(`Ciclo de pré-requisitos detectado envolvendo a skill "${id}"`)
    }
    visiting.add(id)
    const s = byId.get(id)
    const t = !s || s.prereqSkillIds.length === 0 ? 0 : 1 + Math.max(...s.prereqSkillIds.map(tier))
    visiting.delete(id)
    tierOf.set(id, t)
    return t
  }

  for (const s of skills) tier(s.id)
  return tierOf
}

// `x`/`y` de cada nó são o CENTRO do círculo (não canto). A árvore cresce pra
// baixo (tier 0 no topo, y crescendo por tier) — decisão deliberada a manter
// nas próximas fases/capítulos (GDD §6, até 24 skills / 6 tiers).
export function layoutSkillGraph(skills: readonly SkillDef[]): SkillGraphLayout {
  const tierOf = computeTiers(skills)
  const maxTier = Math.max(0, ...tierOf.values())

  const byTier = new Map<number, SkillDef[]>()
  for (const s of skills) {
    const t = tierOf.get(s.id) ?? 0
    if (!byTier.has(t)) byTier.set(t, [])
    byTier.get(t)!.push(s)
  }

  const nodes: GraphNode[] = []
  let maxRowWidth = 0
  for (let t = 0; t <= maxTier; t++) {
    const row = byTier.get(t) ?? []
    const rowWidth = row.length * SLOT_W
    maxRowWidth = Math.max(maxRowWidth, rowWidth)
    row.forEach((s, i) => {
      nodes.push({
        id: s.id,
        x: i * SLOT_W - rowWidth / 2 + SLOT_W / 2,
        y: t * ROW_H,
      })
    })
  }

  const edges: GraphEdge[] = []
  for (const s of skills) {
    for (const p of s.prereqSkillIds) edges.push({ from: p, to: s.id })
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const w = maxRowWidth + PAD * 2
  const h = maxTier * ROW_H + NODE_R * 2 + LABEL_H + PAD * 2

  return { nodes, edges, byId, bounds: { x: -w / 2, y: -PAD - NODE_R, w, h } }
}
