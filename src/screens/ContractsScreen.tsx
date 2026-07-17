import type { GameState } from '../persistence/saveGame'
import type { View } from '../nav'
import type { Contract } from '../engine/contracts'
import {
  CONTRACTS,
  HARDWARE,
  RELAMPAGO,
  REPEATABLE,
  bairroAvailable,
  bossCooldownMsLeft,
  fmtCooldown,
  hardwareOk,
  isAvailable,
  isDone,
  nowMs,
  relampagoAvailable,
  skillOfContract,
  skillStatus,
  todayISO,
} from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

const SECTOR_LABEL: Record<Contract['setor'], string> = {
  varejo: 'Varejo',
  saude: 'Saúde',
  financas: 'Finanças',
  industria: 'Indústria',
  tech: 'Tech',
}

type CardState = 'done' | 'boss' | 'runas' | 'bloqueada'

function BossCard({
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

export function ContractsScreen({
  game,
  onGameChange,
  onNavigate,
}: {
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
}) {
  function open(c: Contract) {
    onGameChange({ ...game, contracts: { ...game.contracts, activeId: c.id } })
    onNavigate('workbench')
  }

  const relampagoOn = relampagoAvailable(game)
  const hoje = todayISO()
  const now = nowMs()

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Mesa de Contratos</h2>
        <p className="muted">Traduza o problema do cliente em código. O holdout é secreto.</p>
      </div>

      <article className={`contract-card relampago-card${relampagoOn ? '' : ' is-locked'}`}>
        <header className="cc-head">
          <span className="cc-emoji">⚡</span>
          <div className="cc-titles">
            <h3 className="panel-title">{RELAMPAGO.titulo}</h3>
            <span className="chip">Diário · 3 min</span>
          </div>
        </header>
        <p className="cc-brief">
          Um trabalho rápido por dia mantém seu streak e paga um trocado. {RELAMPAGO.metaLabel}.
        </p>
        {relampagoOn ? (
          <button className="btn btn-primary" onClick={() => open(RELAMPAGO)}>
            ⚡ Pegar o relâmpago (+{money(RELAMPAGO.payout)}) →
          </button>
        ) : (
          <p className="cc-lock ok">✓ Relâmpago de hoje já feito. Volte amanhã.</p>
        )}
      </article>

      {CONTRACTS.map((c) => {
        const skill = skillOfContract(c.id)
        const st = skill ? skillStatus(game, skill) : 'boss'
        const state: CardState = isDone(game, c.id)
          ? 'done'
          : st === 'boss'
            ? 'boss'
            : st === 'runas'
              ? 'runas'
              : 'bloqueada'
        return (
          <BossCard
            key={c.id}
            c={c}
            state={state}
            cooldownMsLeft={bossCooldownMsLeft(game, c.id, now)}
            hardwareBlocked={!hardwareOk(game, c)}
            onAccept={() => open(c)}
            onRunes={() => onNavigate('skills')}
          />
        )
      })}

      {(() => {
        const bairro = REPEATABLE.filter((c) => isAvailable(game, c))
        if (bairro.length === 0) return null
        return (
          <>
            <div className="screen-head bairro-head">
              <h3 className="panel-title">Contratos do bairro</h3>
              <p className="muted">Serviços de rotina que pagam na hora e você pode refazer sempre.</p>
            </div>
            {bairro.map((c) => {
              const on = bairroAvailable(game, c, hoje)
              return (
                <article key={c.id} className={`contract-card repeatable ${on ? 'is-available' : 'is-locked'}`}>
                  <header className="cc-head">
                    <span className="cc-emoji">{c.emoji}</span>
                    <div className="cc-titles">
                      <h3 className="panel-title">{c.titulo}</h3>
                      <span className="chip">Repetível · {money(c.payout)} · 1x/dia</span>
                    </div>
                  </header>
                  <p className="cc-brief">{c.briefing}</p>
                  {on ? (
                    <button className="btn btn-primary" onClick={() => open(c)}>
                      Pegar serviço (+{money(c.payout)}) →
                    </button>
                  ) : (
                    <p className="cc-lock ok">✓ Já feito hoje. Volte amanhã.</p>
                  )}
                </article>
              )
            })}
          </>
        )
      })()}
    </section>
  )
}
