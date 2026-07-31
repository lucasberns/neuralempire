const PREVIEW_ROWS = 6

// ponytail: split por vírgula basta — o CSV é nosso, sem aspas nem vírgulas em valores.
export function DataPreview({ csv, note }: { csv: string; note?: string }) {
  const lines = csv.trim().split('\n')
  const header = (lines[0] ?? '').split(',')
  const rows = lines.slice(1, 1 + PREVIEW_ROWS).map((l) => l.split(','))
  return (
    <div className="card">
      <h3>📄 Dados do cliente</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {header.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Mostrando {rows.length} de {lines.length - 1} linhas.
        {note ? ` ${note}` : ''}
      </p>
    </div>
  )
}
