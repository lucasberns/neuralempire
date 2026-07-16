import './RunaIntuicao.css'

// Runa da Intuição (GDD §5.1): visualização interativa — arrastar uma reta sobre
// os pontos e ver o erro (barras vermelhas) mudar em tempo real; concluir quando o
// erro fica abaixo de um limiar; botão "deixar o computador ajustar" mostra o fit ótimo.
// STUB — preenchido por subagent. Assinatura de props CONGELADA.
export function RunaIntuicao({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="runa runa-intuicao">
      <p className="runa-lead">Ajuste a reta até o erro ficar pequeno.</p>
      <button className="runa-cta" onClick={onComplete}>
        Concluir runa da Intuição
      </button>
    </div>
  )
}
