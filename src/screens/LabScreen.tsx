import { useEffect, useState } from 'react'
import type { GameState } from '../persistence/saveGame'
import type { View } from '../nav'
import { GarageScene, type Hotspot } from './GarageScene'
import {
  RENT_PER_TURN,
  SKILLS,
  buyHardware,
  currentHardware,
  nextHardware,
  relampagoAvailable,
  skillStatus,
} from '../game/content'

const money = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

// A garagem É o jogo (estilo Game Dev Tycoon): cena maximizada, HUD mínimo,
// e as funções só se alcançam pelos hotspots (PC, porta, quadro).
export function LabScreen({
  game,
  onGameChange,
  onNavigate,
  onExport,
  onImport,
  arriveFromDesk = false,
}: {
  game: GameState
  onGameChange: (g: GameState) => void
  onNavigate: (v: View) => void
  onExport: () => void
  onImport: () => void
  /** Voltando da bancada: entra com a câmera na mesa e afasta (zoom reverso). */
  arriveFromDesk?: boolean
}) {
  const [zooming, setZooming] = useState(arriveFromDesk)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!arriveFromDesk) return
    // setTimeout (não rAF): rAF não dispara com a aba oculta e deixaria o zoom preso.
    // 60ms dá tempo do frame inicial (zoomed) pintar → a transição CSS anima o afastamento.
    const id = window.setTimeout(() => setZooming(false), 60)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hw = currentHardware(game)
  const next = nextHardware(game)
  // bosses prontos (runas feitas) + relâmpago do dia = clientes na porta
  const waiting =
    SKILLS.filter((s) => skillStatus(game, s) === 'boss').length + (relampagoAvailable(game) ? 1 : 0)
  const hasActive = game.contracts.activeId !== null
  const firstTime = game.contracts.doneIds.length === 0 && !hasActive

  function go(h: Hotspot) {
    if (zooming) return
    if (h === 'door') return onNavigate('contratos')
    if (h === 'board') return onNavigate('skills')
    // PC: a câmera mergulha até a mesa antes de abrir a bancada
    const target: View = hasActive ? 'workbench' : 'contratos'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onNavigate(target)
    setZooming(true)
    window.setTimeout(() => onNavigate(target), 620)
  }

  return (
    <div className={`garage-stage${zooming ? ' zoom-desk' : ''}`}>
      {/* poeira flutuando — atmosfera barata */}
      <span className="mote m1" aria-hidden />
      <span className="mote m2" aria-hidden />
      <span className="mote m3" aria-hidden />
      <span className="mote m4" aria-hidden />
      <GarageScene level={game.hardwareLevel} notify={waiting} onSelect={go} />

      {/* HUD mínimo */}
      <header className="ov ov-tl" aria-hidden>
        <div className="ov-brand-row">
          <span className="hud-logo">◢◤</span>
          <span className="ov-brand">
            NEURAL<span className="hud-logo-accent">://</span>EMPIRE
          </span>
        </div>
        <span className="ov-chapter">CAP. 01 · A GARAGEM</span>
      </header>

      <div className="ov ov-tr">
        <span className="ov-stat amber" title="Caixa">◈ {money(game.money)}</span>
        <span className="ov-stat cyan" title="Reputação">★ {game.reputation}</span>
        <span className="ov-stat lime" title="Streak">▲ {game.streak.count}</span>
      </div>

      <div className="ov ov-bl">
        <span className="ov-hw">{hw.nome}</span>
        {next &&
          (game.money >= next.custo ? (
            <button
              className="ov-upgrade ready"
              onClick={() => {
                const g = buyHardware(game)
                if (g) onGameChange(g)
              }}
            >
              ⬆ {next.nome} · {money(next.custo)}
            </button>
          ) : (
            <button className="ov-upgrade" disabled>
              🔒 {next.nome} · falta {money(next.custo - game.money)}
            </button>
          ))}
      </div>

      <button className="ov ov-br" aria-label="Configurações" onClick={() => setSettingsOpen(true)}>
        ⚙
      </button>

      {firstTime && <p className="ov ov-hint">Toque no PC, na porta ou no quadro</p>}

      {/* Configurações: backup do save + versão */}
      {settingsOpen && (
        <div className="sheet-back" onClick={() => setSettingsOpen(false)}>
          <div className="sheet" role="dialog" aria-label="Configurações" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Configurações</h3>
            <div className="cfg-econ">
              <span>Mês {game.turn + 1}</span>
              <span>Custo fixo por entrega: {money(RENT_PER_TURN)}</span>
            </div>
            <p className="muted">
              O save fica no aparelho e funciona offline. Backup em JSON para levar a outro
              dispositivo:
            </p>
            <div className="assist-row">
              <button className="btn btn-ghost" onClick={onExport}>
                ⤓ Exportar save
              </button>
              <button className="btn btn-ghost" onClick={onImport}>
                ↳ Importar save
              </button>
            </div>
            <p className="footnote left">build {__BUILD_ID__}</p>
            <button className="btn btn-primary" onClick={() => setSettingsOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
