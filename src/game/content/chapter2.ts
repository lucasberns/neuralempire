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

// ---------------------------------------------------------------- Contratos (bosses)
export const CONTRACTS_CH2: Contract[] = [
  {
    id: 'previsao-cancelamento',
    emoji: '📉',
    titulo: 'Assinatura StreamPlus',
    setor: 'tech',
    skillId: 'regressao-logistica',
    briefing:
      'A StreamPlus quer saber quais assinantes vão cancelar no próximo mês. Você tem o ' +
      'histórico de 60 clientes: há quanto tempo usam o serviço e quantos chamados abriram no ' +
      'suporte. Preveja quem vai cancelar (1) e quem vai ficar (0).',
    metaLabel: 'Acurácia ≥ 75% nos 12 clientes de entrega',
    payout: 480,
    reputacao: 14,
    prereqContractIds: ['previsao-padaria'],
    datasetUrl: DATASET('assinaturas.csv'),
    starterCode: `from sklearn.linear_model import LogisticRegression

def prever_cancelamento(dados_treino, dados_novos):
    # dados_treino: tabela com meses_uso, chamados_suporte e cancelou (0 ou 1)
    # dados_novos:  mesma tabela, MENOS a coluna cancelou
    #
    # 1. Separe X (colunas de entrada) e y (cancelou) de dados_treino
    # 2. Treine um LogisticRegression com X e y
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_CLASSIFICACAO_CANCELAMENTO,
    tests: [
      {
        name: 'prever_cancelamento(...) devolve um resultado',
        hidden: false,
        code: `_res = prever_cancelamento(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão por cliente novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_cancelamento(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'As previsões são 0 ou 1',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_cancelamento(dados_treino, dados_novos)).ravel()
assert set(np.unique(_res)).issubset({0, 1}), "As previsões deveriam ser só 0 (fica) ou 1 (cancela)"
`,
      },
      {
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(prever_cancelamento(dados_treino, dados_novos)).ravel()
assert len(set(_res)) > 1
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 75%)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(prever_cancelamento(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["cancelou"].to_numpy()).mean())
assert _acc >= 0.75, f"acurácia = {_acc}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(prever_cancelamento(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["cancelou"].to_numpy()).mean())
_ne_result = {
    "Acurácia na entrega": f"{round(_acc * 100)}%",
    "Meta do contrato": "≥ 75%",
    "Cancelamentos previstos": int(_pred.sum()),
}
`,
    hints: [
      'As colunas de entrada são meses_uso e chamados_suporte. O alvo é cancelou.',
      'X = dados_treino[["meses_uso", "chamados_suporte"]] e y = dados_treino["cancelou"].',
      'Crie o modelo com LogisticRegression(), treine com modelo.fit(X, y) e preveja com modelo.predict(dados_novos).',
    ],
    solution: `from sklearn.linear_model import LogisticRegression

def prever_cancelamento(dados_treino, dados_novos):
    colunas = ["meses_uso", "chamados_suporte"]
    X = dados_treino[colunas]
    y = dados_treino["cancelou"]
    modelo = LogisticRegression()
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'Cliente: "o modelo diz 1 ou 0 — isso é uma certeza?"',
        options: [
          'Por baixo dos panos é uma probabilidade; o modelo aplica um limiar (ex.: 0,5) pra virar decisão',
          'Sim, é sempre 100% certo',
          'É só um palpite aleatório',
        ],
        correct: 0,
      },
      {
        q: 'Por que separar clientes de treino dos clientes de entrega?',
        options: [
          'Pra testar o modelo em gente que ele nunca viu e saber se ele generaliza de verdade',
          'Pra treinar mais rápido',
          'Não faz diferença, é só formalidade',
        ],
        correct: 0,
      },
      {
        q: 'O modelo acertou 100% no treino mas errou bastante na entrega. O que houve?',
        options: [
          'Decorou os exemplos de treino em vez de aprender o padrão (overfitting)',
          'A entrega veio com dados corrompidos',
          'Regressão logística nunca erra',
        ],
        correct: 0,
      },
    ],
  },
]

// ---------------------------------------------------------------- Runa do Código (katas)
export const KATAS_CH2: Contract[] = [
  {
    id: 'kata-regressao-logistica',
    emoji: '🔓',
    titulo: 'Kata · Regressão Logística',
    setor: 'tech',
    skillId: 'regressao-logistica',
    briefing: 'Aquecimento antes da Prova: treine um LogisticRegression e devolva as previsões para os clientes novos. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma previsão (0 ou 1) por cliente novo',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('assinaturas.csv'),
    starterCode: `from sklearn.linear_model import LogisticRegression

def prever(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = cancelou (de dados_treino)
    # 2. modelo = LogisticRegression().fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_CLASSIFICACAO_CANCELAMENTO,
    tests: [
      { name: 'Uma previsão por cliente novo', hidden: false, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'As previsões são 0 ou 1', hidden: true, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert set(np.unique(_r)).issubset({0, 1})\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\n_ne_result = {"Previsões feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["meses_uso", "chamados_suporte"]. Alvo: "cancelou".',
      'X = dados_treino[colunas]; y = dados_treino["cancelou"].',
      'modelo = LogisticRegression(); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.linear_model import LogisticRegression

def prever(dados_treino, dados_novos):
    colunas = ["meses_uso", "chamados_suporte"]
    modelo = LogisticRegression()
    modelo.fit(dados_treino[colunas], dados_treino["cancelou"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
]

// ---------------------------------------------------------------- Aulas de código (ensino)
export const LESSONS_CH2: Record<string, Lesson> = {
  'kata-regressao-logistica': {
    intro: 'Mesmo ritual de sempre: escolher colunas, criar o modelo, treinar (.fit) e prever (.predict) — só troca o modelo de regressão pelo de classificação.',
    passos: [
      { code: 'from sklearn.linear_model import LogisticRegression', explica: 'Importa o modelo de classificação.' },
      { code: 'def prever(dados_treino, dados_novos):', explica: 'Recebe treino e os clientes novos.' },
      { code: '    colunas = ["meses_uso", "chamados_suporte"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = LogisticRegression()', explica: 'Cria o modelo (vazio).' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["cancelou"])', explica: 'Treina com as colunas de entrada e o alvo (cancelou).' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê 0 ou 1 pros clientes novos.' },
    ],
  },
  'previsao-cancelamento': {
    intro: 'Mesmo ritual da runa, agora valendo: escolher colunas, criar, treinar e prever.',
    passos: [
      { code: 'from sklearn.linear_model import LogisticRegression', explica: 'Importa o modelo.' },
      { code: 'def prever_cancelamento(dados_treino, dados_novos):', explica: 'Recebe treino e os clientes a prever.' },
      { code: '    colunas = ["meses_uso", "chamados_suporte"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada.' },
      { code: '    y = dados_treino["cancelou"]', explica: 'y = o que queremos prever.' },
      { code: '    modelo = LogisticRegression()', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(X, y)', explica: 'Treina com X e y.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê cancelamento dos clientes novos.' },
    ],
  },
}

