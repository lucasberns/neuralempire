import type { Contract } from '../engine/contracts'
import { fmtCooldown, HARDWARE } from '../game/content'

export const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

export const SECTOR_LABEL: Record<Contract['setor'], string> = {
  varejo: 'Varejo',
  saude: 'Saúde',
  financas: 'Finanças',
  industria: 'Indústria',
  tech: 'Tech',
}

export type CardState = 'done' | 'boss' | 'runas' | 'bloqueada'

export function BossCard({
  c,
  state,
  cooldownMsLeft,
  hardwareBlocked,
  onAccept,
  onRunes,
}: {
  c: Contract
  state: CardState
  cooldownMsLeft: number
  hardwareBlocked: boolean
  onAccept: () => void
  onRunes: () => void
}) {
  return (
    <article className={`contract-card is-${state === 'boss' ? 'available' : state === 'done' ? 'done' : 'locked'}`}>
      <header className="cc-head">
        <span className="cc-emoji">{c.emoji}</span>
        <div className="cc-titles">
          <h3 className="panel-title">{c.titulo}</h3>
          <span className="chip chip-cyan">{SECTOR_LABEL[c.setor]}</span>
          {c.disputado && <span className="chip chip-cyan">⚔ Disputado</span>}
          {c.crise && <span className="chip chip-fire">🔥 Crise</span>}
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

      {state === 'boss' &&
        (cooldownMsLeft > 0 ? (
          <p className="cc-lock">⏳ Prova em cooldown — tente em {fmtCooldown(cooldownMsLeft)}.</p>
        ) : hardwareBlocked ? (
          <p className="cc-lock">
            🖥 Requer {HARDWARE[c.minHardware ?? 0]?.nome}. Faça o upgrade na garagem.
          </p>
        ) : (
          <button className="btn btn-primary" onClick={onAccept}>
            ⚔ Fazer a Prova de Domínio →
          </button>
        ))}
      {state === 'runas' && (
        <button className="btn btn-ghost" onClick={onRunes}>
          Treine as 2 runas no quadro para liberar →
        </button>
      )}
      {state === 'bloqueada' && <p className="cc-lock">🔒 Domine a skill anterior primeiro.</p>}
      {state === 'done' && <p className="cc-lock ok">✓ Skill dominada — pagamento recebido.</p>}
    </article>
  )
}
