import type { RunOutcome } from '../pyodide/messages'
import { friendlyPyError } from '../pyodide/friendly'

export function TestResults({ outcome }: { outcome: RunOutcome }) {
  const passed = outcome.tests.filter((t) => t.passed).length
  return (
    <div className="card">
      {outcome.error ? (
        <div className="py-error">
          <h3>💥 O código quebrou antes dos testes</h3>
          <p>
            <span className="badge badge-fail">{outcome.error.kind}</span>{' '}
            {friendlyPyError(outcome.error)}
          </p>
          <details>
            <summary>Mensagem original do Python</summary>
            <pre>{outcome.error.message}</pre>
          </details>
        </div>
      ) : (
        <>
          <h3>
            {outcome.ok ? '✅' : '❌'} Testes: {passed}/{outcome.tests.length}
          </h3>
          <ul className="test-list">
            {outcome.tests.map((t, i) => (
              <li key={i} className={t.passed ? 'test-pass' : 'test-fail'}>
                <span>{t.passed ? '✓' : '✗'}</span>
                <div>
                  {t.hidden ? <>🔒 {t.name}</> : t.name}
                  {t.message && <p className="test-message">{t.message}</p>}
                  {t.hidden && !t.passed && (
                    <p className="test-message">
                      Um teste oculto reprovou — o cliente avalia sua entrega em dados que você
                      não vê. Seu modelo generaliza bem?
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {outcome.ok && outcome.metrics && (
            <div className="metrics">
              <h4>📊 Resultado da entrega</h4>
              <dl>
                {Object.entries(outcome.metrics).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </>
      )}
      {outcome.stdout && (
        <details>
          <summary>Saída do console (print)</summary>
          <pre>{outcome.stdout}</pre>
        </details>
      )}
    </div>
  )
}
