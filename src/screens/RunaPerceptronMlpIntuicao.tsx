import { useState } from 'react'
import './RunaPerceptronMlpIntuicao.css'

// Runa da Intuição de "perceptron-mlp" (Tier 5): regular quantos neurônios tem a camada
// escondida e ver a fronteira de decisão deixar de ser uma reta (que erra o padrão XOR de
// "desalinhados cancelam") pra virar uma curva que separa os 4 grupos corretamente. Toy
// pré-calibrado (não treina nada de verdade), mesmo espírito da runa de Random Forest.
// Props CONGELADAS.

type Grupo = { cx: number; cy: number; classe: 'cancela' | 'fica'; label: string }

// 4 grupos fixos nos 4 quadrantes (uso baixo/alto × valor baixo/alto) — coordenadas num
// viewBox 0-100. Cancela = desalinhado (uso alto+valor baixo OU uso baixo+valor alto).
const GRUPOS: readonly Grupo[] = [
  { cx: 22, cy: 78, classe: 'fica', label: 'uso baixo, valor baixo' },
  { cx: 22, cy: 22, classe: 'cancela', label: 'uso baixo, valor alto' },
  { cx: 78, cy: 78, classe: 'cancela', label: 'uso alto, valor baixo' },
  { cx: 78, cy: 22, classe: 'fica', label: 'uso alto, valor alto' },
]

// Pra cada nº de neurônios (0-3), quais grupos a fronteira classifica certo (pré-calibrado,
// geometria conferida contra as coordenadas de GRUPOS acima — não é só um número solto):
// - 0 (reta vertical x=50): separa os 4 pontos em 2 pares, cada par com 1 cancela + 1 fica —
//   o máximo que UMA reta consegue nesse padrão XOR é 2 de 4 certos, não importa a reta.
// - 1 (círculo pequeno em torno de só um dos 2 cantos "cancela"): pega esse canto certo, ainda
//   erra o outro canto cancela (fica de fora) — 3 de 4.
// - 2+ (elipse alongada na diagonal principal, cobrindo os 2 cantos "cancela" e excluindo os
//   2 cantos "fica" na diagonal oposta): separa os 4 certo.
const ACERTOS_POR_NEURONIO: Record<number, number> = { 0: 2, 1: 3, 2: 4, 3: 4 }

function estadoFronteira(neuronios: number): 'reta' | 'parcial' | 'curva' {
  if (neuronios === 0) return 'reta'
  if (neuronios === 1) return 'parcial'
  return 'curva'
}

export function RunaPerceptronMlpIntuicao({ onComplete }: { onComplete: () => void }) {
  const [neuronios, setNeuronios] = useState(0)
  const [solved, setSolved] = useState(false)

  const acertos = ACERTOS_POR_NEURONIO[neuronios]
  const estado = estadoFronteira(neuronios)
  const isGood = acertos === GRUPOS.length

  if (isGood && !solved) setSolved(true)

  return (
    <div className="runa runa-perceptron-mlp-intuicao">
      <p className="rpm-lead">
        Uma reta só divide o espaço em 2 — mas aqui quem cancela é quem tá "desalinhado" dos dois
        lados. Aumente os neurônios da camada escondida e veja a fronteira dobrar até separar os 4
        grupos certo.
      </p>

      <svg
        className="rpm-plano"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Plano de uso × valor, com fronteira de decisão"
      >
        <line x1="50" y1="0" x2="50" y2="100" className="rpm-eixo" />
        <line x1="0" y1="50" x2="100" y2="50" className="rpm-eixo" />
        {estado === 'reta' && (
          <line x1="50" y1="0" x2="50" y2="100" className="rpm-fronteira is-reta" />
        )}
        {estado === 'parcial' && (
          <circle cx={22} cy={22} r={20} className="rpm-fronteira is-parcial" />
        )}
        {estado === 'curva' && (
          <ellipse
            cx={50}
            cy={50}
            rx={48}
            ry={22}
            transform="rotate(45 50 50)"
            className="rpm-fronteira is-curva"
          />
        )}
        {GRUPOS.map((g, i) => (
          <circle key={i} cx={g.cx} cy={g.cy} r={6} className={`rpm-ponto is-${g.classe}`} />
        ))}
      </svg>

      <label className="rpm-slider">
        <span className="rpm-slider-top">
          <span>neurônios na camada escondida</span>
          <span className="rpm-val">{neuronios}</span>
        </span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={neuronios}
          aria-label="Número de neurônios na camada escondida"
          onChange={(e) => setNeuronios(Number(e.target.value))}
        />
      </label>

      <div className="rpm-meter" aria-live="polite">
        <p className={`rpm-resultado ${isGood ? 'is-good' : ''}`}>
          Grupos separados corretamente: <b>{acertos}</b> de {GRUPOS.length}
        </p>
        <p className="rpm-meter-hint">
          {isGood
            ? 'Com camada escondida, a rede dobra a fronteira e separa os desalinhados dos alinhados — isso é o que um Perceptron sozinho nunca consegue.'
            : neuronios === 0
              ? 'Com 0 neurônios na camada escondida, é só um Perceptron — uma reta só. Suba o slider.'
              : 'Quase lá — mais neurônios dão mais liberdade pra fronteira se curvar.'}
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
