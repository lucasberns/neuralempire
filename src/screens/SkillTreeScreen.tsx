import type { GameState } from '../persistence/saveGame'
import type { View } from '../components/BottomNav'
import { SKILLS, contractById, isAvailable, skillStatus, type SkillStatus } from '../game/content'

const STATUS_META: Record<SkillStatus, { label: string; glyph: string }> = {
  dominada: { label: 'Dominada', glyph: '✓' },
  disponivel: { label: 'Disponível', glyph: '▸' },
  bloqueada: { label: 'Bloqueada', glyph: '🔒' },
  'em-breve': { label: 'Em breve', glyph: '…' },
}

export function SkillTreeScreen({
  game,
  onGameChange,
  onNavigate,
}: {
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
}) {
  const dominadas = SKILLS.filter((s) => skillStatus(game, s) === 'dominada').length

  function openContract(contractId: string) {
    onGameChange({ ...game, contracts: { ...game.contracts, activeId: contractId } })
    onNavigate('workbench')
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Árvore de Skills</h2>
        <p className="muted">
          Tier 1 · Fundamentos — {dominadas}/{SKILLS.length} dominadas. Cada skill = 3 runas + 1 boss.
        </p>
      </div>

      <div className="skill-tree">
        {SKILLS.map((s, i) => {
          const status = skillStatus(game, s)
          const contract = s.contractId ? contractById(s.contractId) : undefined
          const playable = contract ? isAvailable(game, contract) : false
          const meta = STATUS_META[status]
          return (
            <div key={s.id} className={`skill-node is-${status}`}>
              {i > 0 && <span className={`skill-link ${status === 'bloqueada' || status === 'em-breve' ? 'dim' : ''}`} />}
              <div className="skill-orb">
                <span className="skill-tier">T1·{i + 1}</span>
                <span className="skill-glyph">{meta.glyph}</span>
              </div>
              <div className="skill-body">
                <div className="skill-top">
                  <h3 className="panel-title">{s.nome}</h3>
                  <span className={`chip status-${status}`}>{meta.label}</span>
                </div>
                <p className="muted">{s.desc}</p>
                <div className="runes">
                  <span className={`rune ${status === 'dominada' ? 'on' : ''}`}>◆ Intuição</span>
                  <span className={`rune ${status === 'dominada' ? 'on' : ''}`}>Σ Matemática</span>
                  <span className={`rune ${status === 'dominada' ? 'on' : ''}`}>{'{}'} Código</span>
                </div>
                {playable && (
                  <button className="btn btn-primary sm" onClick={() => openContract(s.contractId!)}>
                    {status === 'dominada' ? 'Revisar' : 'Fazer a prova →'}
                  </button>
                )}
                {status === 'em-breve' && (
                  <p className="footnote left">Chega numa próxima atualização do currículo.</p>
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
