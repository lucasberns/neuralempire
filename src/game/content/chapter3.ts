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

// ---------------------------------------------------------------- Contratos (bosses)
export const CONTRACTS_CH3: Contract[] = [
  {
    id: 'devolucoes-suspeitas',
    emoji: '📦',
    titulo: 'Loja Certa',
    setor: 'varejo',
    skillId: 'arvores-decisao',
    briefing:
      'A Loja Certa recebe muitos pedidos de devolução e o time de fraude está afogado. Eles ' +
      'não querem um modelo caixa-preta — precisam de uma regra simples que consigam explicar ' +
      'pro cliente ("por que essa devolução foi sinalizada"). A partir do valor do pedido e de ' +
      'quantos dias se passaram desde a compra, sinalize as devoluções suspeitas de fraude.',
    metaLabel: 'Acurácia ≥ 75% nos 12 pedidos de entrega',
    payout: 520,
    reputacao: 16,
    prereqContractIds: ['preparo-features-academia'],
    datasetUrl: DATASET('devolucoes.csv'),
    starterCode: `from sklearn.tree import DecisionTreeClassifier

def classificar_devolucao(dados_treino, dados_novos):
    # dados_treino: tabela com valor_pedido, dias_desde_compra e fraude (0 ou 1)
    # dados_novos:  mesma tabela, MENOS a coluna fraude
    #
    # 1. Separe X (colunas de entrada) e y (fraude) de dados_treino
    # 2. Treine um DecisionTreeClassifier(max_depth=3) — profundidade limitada mantém a árvore
    #    curta o suficiente pra explicar ao time de fraude
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_DEVOLUCOES,
    tests: [
      {
        name: 'classificar_devolucao(...) devolve um resultado',
        hidden: false,
        code: `_res = classificar_devolucao(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão por pedido novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_devolucao(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'As previsões são 0 ou 1',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_devolucao(dados_treino, dados_novos)).ravel()
assert set(np.unique(_res)).issubset({0, 1}), "As previsões deveriam ser só 0 (ok) ou 1 (suspeita)"
`,
      },
      {
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(classificar_devolucao(dados_treino, dados_novos)).ravel()
assert len(set(_res)) > 1, "O modelo previu sempre a mesma classe — não olhou pros dados"
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 75%)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(classificar_devolucao(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["fraude"].to_numpy()).mean())
assert _acc >= 0.75, f"acurácia = {_acc}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(classificar_devolucao(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["fraude"].to_numpy()).mean())
_ne_result = {
    "Acurácia na entrega": f"{round(_acc * 100)}%",
    "Meta do contrato": "≥ 75%",
    "Devoluções sinalizadas": int(_pred.sum()),
}
`,
    hints: [
      'As colunas de entrada são valor_pedido e dias_desde_compra. O alvo é fraude.',
      'X = dados_treino[["valor_pedido", "dias_desde_compra"]] e y = dados_treino["fraude"].',
      'modelo = DecisionTreeClassifier(max_depth=3); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.tree import DecisionTreeClassifier

def classificar_devolucao(dados_treino, dados_novos):
    colunas = ["valor_pedido", "dias_desde_compra"]
    X = dados_treino[colunas]
    y = dados_treino["fraude"]
    modelo = DecisionTreeClassifier(max_depth=3, random_state=0)
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'Por que limitar a profundidade da árvore (max_depth=3) em vez de deixar crescer livre?',
        options: [
          'Uma árvore rasa é mais fácil de explicar E menos propensa a decorar ruído (overfitting)',
          'Profundidade não muda nada no resultado',
          'Árvores mais fundas são sempre mais rápidas de treinar',
        ],
        correct: 0,
      },
      {
        q: 'O que a árvore faz, na prática, pra separar as classes?',
        options: [
          'Faz cortes sucessivos numa variável de cada vez, tipo "se valor_pedido > 250, vá pra ' +
            'direita" — cada corte reduz a mistura de classes (impureza)',
          'Calcula uma distância até os pontos mais próximos',
          'Ajusta uma reta que separa as duas classes',
        ],
        correct: 0,
      },
      {
        q: 'O time de fraude quer justificar cada sinalização ao cliente. Por que isso favorece ' +
          'uma árvore de decisão sobre um modelo caixa-preta?',
        options: [
          'A árvore vira uma sequência de "se/então" que dá pra ler e explicar linha por linha',
          'Árvores são sempre mais precisas que qualquer outro modelo',
          'Não tem diferença nenhuma pra explicabilidade',
        ],
        correct: 0,
      },
    ],
  },
]

// ---------------------------------------------------------------- Runa do Código (katas)
export const KATAS_CH3: Contract[] = [
  {
    id: 'kata-arvores-decisao',
    emoji: '🔓',
    titulo: 'Kata · Árvores de Decisão',
    setor: 'varejo',
    skillId: 'arvores-decisao',
    briefing: 'Aquecimento antes da Prova: treine um DecisionTreeClassifier e devolva as previsões para os pedidos novos. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma previsão (0 ou 1) por pedido novo',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('devolucoes.csv'),
    starterCode: `from sklearn.tree import DecisionTreeClassifier

def prever(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = fraude (de dados_treino)
    # 2. modelo = DecisionTreeClassifier(max_depth=3).fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_DEVOLUCOES,
    tests: [
      { name: 'Uma previsão por pedido novo', hidden: false, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'As previsões são 0 ou 1', hidden: true, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert set(np.unique(_r)).issubset({0, 1})\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\n_ne_result = {"Previsões feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["valor_pedido", "dias_desde_compra"]. Alvo: "fraude".',
      'X = dados_treino[colunas]; y = dados_treino["fraude"].',
      'modelo = DecisionTreeClassifier(max_depth=3); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.tree import DecisionTreeClassifier

def prever(dados_treino, dados_novos):
    colunas = ["valor_pedido", "dias_desde_compra"]
    modelo = DecisionTreeClassifier(max_depth=3, random_state=0)
    modelo.fit(dados_treino[colunas], dados_treino["fraude"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
]

// ---------------------------------------------------------------- Aulas de código (ensino)
export const LESSONS_CH3: Record<string, Lesson> = {
  'kata-arvores-decisao': {
    intro: 'Mesmo ritual de sempre: escolher colunas, criar o modelo, treinar (.fit) e prever (.predict) — o modelo agora aprende cortes em vez de uma reta ou uma fronteira suave.',
    passos: [
      { code: 'from sklearn.tree import DecisionTreeClassifier', explica: 'Importa o modelo de árvore.' },
      { code: 'def prever(dados_treino, dados_novos):', explica: 'Recebe treino e os pedidos novos.' },
      { code: '    colunas = ["valor_pedido", "dias_desde_compra"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = DecisionTreeClassifier(max_depth=3)', explica: 'Cria o modelo, limitando a profundidade (árvore curta = explicável).' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["fraude"])', explica: 'Treina com as colunas de entrada e o alvo (fraude).' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê 0 ou 1 pros pedidos novos.' },
    ],
  },
  'devolucoes-suspeitas': {
    intro: 'Mesmo ritual da runa, agora valendo: escolher colunas, criar, treinar e prever.',
    passos: [
      { code: 'from sklearn.tree import DecisionTreeClassifier', explica: 'Importa o modelo.' },
      { code: 'def classificar_devolucao(dados_treino, dados_novos):', explica: 'Recebe treino e os pedidos a classificar.' },
      { code: '    colunas = ["valor_pedido", "dias_desde_compra"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada.' },
      { code: '    y = dados_treino["fraude"]', explica: 'y = o que queremos prever.' },
      { code: '    modelo = DecisionTreeClassifier(max_depth=3)', explica: 'Cria o modelo com profundidade limitada.' },
      { code: '    modelo.fit(X, y)', explica: 'Treina com X e y.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê fraude nos pedidos novos.' },
    ],
  },
}
