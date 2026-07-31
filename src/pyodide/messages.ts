// Protocolo tipado entre a UI e o worker do Pyodide.

export interface TestSpec {
  name: string
  /** Código Python com asserts, executado numa cópia do namespace do usuário. */
  code: string
  /** Teste oculto: a UI mostra só passou/falhou, nunca a mensagem. */
  hidden: boolean
}

export interface TestResult {
  name: string
  hidden: boolean
  passed: boolean
  message: string | null
}

export interface PyError {
  kind: string // ex.: "NameError"
  message: string
  line: number | null // linha dentro do código do usuário, quando identificável
}

export interface RunRequest {
  type: 'run'
  id: number
  code: string
  /** Prepara o namespace (dados_treino, dados_novos…). Recebe o CSV em `_ne_csv`. */
  setup: string
  csv: string
  tests: TestSpec[]
  /** Opcional: roda após todos os testes passarem e deve definir `_ne_result` (dict). */
  metrics: string
}

export type WorkerRequest = { type: 'init' } | RunRequest

export interface Progress {
  message: string
  loaded: number
  total: number
}

export interface RunOutcome {
  ok: boolean
  error?: PyError
  tests: TestResult[]
  stdout: string
  metrics?: Record<string, unknown>
}

export type WorkerResponse =
  | ({ type: 'progress' } & Progress)
  | { type: 'ready' }
  | { type: 'init-error'; message: string }
  | ({ type: 'result'; id: number } & RunOutcome)
  | { type: 'run-error'; id: number; message: string }
