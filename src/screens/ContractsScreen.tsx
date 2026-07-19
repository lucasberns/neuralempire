import { useState } from 'react'
import type { GameState } from '../persistence/saveGame'
import type { View } from '../nav'
import type { Contract } from '../engine/contracts'
import { BossCard, money, type CardState } from '../components/BossCard'
import {
  CONTRACTS,
  INTERN_COST,
  RELAMPAGO,
  REPEATABLE,
  SPECIAL,
  bairroAvailable,
  bossCooldownMsLeft,
  hardwareOk,
  hireIntern,
  internHireable,
  isAvailable,
  isDone,
  nowMs,
  relampagoAvailable,
  skillOfContract,
  skillStatus,
  todayISO,
} from '../game/content'

type TabId = 'disponiveis' | 'em-treino' | 'bloqueadas' | 'entregues'

const TAB_ORDER: TabId[] = ['disponiveis', 'em-treino', 'bloqueadas', 'entregues']

const TAB_META: Record<TabId, { label: string; glyph: string; colorClass: string }> = {
  disponiveis: { label: 'Disponíveis', glyph: '⚔', colorClass: 'tab-lime' },
  'em-treino': { label: 'Em treino', glyph: '▸', colorClass: 'tab-cyan' },
  bloqueadas: { label: 'Bloqueadas', glyph: '🔒', colorClass: 'tab-dim' },
  entregues: { label: 'Entregues', glyph: '✓', colorClass: 'tab-dim' },
}

const stateToTab: Record<CardState, TabId> = {
  boss: 'disponiveis',
  runas: 'em-treino',
  bloqueada: 'bloqueadas',
  done: 'entregues',
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

  const bosses = CONTRACTS.map((c) => {
    const skill = skillOfContract(c.id)
    const st = skill ? skillStatus(game, skill) : 'boss'
    const state: CardState = isDone(game, c.id)
      ? 'done'
      : st === 'boss'
        ? 'boss'
        : st === 'runas'
          ? 'runas'
          : 'bloqueada'
    return { c, state }
  })

  const tabCounts: Record<TabId, number> = { disponiveis: 0, 'em-treino': 0, bloqueadas: 0, entregues: 0 }
  for (const { state } of bosses) tabCounts[stateToTab[state]] += 1

  const [tab, setTab] = useState<TabId>(
    () => TAB_ORDER.find((t) => tabCounts[t] > 0) ?? 'disponiveis',
  )
  const visibleBosses = bosses.filter(({ state }) => stateToTab[state] === tab)

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Mesa de Contratos</h2>
        <p className="muted">Traduza o problema do cliente em código. O holdout é secreto.</p>
      </div>

      <div className="contracts-tabbar" role="tablist">
        {TAB_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`contracts-tab ${TAB_META[t].colorClass}${tab === t ? ' is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            <span aria-hidden>{TAB_META[t].glyph}</span> {TAB_META[t].label}{' '}
            <span className="ct-n">{tabCounts[t]}</span>
          </button>
        ))}
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

      {visibleBosses.map(({ c, state }) => (
        <BossCard
          key={c.id}
          c={c}
          state={state}
          cooldownMsLeft={bossCooldownMsLeft(game, c.id, now)}
          hardwareBlocked={!hardwareOk(game, c)}
          onAccept={() => open(c)}
          onRunes={() => onNavigate('skills')}
        />
      ))}

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
              const automated = game.interns.includes(c.skillId)
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
                  {automated ? (
                    <p className="cc-lock ok">
                      🧑‍💻 Automatizado pelo estagiário — some 1x/dia sem precisar abrir a bancada.
                    </p>
                  ) : (
                    <>
                      {on ? (
                        <button className="btn btn-primary" onClick={() => open(c)}>
                          Pegar serviço (+{money(c.payout)}) →
                        </button>
                      ) : (
                        <p className="cc-lock ok">✓ Já feito hoje. Volte amanhã.</p>
                      )}
                      {internHireable(game, c.skillId) &&
                        (game.money >= INTERN_COST ? (
                          <button
                            className="btn btn-ghost sm"
                            onClick={() => {
                              const g = hireIntern(game, c.skillId)
                              if (g) onGameChange(g)
                            }}
                          >
                            🧑‍💻 Contratar estagiário ({money(INTERN_COST)})
                          </button>
                        ) : (
                          <button className="btn btn-ghost sm" disabled>
                            🧑‍💻 Estagiário: falta {money(INTERN_COST - game.money)}
                          </button>
                        ))}
                    </>
                  )}
                </article>
              )
            })}
          </>
        )
      })()}

      {(() => {
        const desafios = SPECIAL.filter((c) => isAvailable(game, c) || isDone(game, c.id))
        if (desafios.length === 0) return null
        return (
          <article className="contract-card">
            <header className="cc-head">
              <span className="cc-emoji">⚔️</span>
              <div className="cc-titles">
                <h3 className="panel-title">Desafios</h3>
                <span className="chip">{desafios.length} disponível(is)</span>
              </div>
            </header>
            <p className="cc-brief">Contratos únicos pra skills já dominadas: duelos e crises de manutenção.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('desafios')}>
              → Ver Desafios
            </button>
          </article>
        )
      })()}
    </section>
  )
}
