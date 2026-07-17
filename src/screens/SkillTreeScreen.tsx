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
import { NODE_H, NODE_W, layoutSkillGraph } from '../game/skillGraph'

const STATUS_META: Record<SkillStatus, { label: string; glyph: string }> = {
  dominada: { label: 'Dominada', glyph: '✓' },
  boss: { label: 'Prova liberada', glyph: '⚔' },
  runas: { label: 'Em treino', glyph: '▸' },
  bloqueada: { label: 'Bloqueada', glyph: '🔒' },
}

const ZOOM_MIN = 0.6
const ZOOM_MAX = 1.8
const ZOOM_STEP = 0.2

function defaultSelectedId(game: GameState): string {
  const first = SKILLS.find((s) => skillStatus(game, s) !== 'dominada')
  return (first ?? SKILLS[0]).id
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
  const [selectedId, setSelectedId] = useState<string>(() => defaultSelectedId(game))
  const [zoom, setZoom] = useState(1)

  const selected = skillById(selectedId)
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
          Tier 1 · Fundamentos — {dominadas}/{SKILLS.length} dominadas. Toque um nó pra ver os detalhes.
        </p>
      </div>

      <div className="skill-graph-toolbar">
        <button
          type="button"
          className="btn btn-ghost sm"
          aria-label="Diminuir zoom"
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
        >
          −
        </button>
        <span className="skill-zoom-pct">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="btn btn-ghost sm"
          aria-label="Aumentar zoom"
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
        >
          +
        </button>
      </div>

      <div className="skill-graph-viewport">
        <svg
          className="skill-graph"
          viewBox={`${layout.bounds.x} ${layout.bounds.y} ${layout.bounds.w} ${layout.bounds.h}`}
          width={layout.bounds.w * zoom}
          height={layout.bounds.h * zoom}
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
                x1={from.x + NODE_W / 2}
                y1={from.y + NODE_H}
                x2={to.x + NODE_W / 2}
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
                onClick={() => setSelectedId(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedId(n.id)
                  }
                }}
              >
                <rect className="skill-node-rect" width={NODE_W} height={NODE_H} rx={12} />
                <text className="skill-node-glyph" x={NODE_W / 2} y={26} textAnchor="middle">
                  {nMeta.glyph}
                </text>
                <text className="skill-node-nome" x={NODE_W / 2} y={48} textAnchor="middle">
                  {s.nome}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {selected && (
        <div className="skill-detail">
          <div className="skill-top">
            <h3 className="panel-title">{selected.nome}</h3>
            {rusted ? (
              <span className="chip status-rusted">Enferrujada</span>
            ) : (
              <span className={`chip status-${status}`}>{meta.label}</span>
            )}
          </div>
          <p className="muted">{selected.desc}</p>

          <div className="runes">
            {(['intuicao', 'matematica'] as RuneKind[]).map((k) => {
              const doneRune = runes[k]
              const label = k === 'intuicao' ? '◆ Intuição' : 'Σ Matemática'
              return (
                <button
                  key={k}
                  className={`rune ${doneRune ? 'on' : ''}`}
                  disabled={!active || doneRune || done}
                  onClick={() => onOpenRune(selected.id, k)}
                >
                  {doneRune ? '✓ ' : ''}
                  {label}
                </button>
              )
            })}
            <button
              className={`rune ${runes.codigo ? 'on' : ''}`}
              disabled={!active || runes.codigo || done}
              onClick={() => onOpenKata(selected.id)}
            >
              {runes.codigo ? '✓ ' : ''}
              {'{}'} Código
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
                return <p className="footnote left">⏳ Prova em cooldown — tente em {fmtCooldown(cd)}.</p>
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
          {status === 'runas' && <p className="footnote left">Complete as 2 runas para liberar a Prova.</p>}
          {status === 'bloqueada' && <p className="footnote left">Domine a skill anterior primeiro.</p>}
        </div>
      )}

      <p className="footnote">
        A árvore brilhando é o retrato do seu conhecimento. Você pode perder o lab — nunca as skills.
      </p>
    </section>
  )
}
