import './Onboarding.css'

// Onboarding narrativo (GDD §2, §12): o tio excêntrico, o bilhete, a garagem herdada,
// o primeiro cliente batendo na porta. Termina levando o jogador ao primeiro contrato.
// STUB — preenchido por subagent. Assinatura de props CONGELADA.
export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="onb-back">
      <div className="onb">
        <h1 className="onb-title">Neural Empire</h1>
        <p>Você herdou a garagem do seu tio e um bilhete: "A IA vai mudar o mundo. Aprenda antes que aprendam por você."</p>
        <button className="onb-cta" onClick={onDone}>
          Começar
        </button>
      </div>
    </div>
  )
}
