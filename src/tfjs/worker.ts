// WebWorker que hospeda o TF.js: toda execução JS/rede-neural do jogador acontece aqui,
// nunca na thread da UI. O runtime vem do CDN (mesmo padrão do Pyodide, ver worker.ts lá)
// e é cacheado pelo service worker (ver vite.config.ts) → offline após o primeiro load.
import type * as TfNamespace from '@tensorflow/tfjs'
import type { JsError, RunRequest, TestResult, WorkerRequest, WorkerResponse } from './messages'

const TFJS_VERSION = '4.22.0' // manter em sincronia com a devDependency e o cacheName do SW
const TFJS_URL = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${TFJS_VERSION}/+esm`

const post = (msg: WorkerResponse) =>
  (self as unknown as { postMessage(m: WorkerResponse): void }).postMessage(msg)

let tf: typeof TfNamespace | null = null

// new Function só cria funções síncronas — treinar rede (model.fit) é assíncrono, então o
// harness precisa de corpos `async`. Esta é a forma de conseguir isso com `new Function`.
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...fnArgs: unknown[]) => Promise<unknown>

function buildFn(body: string, ...params: string[]): (...args: unknown[]) => Promise<unknown> {
  // sourceURL dá um nome ao script compilado — ajuda a extrair linha de erro (melhor esforço).
  return new AsyncFunction(...params, `${body}\n//# sourceURL=seu-codigo`)
}

function errorInfo(err: unknown): JsError {
  const e = err instanceof Error ? err : new Error(String(err))
  const lineMatch = /seu-codigo:(\d+)/.exec(e.stack ?? '')
  return { kind: e.name, message: e.message, line: lineMatch ? Number(lineMatch[1]) : null }
}

async function init(): Promise<void> {
  post({ type: 'progress', message: 'Baixando o motor de redes neurais…', loaded: 0, total: 2 })
  tf = (await import(/* @vite-ignore */ TFJS_URL)) as typeof TfNamespace
  // Sem DOM/canvas no worker — backend explícito em vez de deixar o auto-detect tentar WebGL.
  await tf.setBackend('cpu')
  await tf.ready()
  post({ type: 'progress', message: 'Preparando o laboratório…', loaded: 1, total: 2 })
  post({ type: 'ready' })
}

async function run(req: RunRequest): Promise<void> {
  if (!tf) {
    post({ type: 'run-error', id: req.id, message: 'O TF.js ainda não terminou de carregar.' })
    return
  }
  const logs: string[] = []
  const originalLog = console.log
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '))
  const ns: Record<string, unknown> = {}
  const out: { ok: boolean; error?: JsError; tests: TestResult[]; metrics?: Record<string, unknown> } = {
    ok: true,
    tests: [],
  }
  try {
    try {
      await buildFn(req.setup, 'ns', 'tf', 'csv')(ns, tf, req.csv)
      await buildFn(req.code, 'ns', 'tf', 'csv')(ns, tf, req.csv)
    } catch (err) {
      out.ok = false
      out.error = errorInfo(err)
      return
    }
    for (const t of req.tests) {
      const r: TestResult = { name: t.name, hidden: t.hidden, passed: false, message: null }
      try {
        await buildFn(t.code, 'ns', 'tf')(ns, tf)
        r.passed = true
      } catch (err) {
        const info = errorInfo(err)
        r.message = `${info.kind}: ${info.message}`
      }
      if (t.hidden) r.message = null
      out.ok = out.ok && r.passed
      out.tests.push(r)
    }
    if (req.metrics && out.ok) {
      try {
        await buildFn(req.metrics, 'ns', 'tf')(ns, tf)
        out.metrics = ns.result as Record<string, unknown> | undefined
      } catch {
        // métricas são cosméticas; nunca derrubam o resultado (mesma regra do Pyodide)
      }
    }
  } finally {
    console.log = originalLog
    post({
      type: 'result',
      id: req.id,
      ok: out.ok,
      error: out.error,
      tests: out.tests,
      stdout: logs.join('\n').slice(-4000),
      metrics: out.metrics,
    })
  }
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'init') {
    void init().catch((err: unknown) =>
      post({ type: 'init-error', message: err instanceof Error ? err.message : String(err) }),
    )
  } else {
    void run(msg)
  }
}
