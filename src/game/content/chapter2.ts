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
  {
    id: 'classificacao-imoveis',
    emoji: '🏠',
    titulo: 'Imobiliária Bairro Novo',
    setor: 'industria',
    skillId: 'knn',
    briefing:
      'A imobiliária tem um imóvel novo no catálogo e não sabe em qual faixa de preço anunciar: ' +
      'popular, médio ou alto. Comparando com os imóveis parecidos já vendidos (área e distância ' +
      'do centro), classifique o imóvel novo pela categoria mais provável.',
    metaLabel: 'Acurácia ≥ 75% nos 12 imóveis de entrega',
    payout: 480,
    reputacao: 14,
    prereqContractIds: ['previsao-padaria'],
    datasetUrl: DATASET('imoveis.csv'),
    starterCode: `from sklearn.neighbors import KNeighborsClassifier

def classificar_imovel(dados_treino, dados_novos):
    # dados_treino: tabela com area_m2, distancia_centro_km e categoria (popular/medio/alto)
    # dados_novos:  mesma tabela, MENOS a coluna categoria
    #
    # 1. Separe X (colunas de entrada) e y (categoria) de dados_treino
    # 2. Treine um KNeighborsClassifier com X e y
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_CLASSIFICACAO_IMOVEIS,
    tests: [
      {
        name: 'classificar_imovel(...) devolve um resultado',
        hidden: false,
        code: `_res = classificar_imovel(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão por imóvel novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_imovel(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'As categorias previstas são válidas',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_imovel(dados_treino, dados_novos)).ravel()
assert set(_res).issubset({"popular", "medio", "alto"}), "Categoria fora do esperado"
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 75%)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(classificar_imovel(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["categoria"].to_numpy()).mean())
assert _acc >= 0.75, f"acurácia = {_acc}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(classificar_imovel(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["categoria"].to_numpy()).mean())
_ne_result = {
    "Acurácia na entrega": f"{round(_acc * 100)}%",
    "Meta do contrato": "≥ 75%",
}
`,
    hints: [
      'As colunas de entrada são area_m2 e distancia_centro_km. O alvo é categoria.',
      'X = dados_treino[["area_m2", "distancia_centro_km"]] e y = dados_treino["categoria"].',
      'Crie o modelo com KNeighborsClassifier(n_neighbors=5), treine com .fit(X, y) e preveja com .predict(dados_novos).',
    ],
    solution: `from sklearn.neighbors import KNeighborsClassifier

def classificar_imovel(dados_treino, dados_novos):
    colunas = ["area_m2", "distancia_centro_km"]
    X = dados_treino[colunas]
    y = dados_treino["categoria"]
    modelo = KNeighborsClassifier(n_neighbors=5)
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'O que o "k" do KNN controla?',
        options: [
          'Quantos vizinhos mais próximos o modelo consulta antes de decidir a categoria',
          'Quantas colunas o modelo usa',
          'Quantas vezes o modelo repete o treino',
        ],
        correct: 0,
      },
      {
        q: 'Por que k=1 costuma ser arriscado?',
        options: [
          'O modelo copia o vizinho mais próximo — qualquer ruído vira erro (overfitting)',
          'k=1 é sempre o mais rápido e mais seguro',
          'k=1 obriga a usar mais colunas',
        ],
        correct: 0,
      },
      {
        q: 'Cliente: "por que separar imóveis de treino dos de entrega?"',
        options: [
          'Pra testar o modelo em imóveis que ele nunca viu e saber se ele generaliza',
          'Pra treinar mais rápido',
          'Não faz diferença',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'diagnostico-inadimplencia',
    emoji: '🔍',
    titulo: 'Fintech CréditoJá',
    setor: 'financas',
    skillId: 'validacao',
    briefing:
      'A CréditoJá tem um modelo de risco de crédito que "funcionava perfeitamente" nos testes ' +
      'internos, mas está errando feio com clientes reais. Antes de confiarem nele de novo, o ' +
      'cliente quer um diagnóstico: meça o desempenho do modelo tanto nos dados de treino quanto ' +
      'em dados que ele nunca viu, e mostre a diferença.',
    metaLabel: 'Medir corretamente a acurácia de treino e de teste (sem vazar dados)',
    payout: 500,
    reputacao: 15,
    prereqContractIds: ['previsao-cancelamento', 'classificacao-imoveis'],
    datasetUrl: DATASET('financas.csv'),
    starterCode: `from sklearn.tree import DecisionTreeClassifier

def avaliar_modelo(dados_treino, dados_teste):
    # dados_treino / dados_teste: mesmas colunas (renda, divida, score_credito, inadimplente)
    #
    # 1. Treine um DecisionTreeClassifier() usando SÓ dados_treino
    # 2. Calcule a acurácia do modelo em dados_treino (modelo.score(...))
    # 3. Calcule a acurácia do modelo em dados_teste (modelo.score(...))
    # 4. Devolva os dois números: (acuracia_treino, acuracia_teste)
    ...
`,
    setupCode: SETUP_VALIDACAO,
    tests: [
      {
        name: 'avaliar_modelo(...) devolve dois valores',
        hidden: false,
        code: `_res = avaliar_modelo(dados_treino, dados_teste)
assert len(_res) == 2, "Esperava (acuracia_treino, acuracia_teste)"
`,
      },
      {
        name: 'Os dois valores são proporções válidas (entre 0 e 1)',
        hidden: false,
        code: `_a, _b = avaliar_modelo(dados_treino, dados_teste)
assert 0.0 <= float(_a) <= 1.0 and 0.0 <= float(_b) <= 1.0, "Acurácia deve estar entre 0 e 1"
`,
      },
      {
        name: 'Teste oculto: a acurácia de treino bate certo (o modelo decorou)',
        hidden: true,
        code: `_a, _b = avaliar_modelo(dados_treino, dados_teste)
assert float(_a) >= 0.9, f"acurácia de treino = {_a} — parece que não treinou em dados_treino"
`,
      },
      {
        name: 'Teste oculto: o gap treino-teste mostra o overfitting real',
        hidden: true,
        code: `_a, _b = avaliar_modelo(dados_treino, dados_teste)
_gap = float(_a) - float(_b)
assert _gap >= 0.15, f"gap = {_gap} — parece que dados_teste não foi avaliado de verdade (ou houve vazamento)"
`,
      },
    ],
    metricsCode: `_a, _b = avaliar_modelo(dados_treino, dados_teste)
_ne_result = {
    "Acurácia no treino": f"{round(float(_a) * 100)}%",
    "Acurácia no teste": f"{round(float(_b) * 100)}%",
    "Diagnóstico": "Overfitting" if float(_a) - float(_b) >= 0.15 else "Generalização razoável",
}
`,
    hints: [
      'colunas = ["renda", "divida", "score_credito"]; alvo = "inadimplente".',
      'modelo = DecisionTreeClassifier(); modelo.fit(dados_treino[colunas], dados_treino["inadimplente"]).',
      'modelo.score(X, y) já devolve a acurácia direto — chame uma vez com dados_treino e outra com dados_teste.',
    ],
    solution: `from sklearn.tree import DecisionTreeClassifier

def avaliar_modelo(dados_treino, dados_teste):
    colunas = ["renda", "divida", "score_credito"]
    modelo = DecisionTreeClassifier(random_state=0)
    modelo.fit(dados_treino[colunas], dados_treino["inadimplente"])
    acc_treino = modelo.score(dados_treino[colunas], dados_treino["inadimplente"])
    acc_teste = modelo.score(dados_teste[colunas], dados_teste["inadimplente"])
    return acc_treino, acc_teste
`,
    interrogation: [
      {
        q: 'Por que a acurácia no treino sozinha não prova que o modelo é bom?',
        options: [
          'O modelo pode ter só decorado os exemplos de treino, sem aprender o padrão de verdade',
          'Acurácia de treino é sempre a métrica mais confiável',
          'Não existe diferença entre acurácia de treino e de teste',
        ],
        correct: 0,
      },
      {
        q: 'O que overfitting significa na prática?',
        options: [
          'O modelo vai bem nos dados que já viu, mas vai mal em dados novos',
          'O modelo é rápido demais',
          'O modelo usa poucas colunas',
        ],
        correct: 0,
      },
      {
        q: 'Por que medir em dados_teste (que o modelo nunca viu no fit) e não só em dados_treino de novo?',
        options: [
          'Porque só assim descobrimos se o modelo generaliza pra clientes reais, não só pros que ele decorou',
          'Porque dados_teste é sempre mais fácil',
          'Não faz diferença nenhuma',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'preparo-features-academia',
    emoji: '🏋️',
    titulo: 'Rede de Academias FitBairro',
    setor: 'saude',
    skillId: 'feature-engineering',
    briefing:
      'A FitBairro tem uma planilha de alunos bagunçada pra qualquer modelo: a cidade vem como ' +
      'texto e a idade e o faturamento estão em escalas bem diferentes. Prepare a tabela — sem ' +
      'isso, nenhum modelo vai rodar direito nela.',
    metaLabel: 'Cidade codificada em colunas + idade/faturamento em escalas comparáveis',
    payout: 460,
    reputacao: 14,
    prereqContractIds: ['diagnostico-inadimplencia'],
    datasetUrl: DATASET('academias.csv'),
    starterCode: `import pandas as pd
from sklearn.preprocessing import StandardScaler

def preparar_features(dados):
    # dados: tabela com cidade (texto), idade e faturamento (escalas bem diferentes)
    #
    # 1. Transforme a coluna 'cidade' em colunas 0/1, uma por cidade (pd.get_dummies)
    # 2. Reescale 'idade' e 'faturamento' pra ficarem em escalas comparáveis (StandardScaler)
    # 3. Devolva a tabela transformada
    ...
`,
    setupCode: SETUP_LER_ACADEMIA,
    tests: [
      {
        name: 'preparar_features(...) devolve um resultado',
        hidden: false,
        code: `_res = preparar_features(dados)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: "A coluna 'cidade' não aparece mais como texto",
        hidden: false,
        code: `_res = preparar_features(dados)
assert "cidade" not in _res.columns, "cidade deveria ter virado colunas 0/1, uma por cidade"
`,
      },
      {
        name: 'Teste oculto: uma coluna nova pra cada cidade',
        hidden: true,
        code: `_res = preparar_features(dados)
_esperado = len(dados.columns) - 1 + dados["cidade"].nunique()
assert len(_res.columns) == _esperado, f"esperava {_esperado} colunas, veio {len(_res.columns)}"
`,
      },
      {
        name: 'Teste oculto: idade e faturamento ficam em escalas comparáveis',
        hidden: true,
        code: `_res = preparar_features(dados)
_dif = abs(float(_res["idade"].std()) - float(_res["faturamento"].std()))
assert _dif < 0.2, f"diferença de escala = {_dif} — as duas colunas deveriam ter espalhamento parecido"
`,
      },
    ],
    metricsCode: `_res = preparar_features(dados)
_ne_result = {
    "Colunas antes": int(len(dados.columns)),
    "Colunas depois": int(len(_res.columns)),
    "Cidades codificadas": int(dados["cidade"].nunique()),
}
`,
    hints: [
      "pd.get_dummies(dados, columns=['cidade']) transforma a coluna de texto em colunas 0/1.",
      'StandardScaler().fit_transform(tabela[["idade", "faturamento"]]) reescala as duas colunas juntas.',
      'Você pode fazer o encoding primeiro, guardar numa variável, e então sobrescrever as colunas idade/faturamento dela com o resultado do scaler.',
    ],
    solution: `import pandas as pd
from sklearn.preprocessing import StandardScaler

def preparar_features(dados):
    codificado = pd.get_dummies(dados, columns=["cidade"])
    escalador = StandardScaler()
    codificado[["idade", "faturamento"]] = escalador.fit_transform(codificado[["idade", "faturamento"]])
    return codificado
`,
    interrogation: [
      {
        q: 'Por que transformar "cidade" (texto) em colunas 0/1 em vez de deixar como está?',
        options: [
          'A maioria dos modelos só entende números, não texto',
          'É só estética, não muda nada pro modelo',
          'Porque texto ocupa mais espaço em disco',
        ],
        correct: 0,
      },
      {
        q: 'Por que colocar idade e faturamento na mesma escala?',
        options: [
          'Senão a coluna com números maiores (faturamento) domina o modelo só pelo tamanho, não pela importância real',
          'Pra deixar a tabela mais bonita',
          'Não faz diferença pra nenhum modelo',
        ],
        correct: 0,
      },
      {
        q: 'O que muda de verdade nos dados quando você reescala uma coluna?',
        options: [
          'Só o espalhamento/unidade dos números — a ordem relativa entre os alunos continua a mesma',
          'Os valores de cada aluno passam a representar outra pessoa',
          'A coluna deixa de existir',
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
  {
    id: 'kata-knn',
    emoji: '🔓',
    titulo: 'Kata · KNN',
    setor: 'industria',
    skillId: 'knn',
    briefing: 'Aquecimento antes da Prova: treine um KNeighborsClassifier e devolva as previsões para os imóveis novos. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma categoria por imóvel novo',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('imoveis.csv'),
    starterCode: `from sklearn.neighbors import KNeighborsClassifier

def classificar(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = categoria (de dados_treino)
    # 2. modelo = KNeighborsClassifier(n_neighbors=5).fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_CLASSIFICACAO_IMOVEIS,
    tests: [
      { name: 'Uma previsão por imóvel novo', hidden: false, code: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'Categorias válidas', hidden: true, code: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\nassert set(_r).issubset({"popular","medio","alto"})\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\n_ne_result = {"Previsões feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["area_m2", "distancia_centro_km"]. Alvo: "categoria".',
      'X = dados_treino[colunas]; y = dados_treino["categoria"].',
      'modelo = KNeighborsClassifier(n_neighbors=5); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.neighbors import KNeighborsClassifier

def classificar(dados_treino, dados_novos):
    colunas = ["area_m2", "distancia_centro_km"]
    modelo = KNeighborsClassifier(n_neighbors=5)
    modelo.fit(dados_treino[colunas], dados_treino["categoria"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
  {
    id: 'kata-validacao',
    emoji: '🔓',
    titulo: 'Kata · Validação',
    setor: 'financas',
    skillId: 'validacao',
    briefing: 'Aquecimento antes da Prova: treine um modelo simples e devolva a acurácia de treino e de teste. Aqui não cobramos overfitting mínimo — só medir os dois números certos.',
    metaLabel: 'Devolver (acurácia_treino, acurácia_teste)',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('financas.csv'),
    starterCode: `from sklearn.linear_model import LogisticRegression

def avaliar(dados_treino, dados_teste):
    # 1. colunas = ["renda", "divida", "score_credito"]
    # 2. modelo = LogisticRegression(max_iter=1000).fit(dados_treino[colunas], dados_treino["inadimplente"])
    # 3. devolva (modelo.score(dados_treino[colunas], dados_treino["inadimplente"]),
    #             modelo.score(dados_teste[colunas], dados_teste["inadimplente"]))
    ...
`,
    setupCode: SETUP_VALIDACAO,
    tests: [
      { name: 'Devolve dois valores', hidden: false, code: `_r = avaliar(dados_treino, dados_teste)\nassert len(_r) == 2\n` },
      { name: 'São proporções válidas', hidden: true, code: `_a, _b = avaliar(dados_treino, dados_teste)\nassert 0.0 <= float(_a) <= 1.0 and 0.0 <= float(_b) <= 1.0\n` },
    ],
    metricsCode: `_a, _b = avaliar(dados_treino, dados_teste)\n_ne_result = {"Acurácia treino": f"{round(float(_a)*100)}%", "Acurácia teste": f"{round(float(_b)*100)}%"}\n`,
    hints: [
      'colunas = ["renda", "divida", "score_credito"]; alvo = "inadimplente".',
      'modelo.score(X, y) já devolve a acurácia — chame com dados_treino e com dados_teste.',
      'return (acc_treino, acc_teste) — os dois números, nessa ordem.',
    ],
    solution: `from sklearn.linear_model import LogisticRegression

def avaliar(dados_treino, dados_teste):
    colunas = ["renda", "divida", "score_credito"]
    modelo = LogisticRegression(max_iter=1000)
    modelo.fit(dados_treino[colunas], dados_treino["inadimplente"])
    acc_treino = modelo.score(dados_treino[colunas], dados_treino["inadimplente"])
    acc_teste = modelo.score(dados_teste[colunas], dados_teste["inadimplente"])
    return acc_treino, acc_teste
`,
    interrogation: [],
  },
  {
    id: 'kata-feature-engineering',
    emoji: '🔓',
    titulo: 'Kata · Feature Engineering',
    setor: 'saude',
    skillId: 'feature-engineering',
    briefing: 'Aquecimento antes da Prova: transforme a coluna de cidade (texto) em colunas 0/1. Aqui não cobramos a escala das outras colunas ainda — só o encoding.',
    metaLabel: "Transformar 'cidade' em colunas 0/1",
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('academias.csv'),
    starterCode: `import pandas as pd

def codificar_cidade(dados):
    # Devolva a tabela com 'cidade' transformada em colunas 0/1 (uma por cidade).
    ...
`,
    setupCode: SETUP_LER_ACADEMIA,
    tests: [
      { name: "'cidade' vira colunas", hidden: false, code: `_r = codificar_cidade(dados)\nassert "cidade" not in _r.columns\n` },
      { name: 'Uma coluna nova por cidade', hidden: true, code: `_r = codificar_cidade(dados)\nassert len(_r.columns) == len(dados.columns) - 1 + dados["cidade"].nunique()\n` },
    ],
    metricsCode: `_r = codificar_cidade(dados)\n_ne_result = {"Colunas depois": int(len(_r.columns))}\n`,
    hints: [
      "pd.get_dummies(tabela, columns=['cidade']) faz a transformação inteira de uma vez.",
      'O resultado já vem sem a coluna original de texto.',
    ],
    solution: `import pandas as pd

def codificar_cidade(dados):
    return pd.get_dummies(dados, columns=["cidade"])
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
  'kata-knn': {
    intro: 'KNN não "aprende" uma fórmula — ele guarda os dados e, na hora de prever, olha quem está mais perto.',
    passos: [
      { code: 'from sklearn.neighbors import KNeighborsClassifier', explica: 'Importa o classificador por vizinhança.' },
      { code: 'def classificar(dados_treino, dados_novos):', explica: 'Recebe treino e os imóveis novos.' },
      { code: '    colunas = ["area_m2", "distancia_centro_km"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = KNeighborsClassifier(n_neighbors=5)', explica: 'Cria o modelo consultando os 5 vizinhos mais próximos.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["categoria"])', explica: '"Treina" (na prática, só guarda os dados de treino).' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Pra cada imóvel novo, olha os 5 vizinhos mais próximos e vota a categoria.' },
    ],
  },
  'classificacao-imoveis': {
    intro: 'Mesmo ritual da runa, agora valendo: escolher colunas, criar, treinar e prever.',
    passos: [
      { code: 'from sklearn.neighbors import KNeighborsClassifier', explica: 'Importa o modelo.' },
      { code: 'def classificar_imovel(dados_treino, dados_novos):', explica: 'Recebe treino e os imóveis a classificar.' },
      { code: '    colunas = ["area_m2", "distancia_centro_km"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada.' },
      { code: '    y = dados_treino["categoria"]', explica: 'y = o que queremos prever.' },
      { code: '    modelo = KNeighborsClassifier(n_neighbors=5)', explica: 'Cria o modelo com k=5.' },
      { code: '    modelo.fit(X, y)', explica: 'Guarda os dados de treino.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Classifica os imóveis novos pelos vizinhos mais próximos.' },
    ],
  },
  'kata-validacao': {
    intro: 'A pergunta de ouro da Validação: o modelo aprendeu o padrão, ou só decorou os exemplos?',
    passos: [
      { code: 'from sklearn.linear_model import LogisticRegression', explica: 'Um modelo simples de classificação.' },
      { code: 'def avaliar(dados_treino, dados_teste):', explica: 'Recebe as duas fatias — treino e teste.' },
      { code: '    colunas = ["renda", "divida", "score_credito"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = LogisticRegression(max_iter=1000)', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["inadimplente"])', explica: 'Treina SÓ com dados_treino.' },
      { code: '    acc_treino = modelo.score(dados_treino[colunas], dados_treino["inadimplente"])', explica: 'Mede o quanto o modelo acerta no que ele já viu.' },
      { code: '    acc_teste = modelo.score(dados_teste[colunas], dados_teste["inadimplente"])', explica: 'Mede o quanto acerta em gente que ele NUNCA viu — o teste de verdade.' },
      { code: '    return acc_treino, acc_teste', explica: 'Devolve os dois números pra comparar.' },
    ],
  },
  'diagnostico-inadimplencia': {
    intro: 'Mesmo ritual, com um modelo que "decora fácil" (árvore sem limite) — é assim que se enxerga overfitting de verdade.',
    passos: [
      { code: 'from sklearn.tree import DecisionTreeClassifier', explica: 'Uma árvore de decisão sem limite tende a decorar o treino.' },
      { code: 'def avaliar_modelo(dados_treino, dados_teste):', explica: 'Recebe as duas fatias.' },
      { code: '    colunas = ["renda", "divida", "score_credito"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = DecisionTreeClassifier(random_state=0)', explica: 'Cria a árvore.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["inadimplente"])', explica: 'Treina SÓ com dados_treino.' },
      { code: '    acc_treino = modelo.score(dados_treino[colunas], dados_treino["inadimplente"])', explica: 'Quase sempre bem alto — o modelo decorou.' },
      { code: '    acc_teste = modelo.score(dados_teste[colunas], dados_teste["inadimplente"])', explica: 'Bem mais baixo — a prova real do overfitting.' },
      { code: '    return acc_treino, acc_teste', explica: 'A diferença entre os dois é o diagnóstico.' },
    ],
  },
  'kata-feature-engineering': {
    intro: 'Modelos não entendem texto — "SP", "RJ" precisam virar números antes de qualquer treino.',
    passos: [
      { code: 'import pandas as pd', explica: 'Só o pandas já resolve o encoding.' },
      { code: 'def codificar_cidade(dados):', explica: 'Recebe a tabela crua.' },
      { code: '    return pd.get_dummies(dados, columns=["cidade"])', explica: "Cria uma coluna 0/1 pra cada cidade e remove a coluna de texto original." },
    ],
  },
  'preparo-features-academia': {
    intro: 'Duas sujeiras diferentes: texto vira número (encoding) e escalas diferentes viram comparáveis (normalização).',
    passos: [
      { code: 'import pandas as pd', explica: 'Pra fazer o encoding.' },
      { code: 'from sklearn.preprocessing import StandardScaler', explica: 'Pra reescalar números.' },
      { code: 'def preparar_features(dados):', explica: 'Recebe a tabela crua.' },
      { code: '    codificado = pd.get_dummies(dados, columns=["cidade"])', explica: "Cidade vira colunas 0/1." },
      { code: '    escalador = StandardScaler()', explica: 'Cria o reescalador.' },
      { code: '    codificado[["idade", "faturamento"]] = escalador.fit_transform(codificado[["idade", "faturamento"]])', explica: 'Reescala as duas colunas juntas pra ficarem comparáveis.' },
      { code: '    return codificado', explica: 'Devolve a tabela pronta pra qualquer modelo.' },
    ],
  },
}

