// Conteúdo do Capítulo 3 "O Andar Inteiro" (Tier 3, GDD §6).
import type { Contract } from '../../engine/contracts'
import type { SkillDef, Lesson } from '../content'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

// Grafo em diamante (Fase 5 suporta múltiplos pais), mesmo padrão do Cap. 2:
// arvores-decisao -> {metricas-avancadas, svm} -> regularizacao (exige as DUAS).
// Depois de Árvores (1º classificador novo do tier), o jogador segue por 2 caminhos
// independentes — avaliar QUALQUER classificador direito (Métricas) OU ver outra família de
// modelo (SVM) — e regularização fecha o tier exigindo as duas (GDD §12, spec §"Grafo").
export const SKILLS_CH3: SkillDef[] = [
  {
    id: 'arvores-decisao',
    nome: 'Árvores de Decisão',
    desc: 'Splits, impureza de Gini, profundidade e overfitting.',
    contractId: 'devolucoes-suspeitas',
    kataId: 'kata-arvores-decisao',
    prereqSkillIds: ['feature-engineering'],
  },
  {
    id: 'metricas-avancadas',
    nome: 'Métricas Avançadas',
    desc: 'Matriz de confusão, precisão, recall, F1.',
    contractId: 'diagnostico-risco-raro',
    kataId: 'kata-metricas-avancadas',
    prereqSkillIds: ['arvores-decisao'],
  },
  {
    id: 'svm',
    nome: 'SVM',
    desc: 'Margem máxima, vetores de suporte.',
    contractId: 'controle-qualidade-pecas',
    kataId: 'kata-svm',
    prereqSkillIds: ['arvores-decisao'],
  },
  {
    id: 'regularizacao',
    nome: 'Regularização',
    desc: 'L1/L2, viés-variância, Ridge/Lasso.',
    contractId: 'limite-credito-regularizado',
    kataId: 'kata-regularizacao',
    prereqSkillIds: ['metricas-avancadas', 'svm'],
  },
]

// ---------------------------------------------------------------- Setups Python
const SETUP_DEVOLUCOES = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["fraude"])
`

// Métricas: as DUAS fatias mantêm a coluna-alvo (a função avalia nas duas, como Validação).
const SETUP_DIAGNOSTICO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-15].reset_index(drop=True)
dados_teste = _ne_df.iloc[-15:].reset_index(drop=True)
`

const SETUP_PECAS = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["defeituosa"])
`

// Regularização: mesma convenção de Validação/Métricas (as duas fatias mantêm o alvo).
const SETUP_CREDITO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
dados_teste = _ne_df.iloc[-12:].reset_index(drop=True)
`
