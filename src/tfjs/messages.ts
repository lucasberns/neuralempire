export interface TestSpec {
  name: string
  /** Corpo de função JS com asserts (throw em caso de falha), recebe (ns, tf). */
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

export interface JsError {
  kind: string // error.name (ex.: "TypeError", "ReferenceError")
  message: string
  /** Linha dentro do código do usuário — melhor esforço via sourceURL; pode ser null. */
  line: number | null
}

export interface RunRequest {
  type: 'run'
  id: number
  code: string
  /** Corpo de função JS (pode usar `await`). Roda antes do código do usuário, no mesmo `ns`. */
  setup: string
  csv: string
  tests: TestSpec[]
  /** Opcional: corpo de função JS que roda após os testes passarem; deve popular `ns.result`. */
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
  error?: JsError
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
