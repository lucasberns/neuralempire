// WebWorker que hospeda o Pyodide: toda execução Python acontece aqui,
// nunca na thread da UI. O runtime e os pacotes vêm do CDN e são cacheados
// pelo service worker (ver vite.config.ts) → offline após o primeiro load.
import type { PyodideInterface } from 'pyodide'
import type { PyError, RunRequest, TestResult, WorkerRequest, WorkerResponse } from './messages'

const PYODIDE_VERSION = '314.0.2' // manter em sincronia com a devDependency "pyodide" e o cacheName do SW
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const PACKAGES = ['numpy', 'pandas', 'scikit-learn']

const post = (msg: WorkerResponse) =>
  (self as unknown as { postMessage(m: WorkerResponse): void }).postMessage(msg)

let pyodide: PyodideInterface | null = null

// Harness de testes: roda o código do usuário num namespace isolado, depois
// cada teste numa cópia rasa dele. Devolve JSON puro (nada de proxies Python↔JS).
const HARNESS = String.raw`
import io, sys, json, traceback

def _ne_exc_info():
    etype, evalue, tb = sys.exc_info()
    line = None
    for frame in traceback.extract_tb(tb):
        if frame.filename == "<seu-codigo>":
            line = frame.lineno
    return {"kind": etype.__name__, "message": str(evalue), "line": line}

def _ne_run(user_code, setup_code, tests_json, metrics_code, csv):
    tests = json.loads(tests_json)
    out = {"ok": True, "error": None, "tests": [], "stdout": "", "metrics": None}
    buf = io.StringIO()
    ns = {"_ne_csv": csv}
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    try:
        try:
            exec(compile(setup_code, "<setup>", "exec"), ns)
            exec(compile(user_code, "<seu-codigo>", "exec"), ns)
        except BaseException:
            out["ok"] = False
            out["error"] = _ne_exc_info()
            return json.dumps(out)
        for t in tests:
            r = {"name": t["name"], "hidden": t["hidden"], "passed": False, "message": None}
            try:
                exec(compile(t["code"], "<teste>", "exec"), dict(ns))
                r["passed"] = True
            except AssertionError as e:
                r["message"] = str(e) or "A condição do teste não foi atendida."
            except BaseException:
                info = _ne_exc_info()
                r["message"] = "{}: {}".format(info["kind"], info["message"])
            if t["hidden"]:
                r["message"] = None
            out["ok"] = out["ok"] and r["passed"]
            out["tests"].append(r)
        if metrics_code and out["ok"]:
            try:
                mns = dict(ns)
                exec(compile(metrics_code, "<metricas>", "exec"), mns)
                out["metrics"] = mns.get("_ne_result")
            except BaseException:
                pass  # métricas são cosméticas; nunca derrubam o resultado
    finally:
        sys.stdout, sys.stderr = old_out, old_err
        out["stdout"] = buf.getvalue()[-4000:]
    return json.dumps(out)
`

async function init(): Promise<void> {
  // total = runtime + pacotes + harness (estágios, não bytes — bom o bastante p/ barra)
  const total = PACKAGES.length + 2
  let loaded = 0
  post({ type: 'progress', message: 'Baixando o motor Python…', loaded, total })
  const mod = (await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)) as {
    loadPyodide(opts: { indexURL: string }): Promise<PyodideInterface>
  }
  pyodide = await mod.loadPyodide({ indexURL: INDEX_URL })
  loaded++
  for (const pkg of PACKAGES) {
    post({ type: 'progress', message: `Instalando ${pkg}…`, loaded, total })
    await pyodide.loadPackage(pkg)
    loaded++
  }
  post({ type: 'progress', message: 'Preparando o laboratório…', loaded, total })
  pyodide.runPython(HARNESS)
  post({ type: 'ready' })
}

function run(req: RunRequest): void {
  if (!pyodide) {
    post({ type: 'run-error', id: req.id, message: 'O Python ainda não terminou de carregar.' })
    return
  }
  try {
    const g = pyodide.globals
    g.set('_ne_user_code', req.code)
    g.set('_ne_setup_code', req.setup)
    g.set('_ne_tests_json', JSON.stringify(req.tests))
    g.set('_ne_metrics_code', req.metrics)
    g.set('_ne_csv_text', req.csv)
    const raw = pyodide.runPython(
      '_ne_run(_ne_user_code, _ne_setup_code, _ne_tests_json, _ne_metrics_code, _ne_csv_text)',
    ) as string
    const r = JSON.parse(raw) as {
      ok: boolean
      error: PyError | null
      tests: TestResult[]
      stdout: string
      metrics: Record<string, unknown> | null
    }
    post({
      type: 'result',
      id: req.id,
      ok: r.ok,
      error: r.error ?? undefined,
      tests: r.tests,
      stdout: r.stdout,
      metrics: r.metrics ?? undefined,
    })
  } catch (err) {
    post({ type: 'run-error', id: req.id, message: err instanceof Error ? err.message : String(err) })
  }
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'init') {
    void init().catch((err: unknown) =>
      post({ type: 'init-error', message: err instanceof Error ? err.message : String(err) }),
    )
  } else {
    run(msg)
  }
}
