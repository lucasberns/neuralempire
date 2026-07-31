// Economia (GDD §4). Vazio na fase 0 — só o vocabulário de tipos.
// MVP: dinheiro + 1 custo fixo + 2 upgrades; falência real nas fases seguintes,
// mas skills nunca são perdidas (Apêndice B.3).

export interface Wallet {
  dinheiro: number
  reputacaoGlobal: number
}

export interface FixedCost {
  nome: string
  valorMensal: number
}
