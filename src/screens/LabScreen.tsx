import type { GameState } from '../persistence/saveGame'
import type { View } from '../components/BottomNav'
import {
  CONTRACTS,
  buyHardware,
  currentHardware,
  isAvailable,
  isDone,
  nextHardware,
} from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

// Cena da garagem em CSS: o "brilho" do lab cresce com o nível de hardware.
function LabScene({ level }: { level: number }) {
  return (
    <div className={`lab-scene lvl-${level}`} aria-hidden>
      <div className="lab-glow" />
      <div className="lab-floor" />
      <div className="lab-rig">
        <div className="rig-screen">
          <span className="rig-code">
            &gt;_ fit()
            <br />
            &gt;_ predict()
          </span>
        </div>
        <div className="rig-tower">
          {Array.from({ length: level + 1 }).map((_, i) => (
            <span key={i} className="rig-led" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
      </div>
      <div className="lab-door" />
    </div>
  )
}

export function LabScreen({
  game,
  onGameChange,
  onNavigate,
  onExport,
  onImport,
}: {
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
  onExport: () => void
  onImport: () => void
}) {
  const hw = currentHardware(game)
  const next = nextHardware(game)
  const canBuy = next ? game.money >= next.custo : false

  const doneCount = game.contracts.doneIds.length
  const openContracts = CONTRACTS.filter((c) => isAvailable(game, c))
  const knocking = openContracts[0] // cliente batendo na porta

  return (
    <section className="screen">
      <div className="panel hero-panel">
        <span className="chip chip-cyan">Capítulo 1 · A Garagem</span>
        <LabScene level={game.hardwareLevel} />
        <div className="hero-meta">
          <h2 className="panel-title">{hw.nome}</h2>
          <p className="muted">{hw.desc}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <span className="stat-k">Caixa</span>
          <span className="stat-v amber">{money(game.money)}</span>
        </div>
        <div className="stat-cell">
          <span className="stat-k">Reputação</span>
          <span className="stat-v">
            {game.reputation}
            <small>/100</small>
          </span>
          <div className="meter">
            <div className="meter-fill" style={{ width: `${game.reputation}%` }} />
          </div>
        </div>
        <div className="stat-cell">
          <span className="stat-k">Contratos entregues</span>
          <span className="stat-v lime">{doneCount}</span>
        </div>
        <div className="stat-cell">
          <span className="stat-k">Streak</span>
          <span className="stat-v">🔥 {game.streak.count}</span>
        </div>
      </div>

      {knocking ? (
        <button className="panel door-panel" onClick={() => onNavigate('contratos')}>
          <span className="door-knock">✷</span>
          <div>
            <h3 className="panel-title">Tem cliente na porta</h3>
            <p className="muted">
              {knocking.emoji} {knocking.titulo} — {openContracts.length} contrato
              {openContracts.length > 1 ? 's' : ''} esperando.
            </p>
          </div>
          <span className="door-cta">Ver →</span>
        </button>
      ) : (
        <div className="panel">
          <h3 className="panel-title">Silêncio na garagem</h3>
          <p className="muted">
            {doneCount > 0
              ? 'Você limpou a fila. Novos clientes chegam conforme sua reputação cresce.'
              : 'Nenhum contrato disponível agora.'}
          </p>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Upgrade de hardware</h3>
          <span className="chip">{game.hardwareLevel + 1}/3</span>
        </div>
        {next ? (
          <>
            <div className="upgrade-row">
              <div>
                <b>{next.nome}</b>
                <p className="muted">{next.desc}</p>
              </div>
              <span className="price amber">{money(next.custo)}</span>
            </div>
            <button
              className="btn btn-primary"
              disabled={!canBuy}
              onClick={() => {
                const g = buyHardware(game)
                if (g) onGameChange(g)
              }}
            >
              {canBuy ? `Comprar ${next.nome}` : `Faltam ${money(next.custo - game.money)}`}
            </button>
          </>
        ) : (
          <p className="muted">
            Você tem o melhor da garagem. Deep learning e datacenter chegam nos próximos capítulos.
          </p>
        )}
      </div>

      <div className="panel backup-panel">
        <div className="panel-head">
          <h3 className="panel-title">Backup do save</h3>
          <span className="chip">local · offline</span>
        </div>
        <p className="muted">Tudo fica salvo no aparelho. Exporte um JSON para levar a outro dispositivo.</p>
        <div className="assist-row">
          <button className="btn btn-ghost" onClick={onExport}>
            ⤓ Exportar
          </button>
          <button className="btn btn-ghost" onClick={onImport}>
            ↳ Importar
          </button>
        </div>
      </div>

      <p className="footnote">
        {isDone(game, 'boletim-padaria')
          ? 'Conhecimento é o único ativo à prova de falência.'
          : 'Dica: aceite o primeiro contrato para começar a faturar.'}
      </p>
    </section>
  )
}
