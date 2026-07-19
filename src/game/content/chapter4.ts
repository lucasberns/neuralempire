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

// ---------------------------------------------------------------- Contratos (bosses)
export const CONTRACTS_CH4: Contract[] = [
  {
    id: 'retencao-assinantes',
    emoji: '🌲',
    titulo: 'SaaS RotaCerta',
    setor: 'tech',
    skillId: 'random-forest',
    briefing:
      'A RotaCerta quer parar de perder assinantes, mas não confia numa árvore só — uma decisão ' +
      'frágil pode custar caro. Combine várias árvores votando (bagging) pra prever cancelamento ' +
      'com mais robustez.',
    metaLabel: 'Acurácia ≥ 75% nos 12 clientes de entrega',
    payout: 620,
    reputacao: 20,
    prereqContractIds: ['limite-credito-regularizado'],
    datasetUrl: DATASET('retencao.csv'),
    starterCode: `from sklearn.ensemble import RandomForestClassifier

def prever_cancelamento_rf(dados_treino, dados_novos):
    # dados_treino: tabela com meses_uso, chamados_suporte, uso_mensal_gb e cancelou (0 ou 1)
    # dados_novos:  mesma tabela, MENOS a coluna cancelou
    #
    # 1. Separe X (colunas de entrada) e y (cancelou) de dados_treino
    # 2. Treine um RandomForestClassifier(n_estimators=100) — várias árvores votando
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_RETENCAO,
    tests: [
      {
        name: 'prever_cancelamento_rf(...) devolve um resultado',
        hidden: false,
        code: `_res = prever_cancelamento_rf(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão por cliente novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_cancelamento_rf(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(prever_cancelamento_rf(dados_treino, dados_novos)).ravel()
assert len(set(_res)) > 1, "O modelo previu sempre a mesma classe — não olhou pros dados"
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 75%)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(prever_cancelamento_rf(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["cancelou"].to_numpy()).mean())
assert _acc >= 0.75, f"acurácia = {_acc}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(prever_cancelamento_rf(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["cancelou"].to_numpy()).mean())
_ne_result = {
    "Acurácia na entrega": f"{round(_acc * 100)}%",
    "Meta do contrato": "≥ 75%",
}
`,
    hints: [
      'As colunas de entrada são meses_uso, chamados_suporte e uso_mensal_gb. O alvo é cancelou.',
      'X = dados_treino[["meses_uso", "chamados_suporte", "uso_mensal_gb"]] e y = dados_treino["cancelou"].',
      'modelo = RandomForestClassifier(n_estimators=100, random_state=0); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.ensemble import RandomForestClassifier

def prever_cancelamento_rf(dados_treino, dados_novos):
    colunas = ["meses_uso", "chamados_suporte", "uso_mensal_gb"]
    X = dados_treino[colunas]
    y = dados_treino["cancelou"]
    modelo = RandomForestClassifier(n_estimators=100, random_state=0)
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'Por que várias árvores votando tendem a ser mais robustas que uma árvore só?',
        options: [
          'Cada árvore vê uma amostra e um subconjunto de features diferente — o erro de uma tende a ser corrigido pelo voto das outras',
          'Mais árvores são sempre mais rápidas de treinar',
          'Não faz diferença nenhuma, é só estética',
        ],
        correct: 0,
      },
      {
        q: 'O que "bagging" significa aqui?',
        options: [
          'Cada árvore treina numa amostra bootstrap (com reposição) dos dados originais',
          'Empacotar o modelo final num arquivo',
          'Agrupar clientes parecidos antes de treinar',
        ],
        correct: 0,
      },
      {
        q: 'O que a "importância de uma feature" mede num Random Forest?',
        options: [
          'Quanto, em média, aquela variável ajudou a reduzir a impureza nos cortes de todas as árvores',
          'A ordem alfabética da coluna na tabela',
          'Se a coluna é numérica ou categórica',
        ],
        correct: 0,
      },
    ],
  },
]

// ---------------------------------------------------------------- Runa do Código (katas)
export const KATAS_CH4: Contract[] = [
  {
    id: 'kata-random-forest',
    emoji: '🔓',
    titulo: 'Kata · Random Forest',
    setor: 'tech',
    skillId: 'random-forest',
    briefing: 'Aquecimento antes da Prova: treine um RandomForestClassifier e devolva as previsões. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma previsão (0 ou 1) por cliente novo',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('retencao.csv'),
    starterCode: `from sklearn.ensemble import RandomForestClassifier

def prever(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = cancelou (de dados_treino)
    # 2. modelo = RandomForestClassifier(n_estimators=100).fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_RETENCAO,
    tests: [
      { name: 'Uma previsão por cliente novo', hidden: false, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'As previsões são 0 ou 1', hidden: true, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert set(np.unique(_r)).issubset({0, 1})\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\n_ne_result = {"Previsões feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["meses_uso", "chamados_suporte", "uso_mensal_gb"]. Alvo: "cancelou".',
      'X = dados_treino[colunas]; y = dados_treino["cancelou"].',
      'modelo = RandomForestClassifier(n_estimators=100, random_state=0); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.ensemble import RandomForestClassifier

def prever(dados_treino, dados_novos):
    colunas = ["meses_uso", "chamados_suporte", "uso_mensal_gb"]
    modelo = RandomForestClassifier(n_estimators=100, random_state=0)
    modelo.fit(dados_treino[colunas], dados_treino["cancelou"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
]

// ---------------------------------------------------------------- Aulas de código (ensino)
export const LESSONS_CH4: Record<string, Lesson> = {
  'kata-random-forest': {
    intro: 'Random Forest treina VÁRIAS árvores, cada uma numa amostra diferente dos dados, e a previsão final é o voto da maioria.',
    passos: [
      { code: 'from sklearn.ensemble import RandomForestClassifier', explica: 'Importa o modelo de floresta.' },
      { code: 'def prever(dados_treino, dados_novos):', explica: 'Recebe treino e os clientes novos.' },
      { code: '    colunas = ["meses_uso", "chamados_suporte", "uso_mensal_gb"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = RandomForestClassifier(n_estimators=100)', explica: 'Cria a floresta com 100 árvores.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["cancelou"])', explica: 'Treina todas as árvores de uma vez.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê pelo voto da maioria.' },
    ],
  },
  'retencao-assinantes': {
    intro: 'Mesmo ritual da runa, agora valendo: escolher colunas, criar a floresta, treinar e prever.',
    passos: [
      { code: 'from sklearn.ensemble import RandomForestClassifier', explica: 'Importa o modelo.' },
      { code: 'def prever_cancelamento_rf(dados_treino, dados_novos):', explica: 'Recebe treino e os clientes a prever.' },
      { code: '    colunas = ["meses_uso", "chamados_suporte", "uso_mensal_gb"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada.' },
      { code: '    y = dados_treino["cancelou"]', explica: 'y = o que queremos prever.' },
      { code: '    modelo = RandomForestClassifier(n_estimators=100, random_state=0)', explica: 'Cria a floresta.' },
      { code: '    modelo.fit(X, y)', explica: 'Treina com X e y.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê cancelamento pelo voto da maioria.' },
    ],
  },
}
