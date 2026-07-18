// Conteúdo do Capítulo 2 "A Sala Comercial" (Tier 2, GDD §6).
import type { Contract } from '../../engine/contracts'
import type { SkillDef, Lesson } from '../content'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

// Grafo em diamante (Fase 5 suporta múltiplos pais): regressao -> {regressao-logistica, knn}
// -> validacao -> feature-engineering. `validacao` só libera depois de dominar as DUAS anteriores —
// a skill literalmente nomeia o overfitting/underfitting que o jogador já sentiu construindo os
// dois modelos (GDD §5.2/§7.1), então exigir as duas reforça a progressão em vez de ser arbitrário.
export const SKILLS_CH2: SkillDef[] = [
  {
    id: 'regressao-logistica',
    nome: 'Regressão Logística',
    desc: 'Probabilidade, fronteira de decisão, acurácia.',
    contractId: 'previsao-cancelamento',
    kataId: 'kata-regressao-logistica',
    prereqSkillIds: ['regressao'],
  },
  {
    id: 'knn',
    nome: 'KNN',
    desc: 'Distância, vizinhança, efeito do k.',
    contractId: 'classificacao-imoveis',
    kataId: 'kata-knn',
    prereqSkillIds: ['regressao'],
  },
  {
    id: 'validacao',
    nome: 'Validação',
    desc: 'Holdout, overfitting e underfitting.',
    contractId: 'diagnostico-inadimplencia',
    kataId: 'kata-validacao',
    prereqSkillIds: ['regressao-logistica', 'knn'],
  },
  {
    id: 'feature-engineering',
    nome: 'Feature Engineering',
    desc: 'Encoding categórico e escalas.',
    contractId: 'preparo-features-academia',
    kataId: 'kata-feature-engineering',
    prereqSkillIds: ['validacao'],
  },
]

// ---------------------------------------------------------------- Setups Python
const SETUP_CLASSIFICACAO_CANCELAMENTO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["cancelou"])
`

const SETUP_CLASSIFICACAO_IMOVEIS = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["categoria"])
`

// Validação: as DUAS fatias mantêm a coluna-alvo (a função precisa avaliar nas duas, não só prever).
const SETUP_VALIDACAO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
dados_teste = _ne_df.iloc[-12:].reset_index(drop=True)
`

const SETUP_LER_ACADEMIA = `import io
import pandas as pd
dados = pd.read_csv(io.StringIO(_ne_csv))
`
