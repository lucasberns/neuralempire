import { Box, Leds, type Hotspot, iso, pts } from './isoPrimitives'

// Mobília que é IDÊNTICA em qualquer sede (garagem, Sala Comercial, Andar Inteiro, Prédio, ...):
// rack de GPUs, mesa+monitor+PC, cadeira, personagem. O que muda por sala (paredes, porta,
// decoração, mesa do estagiário) fica em cada arquivo de cena, não aqui.
export function OfficeFurniture({
  level,
  onSelect,
}: {
  level: number
  onSelect: (h: Hotspot) => void
}) {
  return (
    <>
      {/* rack de GPUs (nível 2) — canto do fundo */}
      {level >= 2 && (
        <g>
          <Box x={0.3} y={0.3} z={0} w={0.85} d={0.85} h={2.05} tone="rack" />
          <Leds x={0.35} y={1.15} z={0.3} n={6} cls="led cyan" />
        </g>
      )}

      {/* prateleira com livros sobre a mesa */}
      <Box x={2.7} y={0} z={1.58} w={1.8} d={0.2} h={0.07} tone="desk" />
      <Box x={2.85} y={0.02} z={1.65} w={0.14} d={0.16} h={0.34} tone="book1" />
      <Box x={3.03} y={0.02} z={1.65} w={0.14} d={0.16} h={0.3} tone="book2" />
      <Box x={3.21} y={0.02} z={1.65} w={0.14} d={0.16} h={0.37} tone="book3" />
      <Box x={4.1} y={0.02} z={1.65} w={0.3} d={0.18} h={0.22} tone="crate" />

      {/* mesa encostada na parede A: tampo fino sobre duas pernas (vão visível embaixo) */}
      <Box x={2.42} y={0.17} z={0} w={0.1} d={0.1} h={0.68} tone="desk" />
      <Box x={4.85} y={0.17} z={0} w={0.1} d={0.1} h={0.68} tone="desk" />
      <Box x={2.4} y={0.15} z={0.68} w={2.6} d={0.78} h={0.14} tone="desk" />

      {/* monitor principal (brilho cresce com o nível) */}
      <g
        className="hot"
        onClick={() => onSelect('pc')}
        role="button"
        tabIndex={0}
        aria-label="Computador — abrir a bancada"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect('pc')
          }
        }}
      >
        {/* pé/base do monitor — mais estreito que a carcaça, dá sensação de "pescoço" */}
        <Box x={3.3} y={0.36} z={0.82} w={0.3} d={0.08} h={0.06} tone="mon" />
        <Box x={3.0} y={0.34} z={0.88} w={0.95} d={0.12} h={level >= 1 ? 0.7 : 0.56} tone="mon" />
        {/* carcaça sempre um retângulo simples; tela centralizada nela (margem
            igual nos 4 lados: 0.08 em x, 0.08 em z) — nada de deslocamento. */}
        <polygon
          className={`screen ${level >= 1 ? 'bright' : ''}`}
          points={pts(
            iso(3.08, 0.34, 0.96),
            iso(3.87, 0.34, 0.96),
            iso(3.87, 0.34, level >= 1 ? 1.5 : 1.36),
            iso(3.08, 0.34, level >= 1 ? 1.5 : 1.36),
          )}
        />
        {/* linhas de código "digitando" na tela */}
        <line
          className="code-line"
          x1={iso(3.15, 0.34, 1.3)[0]}
          y1={iso(3.15, 0.34, 1.3)[1]}
          x2={iso(3.62, 0.34, 1.3)[0]}
          y2={iso(3.62, 0.34, 1.3)[1]}
        />
        <line
          className="code-line slow"
          x1={iso(3.15, 0.34, 1.16)[0]}
          y1={iso(3.15, 0.34, 1.16)[1]}
          x2={iso(3.48, 0.34, 1.16)[0]}
          y2={iso(3.48, 0.34, 1.16)[1]}
        />
        {/* led de power na base do monitor */}
        <circle className="led" cx={iso(3.82, 0.34, 0.9)[0]} cy={iso(3.82, 0.34, 0.9)[1]} r={1.3} />
        {/* segundo monitor a partir do nível 1 */}
        {level >= 1 && (
          <>
            <Box x={4.05} y={0.34} z={0.82} w={0.8} d={0.12} h={0.6} tone="mon" />
            <polygon
              className="screen cyan"
              points={pts(iso(4.1, 0.34, 0.9), iso(4.8, 0.34, 0.9), iso(4.8, 0.34, 1.36), iso(4.1, 0.34, 1.36))}
            />
          </>
        )}
        <rect className="hit" x={288} y={74} width={62} height={46} />
      </g>

      {/* gabinete ao lado direito da mesa — evolui de torre simples p/ case melhor */}
      {level < 2 && (
        <g
          className="hot"
          onClick={() => onSelect('pc')}
          role="button"
          tabIndex={0}
          aria-label="Gabinete do computador — abrir a bancada"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect('pc')
            }
          }}
        >
          <Box
            x={5.05}
            y={0.3}
            z={0}
            w={0.4}
            d={0.42}
            h={level >= 1 ? 0.95 : 0.8}
            tone={level >= 1 ? 'tower2' : 'tower'}
          />
          {/* luz no centro-baixo da face frontal do gabinete (face frontal = y+d, não y) */}
          <Leds x={5.25} y={0.7} z={0.1} n={level >= 1 ? 3 : 1} cls={`led ${level >= 1 ? 'cyan' : ''}`} />
          <rect className="hit" x={326} y={120} width={32} height={58} />
        </g>
      )}

      {/* cadeira de escritório de verdade: assento fino + 4 pernas visíveis, sem encosto
          (removido a pedido) — não mais um bloco sólido só (parecia um pedestal, não uma
          cadeira). Assento cobre a pegada do personagem com folga em todos os lados
          (sem sobra flutuando); pernas vão do chão (z=0) até embaixo do assento. */}
      <g className="chair">
        {/* 4 pernas curtas (canto a canto, sob o assento) */}
        <Box x={3.23} y={1.08} z={0} w={0.07} d={0.07} h={0.38} tone="chair" />
        <Box x={3.59} y={1.08} z={0} w={0.07} d={0.07} h={0.38} tone="chair" />
        <Box x={3.23} y={1.34} z={0} w={0.07} d={0.07} h={0.38} tone="chair" />
        <Box x={3.59} y={1.34} z={0} w={0.07} d={0.07} h={0.38} tone="chair" />
        {/* travessas baixas ligando as pernas da frente e de trás, de cada lado
            (referência: cadeiras de verdade têm esse reforço horizontal) */}
        <Box x={3.23} y={1.08} z={0.12} w={0.07} d={0.33} h={0.05} tone="chair" />
        <Box x={3.59} y={1.08} z={0.12} w={0.07} d={0.33} h={0.05} tone="chair" />
        {/* assento: fino, pousado sobre as 4 pernas */}
        <Box x={3.15} y={1.0} z={0.38} w={0.6} d={0.5} h={0.08} tone="chair" />
      </g>

      {/* personagem (de costas, digitando — estilo GDT), com bob próprio.
          z começa no topo do assento (0.46) — a pegada da cadeira excede a do
          personagem em todos os lados, então não sobra nenhuma borda "flutuando". */}
      <g className="dev">
        <Box x={3.24} y={1.08} z={0.46} w={0.44} d={0.36} h={0.6} tone="person" />
        {/* capuz: uma única forma (sem cabeça separada) */}
        <circle className="dev-hood" cx={iso(3.46, 1.28, 1.25)[0]} cy={iso(3.46, 1.28, 1.25)[1]} r={7.2} />
      </g>
    </>
  )
}
