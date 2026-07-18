import { useMemo, useState } from 'react'
import type { GameState } from '../persistence/saveGame'
import type { RuneKind } from '../nav'
import {
  HARDWARE,
  SKILLS,
  bossCooldownMsLeft,
  contractById,
  fmtCooldown,
  hardwareOk,
  isRusted,
  nowMs,
  runesOf,
  skillById,
  skillStatus,
  todayISO,
  type SkillStatus,
} from '../game/content'
import { NODE_R, layoutSkillGraph } from '../game/skillGraph'

const STATUS_META: Record<SkillStatus, { label: string; glyph: string }> = {
  dominada: { label: 'Dominada', glyph: '✓' },
  boss: { label: 'Prova liberada', glyph: '⚔' },
  runas: { label: 'Em treino', glyph: '▸' },
  bloqueada: { label: 'Bloqueada', glyph: '🔒' },
}

export function SkillTreeScreen({
  game,
  onOpenRune,
  onOpenKata,
  onOpenBoss,
  onReview,
}: {
  game: GameState
  onOpenRune: (skillId: string, kind: RuneKind) => void
  onOpenKata: (skillId: string) => void
  onOpenBoss: (contractId: string) => void
  onReview: (skillId: string) => void
}) {
  const hoje = todayISO()
  const now = nowMs()
  const dominadas = SKILLS.filter((s) => skillStatus(game, s) === 'dominada').length
  const layout = useMemo(() => layoutSkillGraph(SKILLS), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggleSelected = (id: string) => setSelectedId((cur) => (cur === id ? null : id))

  const selected = selectedId ? skillById(selectedId) : undefined
  const selectedNode = selectedId ? layout.byId.get(selectedId) : undefined
  const status = selected ? skillStatus(game, selected) : 'bloqueada'
  const meta = STATUS_META[status]
  const runes = selected ? runesOf(game, selected.id) : { intuicao: false, matematica: false, codigo: false }
  const active = status !== 'bloqueada'
  const bossReady = status === 'boss'
  const done = status === 'dominada'
  const rusted = selected ? done && isRusted(game, selected.id, hoje) : false

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Árvore de Skills</h2>
        <p className="muted">
          {dominadas}/{SKILLS.length} skills dominadas. Toque um nó pra ver os detalhes.
        </p>
      </div>

      <div className="skill-graph-viewport">
        <div className="skill-graph-canvas" style={{ width: layout.bounds.w, height: layout.bounds.h }}>
          <svg
            className="skill-graph"
            viewBox={`${layout.bounds.x} ${layout.bounds.y} ${layout.bounds.w} ${layout.bounds.h}`}
            width={layout.bounds.w}
            height={layout.bounds.h}
            role="img"
            aria-label="Mapa da árvore de skills"
          >
            {layout.edges.map((e) => {
              const from = layout.byId.get(e.from)
              const to = layout.byId.get(e.to)
              if (!from || !to) return null
              const toSkill = skillById(e.to)
              const edgeActive = !!toSkill && skillStatus(game, toSkill) !== 'bloqueada'
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  className={`skill-edge${edgeActive ? '' : ' dim'}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                />
              )
            })}

            {layout.nodes.map((n) => {
              const s = skillById(n.id)
              if (!s) return null
              const nStatus = skillStatus(game, s)
              const nMeta = STATUS_META[nStatus]
              const nRusted = nStatus === 'dominada' && isRusted(game, s.id, hoje)
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  className={`skill-node-g is-${nStatus}${nRusted ? ' is-rusted' : ''}${
                    n.id === selectedId ? ' is-selected' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.nome} — ${nRusted ? 'Enferrujada' : nMeta.label}`}
                  aria-pressed={n.id === selectedId}
                  onClick={() => toggleSelected(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSelected(n.id)
                    }
                  }}
                >
                  <circle className="skill-node-circle" r={NODE_R} />
                  <text className="skill-node-icon" y={8} textAnchor="middle">
                    {nMeta.glyph}
                  </text>
                  <text className="skill-node-nome" y={NODE_R + 18} textAnchor="middle">
                    {s.nome}
                  </text>
                </g>
              )
            })}
          </svg>

          {selected && selectedNode && (
            <div
              className="skill-popup"
              style={{
                left: selectedNode.x - layout.bounds.x,
                top: selectedNode.y - layout.bounds.y + NODE_R + 34,
              }}
            >
              <button
                type="button"
                className="skill-popup-close"
                aria-label="Fechar"
                onClick={() => setSelectedId(null)}
              >
                ✕
              </button>

              <div className="skill-popup-head">
                <h3 className="panel-title">{selected.nome}</h3>
                {rusted ? (
                  <span className="chip status-rusted">Enferrujada</span>
                ) : (
                  <span className={`chip status-${status}`}>{meta.label}</span>
                )}
              </div>
              <p className="muted">{selected.desc}</p>

              <div className="skill-popup-runas">
                {(['intuicao', 'matematica'] as RuneKind[]).map((k) => {
                  const doneRune = runes[k]
                  const icon = k === 'intuicao' ? '◆' : 'Σ'
                  const label = k === 'intuicao' ? 'Intuição' : 'Matemática'
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`skill-popup-runa ${doneRune ? 'on' : ''}`}
                      disabled={!active || doneRune || done}
                      onClick={() => onOpenRune(selected.id, k)}
                    >
                      <span className="spr-icon">{icon}</span>
                      <span className="spr-label">{label}</span>
                      {doneRune && <span className="spr-check">✓</span>}
                    </button>
                  )
                })}
                <button
                  type="button"
                  className={`skill-popup-runa ${runes.codigo ? 'on' : ''}`}
                  disabled={!active || runes.codigo || done}
                  onClick={() => onOpenKata(selected.id)}
                >
                  <span className="spr-icon">{'{}'}</span>
                  <span className="spr-label">Código</span>
                  {runes.codigo && <span className="spr-check">✓</span>}
                </button>
              </div>

              {rusted && (
                <p className="footnote left rust-warn">
                  Sem uso, sua equipe enferrujou aqui — contratos do bairro dessa skill pagam
                  menos. Uma revisão rápida tira a ferrugem.
                </p>
              )}
              {rusted && (
                <button className="btn btn-primary sm" onClick={() => onReview(selected.id)}>
                  🔧 Revisar (tirar a ferrugem)
                </button>
              )}
              {done && (
                <button
                  className={`btn ${rusted ? 'btn-ghost' : 'btn-primary'} sm`}
                  onClick={() => onOpenBoss(selected.contractId)}
                >
                  Revisar a Prova
                </button>
              )}
              {bossReady &&
                (() => {
                  const cd = bossCooldownMsLeft(game, selected.contractId, now)
                  const boss = contractById(selected.contractId)
                  const hwBlock = !!boss && !hardwareOk(game, boss)
                  if (cd > 0)
                    return (
                      <p className="footnote left">⏳ Prova em cooldown — tente em {fmtCooldown(cd)}.</p>
                    )
                  if (hwBlock)
                    return (
                      <p className="footnote left">
                        🖥 Requer {HARDWARE[boss?.minHardware ?? 0]?.nome}. Faça o upgrade na garagem.
                      </p>
                    )
                  return (
                    <button className="btn btn-primary sm" onClick={() => onOpenBoss(selected.contractId)}>
                      ⚔ Fazer a Prova de Domínio
                    </button>
                  )
                })()}
              {status === 'runas' && (
                <p className="footnote left">Complete as 2 runas para liberar a Prova.</p>
              )}
              {status === 'bloqueada' && <p className="footnote left">Domine a skill anterior primeiro.</p>}
            </div>
          )}
        </div>
      </div>

      <p className="footnote">
        A árvore brilhando é o retrato do seu conhecimento. Você pode perder o lab — nunca as skills.
      </p>
    </section>
  )
}
