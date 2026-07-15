import type { GameState } from '../persistence/saveGame'
import { currentHardware } from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

export function StatHud({ game }: { game: GameState }) {
  const hw = currentHardware(game)
  return (
    <div className="hud">
      <div className="hud-brand">
        <span className="hud-logo">◢◤</span>
        <span>
          NEURAL<span className="hud-logo-accent">://</span>EMPIRE
        </span>
      </div>
      <div className="hud-stats">
        <div className="hud-stat" title="Caixa do laboratório">
          <span className="hud-ico" style={{ color: 'var(--amber)' }}>
            ◈
          </span>
          <b style={{ color: 'var(--amber)' }}>{money(game.money)}</b>
        </div>
        <div className="hud-stat" title="Reputação global">
          <span className="hud-ico" style={{ color: 'var(--cyan)' }}>
            ★
          </span>
          <b>{game.reputation}</b>
          <small className="hud-unit">rep</small>
        </div>
        <div className="hud-stat" title="Dias seguidos de trabalho">
          <span className="hud-ico" style={{ color: 'var(--lime)' }}>
            ▲
          </span>
          <b>{game.streak.count}</b>
          <small className="hud-unit">streak</small>
        </div>
      </div>
      <div className="hud-hw" title="Hardware atual">
        {hw.nome}
      </div>
    </div>
  )
}
