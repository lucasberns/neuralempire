// Engine de contratos (GDD §7). Fase 0: só o tipo consumido pela tela de demo.
// Próximas fases (GDD §7.3, §12): geração paramétrica setor × técnica × dificuldade,
// holdout oculto de verdade, contratos relâmpago/boss/misterioso/disputado/crise.
import type { TestSpec } from '../../pyodide/messages'

export type Setor = 'varejo' | 'saude' | 'financas' | 'industria' | 'tech'

export interface Contract {
  id: string
  emoji: string
  titulo: string
  /** Briefing em linguagem de negócio — nunca "faça uma regressão" (GDD §7.1). */
  briefing: string
  setor: Setor
  /** Skill que este contrato prova (GDD §6). */
  skillId: string
  /** Meta de métrica em linguagem simples (GDD §7.1). */
  metaLabel: string
  /** Recompensa ao entregar (todos os testes, inclusive ocultos, passando). */
  payout: number
  reputacao: number
  /** Contratos que precisam estar concluídos antes deste (grafo de progressão). */
  prereqContractIds: string[]
  /** CSV servido pelo próprio app (entra no precache do SW → offline). */
  datasetUrl: string
  /** Ausente = Python/Pyodide (padrão de hoje). 'tfjs' = JS/TF.js (Cap. 5+). */
  runtime?: 'tfjs'
  starterCode: string
  /** Python que prepara o namespace (dados_treino, dados_novos…); recebe o CSV em `_ne_csv`. */
  setupCode: string
  tests: TestSpec[]
  /** Roda após todos os testes passarem; define `_ne_result` (dict) exibido ao jogador. */
  metricsCode: string
  /** Dicas progressivas (onboarding guiado, GDD §12). */
  hints: string[]
  /** Solução de referência, revelável (o jogador pode aprender vendo). */
  solution: string
  /** Interrogatório do cliente (GDD §5.2): erros reduzem o pagamento. */
  interrogation: InterrogationQuestion[]
  /** Contrato-padrão repetível (GDD §7.2): não conta como boss, pode refazer por renda. */
  repeatable?: boolean
  /** Nível mínimo de hardware (índice em HARDWARE) para aceitar — dá função ao upgrade (Fase 2). */
  minHardware?: number
  /** Contrato disputado (GDD §7.2, Cap. 3+): concorrente NPC com esta métrica; melhor leva o
   *  cliente (afeta só pagamento/reputação, nunca o desbloqueio da skill). `scoreKey` aponta pra
   *  uma chave numérica crua em `_ne_result` (convenção: chaves com `_` na frente não aparecem
   *  pro jogador — ver `TestResults.tsx`). */
  disputado?: { npcScore: number; scoreKey: string; npcLabel: string }
  /** Contrato de crise (GDD §7.2): o modelo de um contrato antigo começou a errar (drift) — só
   *  pra UI (badge "🔥 Crise" no card e na bancada), nenhuma lógica de jogo nova. */
  crise?: { originalContractId: string }
}

export interface InterrogationQuestion {
  q: string
  options: string[]
  correct: number // índice da opção correta
}
