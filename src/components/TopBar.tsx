import type { GameState } from '../persistence/saveGame'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

// Barra das sub-telas: único caminho de volta é a garagem.
export function TopBar({ game, onBack }: { game: GameState; onBack: () => void }) {
  return (
    <div className="topbar">
      <button className="back-btn" onClick={onBack}>
        ← Garagem
      </button>
      <div className="topbar-stats">
        <span className="ov-stat amber">◈ {money(game.money)}</span>
        <span className="ov-stat cyan">★ {game.reputation}</span>
        <span className="ov-stat lime">▲ {game.streak.count}</span>
      </div>
    </div>
  )
}
