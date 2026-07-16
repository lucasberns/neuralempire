import { useState } from 'react'
import type { InterrogationQuestion } from '../engine/contracts'
import './Interrogatorio.css'

// Interrogatório do cliente (GDD §5.2): perguntas conceituais no fim do boss.
// Erros reduzem o pagamento — pega quem decorou sem entender.
export function Interrogatorio({
  questions,
  onFinish,
}: {
  questions: InterrogationQuestion[]
  onFinish: (scorePct: number) => void
}) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)

  const q = questions[i]
  if (!q) return null
  const answered = picked !== null

  function choose(opt: number) {
    if (answered) return
    setPicked(opt)
    if (opt === q.correct) setCorrect((c) => c + 1)
  }

  function next() {
    const last = i === questions.length - 1
    if (last) {
      onFinish(correct / questions.length)
      return
    }
    setI((n) => n + 1)
    setPicked(null)
  }

  return (
    <div className="itg-back">
      <div className="itg" role="dialog" aria-label="Interrogatório do cliente">
        <span className="itg-tag">Interrogatório · {i + 1}/{questions.length}</span>
        <p className="itg-q">{q.q}</p>
        <div className="itg-opts">
          {q.options.map((opt, idx) => {
            const state = !answered
              ? ''
              : idx === q.correct
                ? ' is-correct'
                : idx === picked
                  ? ' is-wrong'
                  : ''
            return (
              <button
                key={idx}
                className={`itg-opt${state}`}
                disabled={answered}
                onClick={() => choose(idx)}
              >
                {opt}
              </button>
            )
          })}
        </div>
        {answered && (
          <button className="itg-next" onClick={next}>
            {i === questions.length - 1 ? 'Entregar o trabalho →' : 'Próxima pergunta →'}
          </button>
        )}
      </div>
    </div>
  )
}
