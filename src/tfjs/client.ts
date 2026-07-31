// Fachada da UI para o worker do TF.js — idêntico em estrutura ao PyodideClient
// (src/pyodide/client.ts): fila de execuções por id, timeout com reinício do worker
// (loop infinito no código do usuário não pode travar o jogo).
import type { Progress, RunOutcome, RunRequest, WorkerRequest, WorkerResponse } from './messages'

export type ClientState =
  | { phase: 'loading'; progress: Progress }
  | { phase: 'ready' }
  | { phase: 'error'; message: string }

export type RunArgs = Omit<RunRequest, 'type' | 'id'>

// Maior que o do Pyodide (60s): treinar rede de verdade é bem mais lento que rodar
// pandas/sklearn no mesmo orçamento de tempo, mesmo em redes propositalmente pequenas
// (confirmado nesta sessão: 200 épocas de um MLP 2-8-1 em 4 amostras já passa de 60s
// no ambiente de desenvolvimento, com o backend CPU ou WebGL). O timeout continua
// existindo pra pegar loop infinito de verdade, só com mais folga pro caso comum.
const RUN_TIMEOUT_MS = 120_000

interface Pending {
  resolve: (o: RunOutcome) => void
  reject: (e: Error) => void
  timer: number
}

export class TfjsClient {
  private worker!: Worker
  private ready!: Promise<void>
  private pending = new Map<number, Pending>()
  private nextId = 1

  constructor(private onState: (s: ClientState) => void) {
    this.spawn()
  }

  private spawn(): void {
    this.onState({ phase: 'loading', progress: { message: 'Iniciando…', loaded: 0, total: 1 } })
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    this.ready = new Promise<void>((resolve, reject) => {
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        switch (msg.type) {
          case 'progress':
            this.onState({ phase: 'loading', progress: msg })
            break
          case 'ready':
            this.onState({ phase: 'ready' })
            resolve()
            break
          case 'init-error':
            this.onState({ phase: 'error', message: msg.message })
            reject(new Error(msg.message))
            break
          case 'result':
            this.settle(msg.id, (p) => p.resolve(msg))
            break
          case 'run-error':
            this.settle(msg.id, (p) => p.reject(new Error(msg.message)))
            break
        }
      }
    })
    this.ready.catch(() => undefined)
    this.post({ type: 'init' })
  }

  private post(msg: WorkerRequest): void {
    this.worker.postMessage(msg)
  }

  private settle(id: number, fn: (p: Pending) => void): void {
    const p = this.pending.get(id)
    if (!p) return
    this.pending.delete(id)
    clearTimeout(p.timer)
    fn(p)
  }

  async run(args: RunArgs): Promise<RunOutcome> {
    await this.ready
    const id = this.nextId++
    return new Promise<RunOutcome>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(id)
        this.restart()
        reject(new Error('Tempo esgotado — seu código pode ter entrado em loop infinito. O TF.js foi reiniciado.'))
      }, RUN_TIMEOUT_MS)
      this.pending.set(id, { resolve, reject, timer })
      this.post({ type: 'run', id, ...args })
    })
  }

  private restart(): void {
    this.worker.terminate()
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(new Error('Execução cancelada.'))
    }
    this.pending.clear()
    this.spawn()
  }
}
