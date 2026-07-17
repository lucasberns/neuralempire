import { useState } from 'react'
import type { InterrogationQuestion } from '../engine/contracts'
import './Interrogatorio.css'

// Embaralha (Fisher-Yates) — sem "chutar até acertar" e sem ordem/gabarito decorável (Fase 1).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function prepare(questions: InterrogationQuestion[]): InterrogationQuestion[] {
  return shuffle(questions).map((q) => {
    const opts = shuffle(q.options.map((text, idx) => ({ text, idx })))
    return {
      q: q.q,
      options: opts.map((o) => o.text),
      correct: opts.findIndex((o) => o.idx === q.correct),
    }
  })
}

// Interrogatório do cliente (GDD §5.2): perguntas conceituais no fim do boss.
// Acertar < ⅔ reprova; acima disso o acerto ainda escala o pagamento.
export function Interrogatorio({
  questions,
  onFinish,
}: {
  questions: InterrogationQuestion[]
  onFinish: (scorePct: number, wrongQuestions: string[]) => void
}) {
  const [deck] = useState(() => prepare(questions))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])

  const q = deck[i]
  if (!q) return null
  const answered = picked !== null

  function choose(opt: number) {
    if (answered) return
    setPicked(opt)
    if (opt === q.correct) setCorrect((c) => c + 1)
    else setWrong((w) => [...w, q.q])
  }

  function next() {
    const last = i === deck.length - 1
    if (last) {
      onFinish(correct / deck.length, wrong)
      return
    }
    setI((n) => n + 1)
    setPicked(null)
  }

  return (
    <div className="itg-back">
      <div className="itg" role="dialog" aria-label="Interrogatório do cliente">
        <span className="itg-tag">Interrogatório · {i + 1}/{deck.length}</span>
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
            {i === deck.length - 1 ? 'Entregar o trabalho →' : 'Próxima pergunta →'}
          </button>
        )}
      </div>
    </div>
  )
}
