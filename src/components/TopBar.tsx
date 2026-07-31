import type { GameState } from '../persistence/saveGame'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

// Barra das sub-telas: o rótulo de volta é decidido por quem chama (App.tsx sabe pra onde onBack vai).
export function TopBar({
  game,
  backLabel,
  onBack,
}: {
  game: GameState
  backLabel: string
  onBack: () => void
}) {
  return (
    <div className="topbar">
      <button className="back-btn" onClick={onBack}>
        {backLabel}
      </button>
      <div className="topbar-stats">
        <span className="ov-stat amber">◈ {money(game.money)}</span>
        <span className="ov-stat cyan">★ {game.reputation}</span>
        <span className="ov-stat lime">▲ {game.streak.count}</span>
      </div>
    </div>
  )
}
