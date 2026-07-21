import { useState } from 'react'
import './RunaBackpropagationIntuicao.css'

// Runa da Intuição de "backpropagation" (Tier 5): regular a taxa de aprendizado e ver a
// "bolinha" descer (ou não) pela curva de erro. Trajetórias pré-calibradas, derivadas da
// recorrência real de gradiente descendente numa parábola L(w)=(w-50)² ⇒
// w_seguinte = w - 2·lr·(w-50) — não escolhidas no olho. Toy (não treina nada de verdade).
// Props CONGELADAS.

type EstadoLr = 'muitoBaixo' | 'bom' | 'noLimite' | 'muitoAlto'

// Posições (x, 0-100) em 4 passos de gradiente descendente a partir de w0=15, pra cada learning
// rate (derivadas de w_seguinte = w - 2*lr*(w-50) com lr=0.05/0.3/0.7/1.1). Y renderizado por
// perdaY(x) = 90 - 0.03*(x-50)^2 (parábola de perda, mínimo em x=50).
const TRAJETORIAS: Record<number, { estado: EstadoLr; pontos: number[] }> = {
  0: { estado: 'muitoBaixo', pontos: [15, 18.5, 21.65, 24.485] },
  1: { estado: 'bom', pontos: [15, 36, 44.4, 47.76] },
  2: { estado: 'noLimite', pontos: [15, 64, 44.4, 52.24] },
  3: { estado: 'muitoAlto', pontos: [15, 92, -0.4, 110.48] },
}

const LABEL: Record<EstadoLr, string> = {
  muitoBaixo: 'muito baixo',
  bom: 'bom',
  noLimite: 'no limite',
  muitoAlto: 'muito alto',
}

// Limites deixam folga pro raio do maior círculo (r=5, o "ponto atual") não ser cortado pela
// borda do viewBox (SVG recorta por padrão — sem isso, a bolinha mais importante do estado
// "muito alto" ficava parcialmente invisível bem na hora que mais precisa aparecer).
function clamp(x: number): number {
  return Math.max(7, Math.min(93, x))
}

function perdaY(x: number): number {
  return 90 - 0.03 * (x - 50) ** 2
}

export function RunaBackpropagationIntuicao({ onComplete }: { onComplete: () => void }) {
  const [lr, setLr] = useState(0)
  const [solved, setSolved] = useState(false)

  const { estado, pontos } = TRAJETORIAS[lr]
  const isGood = estado === 'bom'

  if (isGood && !solved) setSolved(true)

  const curvaPontos = Array.from({ length: 21 }, (_, i) => {
    const x = i * 5
    return `${x},${perdaY(x).toFixed(1)}`
  }).join(' ')

  return (
    <div className="runa runa-backpropagation-intuicao">
      <p className="rbp-lead">
        Cada passo do gradiente descendente move o peso um pouco na direção que reduz o erro — o
        tamanho do passo é o learning rate. Regule e veja a bolinha descer a curva de erro.
      </p>

      <svg
        className="rbp-plano"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Curva de erro, com a bolinha descendo conforme o learning rate"
      >
        <polyline className="rbp-curva" points={curvaPontos} />
        {pontos.map((x, i) => (
          <circle
            key={i}
            cx={clamp(x)}
            cy={perdaY(clamp(x))}
            r={i === pontos.length - 1 ? 5 : 3}
            className={`rbp-bola ${i === pontos.length - 1 ? 'is-atual' : 'is-passo'}`}
            style={{ opacity: 0.35 + (0.65 * i) / (pontos.length - 1) }}
          />
        ))}
      </svg>

      <label className="rbp-slider">
        <span className="rbp-slider-top">
          <span>learning rate</span>
          <span className="rbp-val">{LABEL[estado]}</span>
        </span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={lr}
          aria-label="Tamanho do learning rate"
          onChange={(e) => setLr(Number(e.target.value))}
        />
      </label>

      <div className="rbp-meter" aria-live="polite">
        <p className={`rbp-resultado ${isGood ? 'is-good' : ''}`}>
          {estado === 'muitoBaixo' && 'Passo pequeno demais — depois de vários passos, ainda longe do mínimo.'}
          {estado === 'bom' && 'Converge suave até perto do mínimo — esse é o tamanho de passo certo.'}
          {estado === 'noLimite' && 'Passa do mínimo e volta (oscila), mas ainda converge — no limite do que funciona.'}
          {estado === 'muitoAlto' && 'Passo grande demais — a bolinha "explode" pra longe do mínimo, o erro piora.'}
        </p>
      </div>

      {solved && (
        <button type="button" className="runa-cta" onClick={onComplete}>
          Concluir runa
        </button>
      )}
    </div>
  )
}
