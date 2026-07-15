// Sistema de skills/runas (GDD §5–6). Vazio na fase 0 — só o vocabulário de tipos.
// MVP: 3 runas obrigatórias por skill + Prova de Domínio com cooldown crescente
// (Apêndice B.2/B.5) e agenda de ferrugem estilo SM-2 (GDD §5.3).

export type RuneKind = 'intuicao' | 'matematica' | 'codigo'
export type SkillStatus = 'bloqueada' | 'em-progresso' | 'dominada' | 'enferrujada'
export type Tier = 1 | 2 | 3 | 4 | 5 | 6

export interface Skill {
  id: string
  nome: string
  tier: Tier
  prereqs: string[] // ids de skills (grafo do GDD §6)
}
