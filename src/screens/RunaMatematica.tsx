import './RunaMatematica.css'

// Runa da Matemática (GDD §5.1, §5.4 tier 1 = visual): montar a ideia do erro
// quadrático arrastando peças (erro → quadrado → soma → minimizar), sem notação formal.
// STUB — preenchido por subagent. Assinatura de props CONGELADA.
export function RunaMatematica({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="runa runa-matematica">
      <p className="runa-lead">Monte a receita do erro na ordem certa.</p>
      <button className="runa-cta" onClick={onComplete}>
        Concluir runa da Matemática
      </button>
    </div>
  )
}
