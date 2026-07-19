// Conteúdo do Capítulo 4 "O Prédio" (Tier 4, GDD §6).
import type { Contract } from '../../engine/contracts'
import type { SkillDef, Lesson } from '../content'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

// Grafo em diamante (mesmo padrão dos Cap. 2/3): random-forest -> {gradient-boosting, clustering}
// -> reducao-dimensionalidade (exige as DUAS). Clustering é a 1ª skill não supervisionada do
// currículo — merece caminho próprio, não continuação linear de ensembles (spec §"Grafo").
export const SKILLS_CH4: SkillDef[] = [
  {
    id: 'random-forest',
    nome: 'Random Forest',
    desc: 'Bagging, votação de árvores, importância de features.',
    contractId: 'retencao-assinantes',
    kataId: 'kata-random-forest',
    prereqSkillIds: ['regularizacao'],
  },
  {
    id: 'gradient-boosting',
    nome: 'Gradient Boosting',
    desc: 'Boosting sequencial, correção de resíduo.',
    contractId: 'deteccao-fraude-transacoes',
    kataId: 'kata-gradient-boosting',
    prereqSkillIds: ['random-forest'],
  },
  {
    id: 'clustering',
    nome: 'Clustering',
    desc: 'Agrupar sem rótulo, K-means, silhueta.',
    contractId: 'segmentacao-clientes',
    kataId: 'kata-clustering',
    prereqSkillIds: ['random-forest'],
  },
  {
    id: 'reducao-dimensionalidade',
    nome: 'Redução de Dimensionalidade',
    desc: 'PCA, variância explicada, visualização.',
    contractId: 'reducao-biomarcadores',
    kataId: 'kata-reducao-dimensionalidade',
    prereqSkillIds: ['gradient-boosting', 'clustering'],
  },
]

// ---------------------------------------------------------------- Setups Python
const SETUP_RETENCAO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["cancelou"])
`

const SETUP_TRANSACOES = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["fraude"])
`

// Clustering/PCA: NÃO supervisionados — só "dados", sem split treino/holdout (GDD §7.2,
// "contratos sem gabarito"). A avaliação (silhueta/variância) roda sobre o próprio "dados".
const SETUP_CLIENTES = `import io
import pandas as pd
dados = pd.read_csv(io.StringIO(_ne_csv))
`

const SETUP_BIOMARCADORES = `import io
import pandas as pd
dados = pd.read_csv(io.StringIO(_ne_csv))
`
