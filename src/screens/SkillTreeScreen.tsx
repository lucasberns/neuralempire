import type { GameState } from '../persistence/saveGame'
import type { RuneKind } from '../nav'
import { SKILLS, isRusted, runesOf, skillStatus, todayISO, type SkillStatus } from '../game/content'

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
  const dominadas = SKILLS.filter((s) => skillStatus(game, s) === 'dominada').length

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Árvore de Skills</h2>
        <p className="muted">
          Tier 1 · Fundamentos — {dominadas}/{SKILLS.length} dominadas. Cada skill: 2 runas + a Prova de Domínio.
        </p>
      </div>

      <div className="skill-tree">
        {SKILLS.map((s, i) => {
          const status = skillStatus(game, s)
          const meta = STATUS_META[status]
          const runes = runesOf(game, s.id)
          const active = status !== 'bloqueada'
          const bossReady = status === 'boss'
          const done = status === 'dominada'
          const rusted = done && isRusted(game, s.id, hoje)
          return (
            <div key={s.id} className={`skill-node is-${status}${rusted ? ' is-rusted' : ''}`}>
              {i > 0 && <span className={`skill-link ${active ? '' : 'dim'}`} />}
              <div className="skill-orb">
                <span className="skill-tier">T1·{i + 1}</span>
                <span className="skill-glyph">{meta.glyph}</span>
              </div>
              <div className="skill-body">
                <div className="skill-top">
                  <h3 className="panel-title">{s.nome}</h3>
                  {rusted ? (
                    <span className="chip status-rusted">Enferrujada</span>
                  ) : (
                    <span className={`chip status-${status}`}>{meta.label}</span>
                  )}
                </div>
                <p className="muted">{s.desc}</p>

                <div className="runes">
                  {(['intuicao', 'matematica'] as RuneKind[]).map((k) => {
                    const doneRune = runes[k]
                    const label = k === 'intuicao' ? '◆ Intuição' : 'Σ Matemática'
                    return (
                      <button
                        key={k}
                        className={`rune ${doneRune ? 'on' : ''}`}
                        disabled={!active || doneRune || done}
                        onClick={() => onOpenRune(s.id, k)}
                      >
                        {doneRune ? '✓ ' : ''}
                        {label}
                      </button>
                    )
                  })}
                  <button
                    className={`rune ${runes.codigo ? 'on' : ''}`}
                    disabled={!active || runes.codigo || done}
                    onClick={() => onOpenKata(s.id)}
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
                  <button className="btn btn-primary sm" onClick={() => onReview(s.id)}>
                    🔧 Revisar (tirar a ferrugem)
                  </button>
                )}
                {(bossReady || done) && (
                  <button
                    className={`btn ${rusted ? 'btn-ghost' : 'btn-primary'} sm`}
                    onClick={() => onOpenBoss(s.contractId)}
                  >
                    {done ? 'Revisar a Prova' : '⚔ Fazer a Prova de Domínio'}
                  </button>
                )}
                {status === 'runas' && (
                  <p className="footnote left">Complete as 2 runas para liberar a Prova.</p>
                )}
                {status === 'bloqueada' && (
                  <p className="footnote left">Domine a skill anterior primeiro.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="footnote">
        A árvore brilhando é o retrato do seu conhecimento. Você pode perder o lab — nunca as skills.
      </p>
    </section>
  )
}
