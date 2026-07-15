// Engine de contratos (GDD §7). Fase 0: só o tipo consumido pela tela de demo.
// Próximas fases (GDD §7.3, §12): geração paramétrica setor × técnica × dificuldade,
// holdout oculto de verdade, contratos relâmpago/boss/misterioso/disputado/crise.
import type { TestSpec } from '../../pyodide/messages'

export type Setor = 'varejo' | 'saude' | 'financas' | 'industria' | 'tech'

export interface Contract {
  id: string
  titulo: string
  /** Briefing em linguagem de negócio — nunca "faça uma regressão" (GDD §7.1). */
  briefing: string
  setor: Setor
  /** CSV servido pelo próprio app (entra no precache do SW → offline). */
  datasetUrl: string
  starterCode: string
  /** Python que prepara o namespace (dados_treino, dados_novos…); recebe o CSV em `_ne_csv`. */
  setupCode: string
  tests: TestSpec[]
  /** Roda após todos os testes passarem; define `_ne_result` (dict) exibido ao jogador. */
  metricsCode: string
}
