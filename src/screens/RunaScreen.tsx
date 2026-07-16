import type { RuneKind } from '../nav'
import { RunaIntuicao } from './RunaIntuicao'
import { RunaMatematica } from './RunaMatematica'

const TITLE: Record<RuneKind, { emoji: string; nome: string; sub: string }> = {
  intuicao: { emoji: '◆', nome: 'Runa da Intuição', sub: 'Sinta o que o algoritmo faz — sem fórmula.' },
  matematica: { emoji: 'Σ', nome: 'Runa da Matemática', sub: 'Monte a ideia por trás do erro, peça a peça.' },
}

export function RunaScreen({
  kind,
  skillNome,
  onComplete,
}: {
  kind: RuneKind
  skillNome: string
  onComplete: () => void
}) {
  const t = TITLE[kind]
  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">
          {t.emoji} {t.nome}
        </h2>
        <p className="muted">
          {skillNome} · {t.sub}
        </p>
      </div>
      {kind === 'intuicao' ? (
        <RunaIntuicao onComplete={onComplete} />
      ) : (
        <RunaMatematica onComplete={onComplete} />
      )}
    </section>
  )
}
