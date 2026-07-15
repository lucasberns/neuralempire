import type { Progress } from '../pyodide/messages'

export function LoadingScreen({ progress }: { progress: Progress }) {
  const pct = Math.round((progress.loaded / progress.total) * 100)
  return (
    <div className="card loading-screen">
      <h2>Montando o laboratório…</h2>
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <p className="loading-message">{progress.message}</p>
      <p className="muted">
        O primeiro carregamento baixa o Python e as bibliotecas de ML (~60 MB). Depois disso,
        tudo fica salvo no aparelho e funciona <strong>offline</strong>.
      </p>
    </div>
  )
}
