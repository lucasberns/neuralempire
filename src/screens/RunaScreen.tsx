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
import { RunaRegressaoLogisticaIntuicao } from './RunaRegressaoLogisticaIntuicao'
import { RunaRegressaoLogisticaMatematica } from './RunaRegressaoLogisticaMatematica'
import { RunaKnnIntuicao } from './RunaKnnIntuicao'
import { RunaKnnMatematica } from './RunaKnnMatematica'
import { RunaValidacaoIntuicao } from './RunaValidacaoIntuicao'
import { RunaValidacaoMatematica } from './RunaValidacaoMatematica'
import { RunaFeatureEngineeringIntuicao } from './RunaFeatureEngineeringIntuicao'
import { RunaFeatureEngineeringMatematica } from './RunaFeatureEngineeringMatematica'
import { RunaArvoresDecisaoIntuicao } from './RunaArvoresDecisaoIntuicao'
import { RunaArvoresDecisaoMatematica } from './RunaArvoresDecisaoMatematica'
import { RunaMetricasAvancadasIntuicao } from './RunaMetricasAvancadasIntuicao'
import { RunaMetricasAvancadasMatematica } from './RunaMetricasAvancadasMatematica'
import { RunaSvmIntuicao } from './RunaSvmIntuicao'
import { RunaSvmMatematica } from './RunaSvmMatematica'
import { RunaRegularizacaoIntuicao } from './RunaRegularizacaoIntuicao'
import { RunaRegularizacaoMatematica } from './RunaRegularizacaoMatematica'
import { RunaRandomForestIntuicao } from './RunaRandomForestIntuicao'
import { RunaRandomForestMatematica } from './RunaRandomForestMatematica'
import { RunaGradientBoostingIntuicao } from './RunaGradientBoostingIntuicao'
import { RunaGradientBoostingMatematica } from './RunaGradientBoostingMatematica'
import { RunaClusteringIntuicao } from './RunaClusteringIntuicao'
import { RunaClusteringMatematica } from './RunaClusteringMatematica'
import { RunaReducaoDimensionalidadeIntuicao } from './RunaReducaoDimensionalidadeIntuicao'
import { RunaReducaoDimensionalidadeMatematica } from './RunaReducaoDimensionalidadeMatematica'
import { RunaPerceptronMlpIntuicao } from './RunaPerceptronMlpIntuicao'
import { RunaPerceptronMlpMatematica } from './RunaPerceptronMlpMatematica'
import { RunaBackpropagationIntuicao } from './RunaBackpropagationIntuicao'
import { RunaBackpropagationMatematica } from './RunaBackpropagationMatematica'

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
  'regressao-logistica': { intuicao: RunaRegressaoLogisticaIntuicao, matematica: RunaRegressaoLogisticaMatematica },
  knn: { intuicao: RunaKnnIntuicao, matematica: RunaKnnMatematica },
  validacao: { intuicao: RunaValidacaoIntuicao, matematica: RunaValidacaoMatematica },
  'feature-engineering': { intuicao: RunaFeatureEngineeringIntuicao, matematica: RunaFeatureEngineeringMatematica },
  'arvores-decisao': { intuicao: RunaArvoresDecisaoIntuicao, matematica: RunaArvoresDecisaoMatematica },
  'metricas-avancadas': { intuicao: RunaMetricasAvancadasIntuicao, matematica: RunaMetricasAvancadasMatematica },
  svm: { intuicao: RunaSvmIntuicao, matematica: RunaSvmMatematica },
  regularizacao: { intuicao: RunaRegularizacaoIntuicao, matematica: RunaRegularizacaoMatematica },
  'random-forest': { intuicao: RunaRandomForestIntuicao, matematica: RunaRandomForestMatematica },
  'gradient-boosting': { intuicao: RunaGradientBoostingIntuicao, matematica: RunaGradientBoostingMatematica },
  clustering: { intuicao: RunaClusteringIntuicao, matematica: RunaClusteringMatematica },
  'reducao-dimensionalidade': { intuicao: RunaReducaoDimensionalidadeIntuicao, matematica: RunaReducaoDimensionalidadeMatematica },
  'perceptron-mlp': { intuicao: RunaPerceptronMlpIntuicao, matematica: RunaPerceptronMlpMatematica },
  backpropagation: { intuicao: RunaBackpropagationIntuicao, matematica: RunaBackpropagationMatematica },
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
