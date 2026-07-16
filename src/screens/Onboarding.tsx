import { useState } from 'react'
import './Onboarding.css'

// Onboarding narrativo (GDD §2, §12): boot de terminal -> o tio excêntrico e a garagem,
// o bilhete escrito à mão, o primeiro cliente (Seu Joaquim), e a missão.
// Termina em "Entrar na garagem" -> onDone(). Assinatura de props CONGELADA.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const last = 3
  const next = () => setStep((s) => (s >= last ? (onDone(), s) : s + 1))

  return (
    <div className="onb-back">
      <div className="onb" role="group" aria-label="Introdução">
        <div className="onb-boot" aria-hidden="true">
          <span>&gt; neural_empire — inicializando…</span>
          <span>&gt; carregando garagem<span className="onb-cursor">_</span></span>
        </div>

        <div className="onb-stage" key={step}>
          {step === 0 && (
            <p className="onb-narr">
              Você herdou de um tio excêntrico uma garagem empoeirada — e um PC
              de 2012 que ainda funciona. Ninguém sabe direito no que ele
              trabalhava aqui.
            </p>
          )}

          {step === 1 && (
            <>
              <p className="onb-narr">Junto com as chaves veio um bilhete, escrito à mão:</p>
              <blockquote className="onb-note">
                “A IA vai mudar o mundo.
                <br />
                Aprenda antes que aprendam por você.”
                <cite className="onb-note-sig">— seu tio</cite>
              </blockquote>
            </>
          )}

          {step === 2 && (
            <p className="onb-narr">
              Não demora e batem à porta. São os clientes do bairro, cada um com
              um problema de dados. O primeiro é <strong>Seu Joaquim</strong>, da
              padaria: joga pão fora todo santo dia e está decidido a parar.
            </p>
          )}

          {step === 3 && (
            <p className="onb-narr">
              Sua missão: virar o maior laboratório de IA do mundo. Mas há uma
              regra — <strong>o jogo só avança quando VOCÊ aprende de verdade.</strong>
            </p>
          )}
        </div>

        <div className="onb-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i === step ? 'onb-dot is-on' : 'onb-dot'} />
          ))}
        </div>

        <div className="onb-actions">
          <button className="onb-cta" onClick={next}>
            {step === last ? 'Entrar na garagem' : 'Continuar'}
          </button>
          {step !== last && (
            <button className="onb-skip" onClick={onDone}>
              Pular
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
