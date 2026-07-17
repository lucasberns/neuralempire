import type { ComponentType } from 'react'
import type { RuneKind } from '../nav'
import { RunaLerIntuicao } from './RunaLerIntuicao'
import { RunaLerMatematica } from './RunaLerMatematica'
import { RunaExplorarIntuicao } from './RunaExplorarIntuicao'
import { RunaExplorarMatematica } from './RunaExplorarMatematica'
import { RunaLimparIntuicao } from './RunaLimparIntuicao'
import { RunaLimparMatematica } from './RunaLimparMatematica'
import { RunaRegressaoIntuicao } from './RunaRegressaoIntuicao'
import { RunaRegressaoMatematica } from './RunaRegressaoMatematica'

const TITLE: Record<RuneKind, { emoji: string; nome: string; sub: string }> = {
  intuicao: { emoji: '◆', nome: 'Runa da Intuição', sub: 'Sinta o que o algoritmo faz — sem fórmula.' },
  matematica: { emoji: 'Σ', nome: 'Runa da Matemática', sub: 'Monte a ideia por trás do erro, peça a peça.' },
}

type RunaComponent = ComponentType<{ onComplete: () => void }>

const RUNAS: Record<string, Partial<Record<RuneKind, RunaComponent>>> = {
  ler: { intuicao: RunaLerIntuicao, matematica: RunaLerMatematica },
  explorar: { intuicao: RunaExplorarIntuicao, matematica: RunaExplorarMatematica },
  limpar: { intuicao: RunaLimparIntuicao, matematica: RunaLimparMatematica },
  regressao: { intuicao: RunaRegressaoIntuicao, matematica: RunaRegressaoMatematica },
}

export function RunaScreen({
  skillId,
  kind,
  skillNome,
  onComplete,
}: {
  skillId: string
  kind: RuneKind
  skillNome: string
  onComplete: () => void
}) {
  const t = TITLE[kind]
  const Comp = RUNAS[skillId]?.[kind]
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
      {Comp ? (
        <Comp onComplete={onComplete} />
      ) : (
        <p className="muted">Runa ainda não disponível para esta skill.</p>
      )}
    </section>
  )
}
