import type { GameState } from '../persistence/saveGame'
import type { View } from '../nav'
import type { Contract } from '../engine/contracts'
import { BossCard, type CardState } from '../components/BossCard'
import { SPECIAL, bossCooldownMsLeft, hardwareOk, isAvailable, isDone, nowMs } from '../game/content'

export function DesafiosScreen({
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

  const now = nowMs()
  const desafios = SPECIAL.filter((c) => isAvailable(game, c) || isDone(game, c.id))

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">Desafios</h2>
        <p className="muted">Contratos únicos pra skills já dominadas: duelos e crises de manutenção.</p>
      </div>
      {desafios.map((c) => {
        const state: CardState = isDone(game, c.id) ? 'done' : 'boss'
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
    </section>
  )
}
