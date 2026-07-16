import type { GameState } from '../persistence/saveGame'
import type { View } from '../nav'
import type { Contract } from '../engine/contracts'
import { CONTRACTS, contractById, isAvailable, isDone } from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

const SECTOR_LABEL: Record<Contract['setor'], string> = {
  varejo: 'Varejo',
  saude: 'Saúde',
  financas: 'Finanças',
  industria: 'Indústria',
  tech: 'Tech',
}

function ContractCard({
  c,
  state,
  onAccept,
}: {
  c: Contract
  state: 'done' | 'available' | 'locked'
  onAccept: () => void
}) {
  const prereq = c.prereqContractIds.map((id) => contractById(id)?.titulo).filter(Boolean)
  return (
    <article className={`contract-card is-${state}`}>
      <header className="cc-head">
        <span className="cc-emoji">{c.emoji}</span>
        <div className="cc-titles">
          <h3 className="panel-title">{c.titulo}</h3>
          <span className="chip chip-cyan">{SECTOR_LABEL[c.setor]}</span>
        </div>
        {state === 'done' && <span className="cc-stamp">ENTREGUE</span>}
      </header>

      <p className="cc-brief">{c.briefing}</p>

      <div className="cc-terms">
        <div>
          <span className="term-k">Meta</span>
          <span className="term-v">{c.metaLabel}</span>
        </div>
        <div>
          <span className="term-k">Pagamento</span>
          <span className="term-v amber">{money(c.payout)}</span>
        </div>
        <div>
          <span className="term-k">Reputação</span>
          <span className="term-v">+{c.reputacao}</span>
        </div>
      </div>

      {state === 'available' && (
        <button className="btn btn-primary" onClick={onAccept}>
          Aceitar contrato →
        </button>
      )}
      {state === 'locked' && (
        <p className="cc-lock">🔒 Precisa entregar antes: {prereq.join(', ')}</p>
      )}
      {state === 'done' && <p className="cc-lock ok">✓ Skill dominada — pagamento recebido.</p>}
    </article>
  )
}

export function ContractsScreen({
  game,
  onGameChange,
  onNavigate,
}: {
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
}) {
  function accept(c: Contract) {
    onGameChange({ ...game, contracts: { ...game.contracts, activeId: c.id } })
    onNavigate('workbench')
  }

  const ordered = [...CONTRACTS].sort((a, b) => a.payout - b.payout)

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Mesa de Contratos</h2>
        <p className="muted">Traduza o problema do cliente em código. O holdout é secreto.</p>
      </div>
      {ordered.map((c) => {
        const state = isDone(game, c.id) ? 'done' : isAvailable(game, c) ? 'available' : 'locked'
        return <ContractCard key={c.id} c={c} state={state} onAccept={() => accept(c)} />
      })}
    </section>
  )
}
