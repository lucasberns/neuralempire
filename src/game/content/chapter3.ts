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
  {
    id: 'diagnostico-risco-raro',
    emoji: '🩺',
    titulo: 'Clínica Vida Plena',
    setor: 'saude',
    skillId: 'metricas-avancadas',
    briefing:
      'A clínica quer sinalizar pacientes em risco de uma complicação rara (só ~13% dos casos). ' +
      'Um modelo que "acerta 87% das vezes" prevendo sempre que ninguém está em risco pareceria ' +
      'ótimo e seria inútil. Meça o desempenho de verdade: precisão, recall e F1 — não só acurácia.',
    metaLabel: 'Recall ≥ 40% E precisão ≥ 40% no teste',
    payout: 540,
    reputacao: 17,
    prereqContractIds: ['devolucoes-suspeitas'],
    datasetUrl: DATASET('diagnostico.csv'),
    starterCode: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score

def avaliar_diagnostico(dados_treino, dados_teste):
    # dados_treino / dados_teste: mesmas colunas (idade, glicose, risco)
    #
    # 1. Treine um LogisticRegression() usando SÓ dados_treino
    # 2. Preveja em dados_teste
    # 3. Calcule precisao, recall e f1 comparando a previsão com dados_teste["risco"]
    # 4. Devolva os três números: (precisao, recall, f1)
    ...
`,
    setupCode: SETUP_DIAGNOSTICO,
    tests: [
      {
        name: 'avaliar_diagnostico(...) devolve três valores',
        hidden: false,
        code: `_res = avaliar_diagnostico(dados_treino, dados_teste)
assert len(_res) == 3, "Esperava (precisao, recall, f1)"
`,
      },
      {
        name: 'Os três valores são proporções válidas (entre 0 e 1)',
        hidden: false,
        code: `_p, _r, _f = avaliar_diagnostico(dados_treino, dados_teste)
assert all(0.0 <= float(v) <= 1.0 for v in (_p, _r, _f)), "Precisão/recall/F1 devem estar entre 0 e 1"
`,
      },
      {
        name: 'Teste oculto: recall real (não "prever sempre não")',
        hidden: true,
        code: `_p, _r, _f = avaliar_diagnostico(dados_treino, dados_teste)
assert float(_r) >= 0.4, f"recall = {_r} — parece que o modelo nunca sinaliza risco"
`,
      },
      {
        name: 'Teste oculto: precisão real (não "prever sempre sim")',
        hidden: true,
        code: `_p, _r, _f = avaliar_diagnostico(dados_treino, dados_teste)
assert float(_p) >= 0.4, f"precisão = {_p} — parece que o modelo sinaliza risco demais"
`,
      },
      {
        name: 'Teste oculto: F1 bate com a fórmula de precisão/recall',
        hidden: true,
        code: `_p, _r, _f = avaliar_diagnostico(dados_treino, dados_teste)
_p, _r = float(_p), float(_r)
_esperado = 0.0 if (_p + _r) == 0 else 2 * _p * _r / (_p + _r)
assert abs(float(_f) - _esperado) < 1e-6, f"F1 não bate com 2*P*R/(P+R): {_f} vs {_esperado}"
`,
      },
    ],
    metricsCode: `_p, _r, _f = avaliar_diagnostico(dados_treino, dados_teste)
_ne_result = {
    "Precisão": f"{round(float(_p) * 100)}%",
    "Recall": f"{round(float(_r) * 100)}%",
    "F1": round(float(_f), 2),
}
`,
    hints: [
      'colunas = ["idade", "glicose"]; alvo = "risco".',
      'modelo = LogisticRegression(); modelo.fit(dados_treino[colunas], dados_treino["risco"]).',
      'pred = modelo.predict(dados_teste[colunas]); depois use precision_score/recall_score/f1_score(dados_teste["risco"], pred).',
    ],
    solution: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score

def avaliar_diagnostico(dados_treino, dados_teste):
    colunas = ["idade", "glicose"]
    modelo = LogisticRegression()
    modelo.fit(dados_treino[colunas], dados_treino["risco"])
    pred = modelo.predict(dados_teste[colunas])
    real = dados_teste["risco"]
    precisao = precision_score(real, pred, zero_division=0)
    recall = recall_score(real, pred, zero_division=0)
    f1 = f1_score(real, pred, zero_division=0)
    return precisao, recall, f1
`,
    interrogation: [
      {
        q: 'Por que "acurácia de 87%" pode ser enganoso nesse caso?',
        options: [
          'Só 13% dos pacientes têm risco real — um modelo que nunca sinaliza nada já acerta 87% ' +
            'sem servir pra nada',
          'Acurácia é sempre a métrica certa, não importa o contexto',
          '87% é baixo demais pra qualquer aplicação',
        ],
        correct: 0,
      },
      {
        q: 'O que recall baixo significaria aqui, na prática?',
        options: [
          'O modelo está deixando passar pacientes que realmente estão em risco (falsos negativos)',
          'O modelo está sinalizando risco demais, gerando alarme falso',
          'Recall não tem relação com pacientes de risco',
        ],
        correct: 0,
      },
      {
        q: 'Por que reportar precisão E recall, em vez de só um dos dois?',
        options: [
          'Cada um sozinho esconde um jeito de "trapacear" (só recall: sinalizar todo mundo; só ' +
            'precisão: quase nunca sinalizar) — juntos, a história fica completa',
          'Precisão e recall são sempre iguais na prática',
          'Reportar os dois é só uma formalidade sem efeito prático',
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
  {
    id: 'kata-metricas-avancadas',
    emoji: '🔓',
    titulo: 'Kata · Métricas Avançadas',
    setor: 'saude',
    skillId: 'metricas-avancadas',
    briefing: 'Aquecimento antes da Prova: calcule precisão, recall e F1 de um modelo já treinado. Aqui não cobramos a meta — só calcular certo.',
    metaLabel: 'Devolver (precisao, recall, f1)',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('diagnostico.csv'),
    starterCode: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score

def avaliar(dados_treino, dados_teste):
    # 1. modelo = LogisticRegression().fit(X, y) com X/y de dados_treino
    # 2. pred = modelo.predict(X_teste)
    # 3. devolva (precision_score(...), recall_score(...), f1_score(...))
    ...
`,
    setupCode: SETUP_DIAGNOSTICO,
    tests: [
      { name: 'Devolve 3 valores entre 0 e 1', hidden: false, code: `_p, _r, _f = avaliar(dados_treino, dados_teste)\nassert all(0.0 <= float(v) <= 1.0 for v in (_p, _r, _f))\n` },
      { name: 'F1 bate com a fórmula', hidden: true, code: `_p, _r, _f = avaliar(dados_treino, dados_teste)\n_p, _r = float(_p), float(_r)\n_esp = 0.0 if (_p+_r)==0 else 2*_p*_r/(_p+_r)\nassert abs(float(_f) - _esp) < 1e-6\n` },
    ],
    metricsCode: `_p, _r, _f = avaliar(dados_treino, dados_teste)\n_ne_result = {"Precisão": f"{round(float(_p)*100)}%", "Recall": f"{round(float(_r)*100)}%"}\n`,
    hints: [
      'colunas = ["idade", "glicose"]; alvo = "risco".',
      'modelo = LogisticRegression(); modelo.fit(dados_treino[colunas], dados_treino["risco"]).',
      'from sklearn.metrics import precision_score, recall_score, f1_score — chame os três com (real, previsto).',
    ],
    solution: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score

def avaliar(dados_treino, dados_teste):
    colunas = ["idade", "glicose"]
    modelo = LogisticRegression()
    modelo.fit(dados_treino[colunas], dados_treino["risco"])
    pred = modelo.predict(dados_teste[colunas])
    real = dados_teste["risco"]
    return precision_score(real, pred, zero_division=0), recall_score(real, pred, zero_division=0), f1_score(real, pred, zero_division=0)
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
  'kata-metricas-avancadas': {
    intro: 'Acurácia sozinha mente quando uma classe é rara. Precisão e recall contam a história completa.',
    passos: [
      { code: 'from sklearn.linear_model import LogisticRegression', explica: 'Modelo de classificação.' },
      { code: 'from sklearn.metrics import precision_score, recall_score, f1_score', explica: 'As 3 métricas que vamos calcular.' },
      { code: 'def avaliar(dados_treino, dados_teste):', explica: 'Recebe treino e teste.' },
      { code: '    colunas = ["idade", "glicose"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = LogisticRegression()', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["risco"])', explica: 'Treina só com dados_treino.' },
      { code: '    pred = modelo.predict(dados_teste[colunas])', explica: 'Prevê no teste.' },
      { code: '    real = dados_teste["risco"]', explica: 'O gabarito real do teste.' },
      { code: '    return precision_score(real, pred, zero_division=0), recall_score(real, pred, zero_division=0), f1_score(real, pred, zero_division=0)', explica: 'Calcula e devolve as 3 métricas.' },
    ],
  },
  'diagnostico-risco-raro': {
    intro: 'Mesmo ritual da runa, agora valendo: treinar, prever, e medir com as 3 métricas certas.',
    passos: [
      { code: 'from sklearn.linear_model import LogisticRegression', explica: 'Importa o modelo.' },
      { code: 'from sklearn.metrics import precision_score, recall_score, f1_score', explica: 'Importa as métricas.' },
      { code: 'def avaliar_diagnostico(dados_treino, dados_teste):', explica: 'Recebe treino e teste.' },
      { code: '    colunas = ["idade", "glicose"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = LogisticRegression()', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["risco"])', explica: 'Treina só no treino.' },
      { code: '    pred = modelo.predict(dados_teste[colunas])', explica: 'Prevê no teste.' },
      { code: '    real = dados_teste["risco"]', explica: 'Gabarito real.' },
      { code: '    precisao = precision_score(real, pred, zero_division=0)', explica: 'Dos que você marcou como risco, quantos eram mesmo.' },
      { code: '    recall = recall_score(real, pred, zero_division=0)', explica: 'Dos que eram risco de verdade, quantos você pegou.' },
      { code: '    f1 = f1_score(real, pred, zero_division=0)', explica: 'Combina os dois numa nota só.' },
      { code: '    return precisao, recall, f1', explica: 'Devolve os três.' },
    ],
  },
}
