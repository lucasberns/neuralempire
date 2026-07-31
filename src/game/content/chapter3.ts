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
  {
    id: 'controle-qualidade-pecas',
    emoji: '⚙️',
    titulo: 'Fábrica Peça Certa',
    setor: 'industria',
    skillId: 'svm',
    briefing:
      'A fábrica faz controle de qualidade e quer a fronteira MAIS ROBUSTA possível entre peça ' +
      'OK e defeituosa — a partir de espessura e peso — pra minimizar o risco de deixar passar ' +
      'uma peça ruim por causa de ruído na medição.',
    metaLabel: 'Acurácia ≥ 75% nas 12 peças de entrega',
    payout: 520,
    reputacao: 16,
    prereqContractIds: ['devolucoes-suspeitas'],
    datasetUrl: DATASET('pecas.csv'),
    starterCode: `from sklearn.svm import SVC

def classificar_peca(dados_treino, dados_novos):
    # dados_treino: tabela com espessura_mm, peso_g e defeituosa (0 ou 1)
    # dados_novos:  mesma tabela, MENOS a coluna defeituosa
    #
    # 1. Separe X (colunas de entrada) e y (defeituosa) de dados_treino
    # 2. Treine um SVC(kernel="linear") — a fronteira de margem máxima
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_PECAS,
    tests: [
      {
        name: 'classificar_peca(...) devolve um resultado',
        hidden: false,
        code: `_res = classificar_peca(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão por peça nova',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_peca(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'As previsões são 0 ou 1',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(classificar_peca(dados_treino, dados_novos)).ravel()
assert set(np.unique(_res)).issubset({0, 1}), "As previsões deveriam ser só 0 (ok) ou 1 (defeituosa)"
`,
      },
      {
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(classificar_peca(dados_treino, dados_novos)).ravel()
assert len(set(_res)) > 1, "O modelo previu sempre a mesma classe — não olhou pros dados"
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 75%)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(classificar_peca(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["defeituosa"].to_numpy()).mean())
assert _acc >= 0.75, f"acurácia = {_acc}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(classificar_peca(dados_treino, dados_novos)).ravel()
_acc = float((_pred == _ne_holdout["defeituosa"].to_numpy()).mean())
_ne_result = {
    "Acurácia na entrega": f"{round(_acc * 100)}%",
    "Meta do contrato": "≥ 75%",
    "Peças defeituosas detectadas": int(_pred.sum()),
}
`,
    hints: [
      'As colunas de entrada são espessura_mm e peso_g. O alvo é defeituosa.',
      'X = dados_treino[["espessura_mm", "peso_g"]] e y = dados_treino["defeituosa"].',
      'modelo = SVC(kernel="linear"); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.svm import SVC

def classificar_peca(dados_treino, dados_novos):
    colunas = ["espessura_mm", "peso_g"]
    X = dados_treino[colunas]
    y = dados_treino["defeituosa"]
    modelo = SVC(kernel="linear")
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'O que o SVM tenta maximizar entre as duas classes?',
        options: [
          'A margem — a distância entre a fronteira e os pontos mais próximos de cada classe',
          'O número de pontos usados no treino',
          'A velocidade de treino',
        ],
        correct: 0,
      },
      {
        q: 'O que são os "vetores de suporte"?',
        options: [
          'Os pontos mais próximos da fronteira — só eles decidem onde ela fica',
          'Todos os pontos do dataset, sem exceção',
          'As colunas de entrada do modelo',
        ],
        correct: 0,
      },
      {
        q: 'Por que uma margem maior deixa o modelo mais robusto a ruído em medições novas?',
        options: [
          'Uma peça nova com uma medição um pouco diferente do esperado ainda cai do lado certo, ' +
            'longe da linha de corte',
          'Margem maior sempre significa mais peças no dataset',
          'Não faz diferença nenhuma pra robustez',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'limite-credito-regularizado',
    emoji: '💳',
    titulo: 'Banco CréditoMais',
    setor: 'financas',
    skillId: 'regularizacao',
    briefing:
      'O banco quer prever o limite de crédito ideal a partir de várias variáveis do cliente — ' +
      'mas metade delas é ruído sem relação real com o limite, e um modelo comum "decora" esse ' +
      'ruído. Compare um modelo comum com um modelo regularizado e mostre que o segundo ' +
      'generaliza melhor pra clientes novos.',
    metaLabel: 'R² do modelo regularizado ≥ 40% E pelo menos 5 pontos melhor que o comum',
    payout: 560,
    reputacao: 18,
    prereqContractIds: ['diagnostico-risco-raro', 'controle-qualidade-pecas'],
    datasetUrl: DATASET('creditopremium.csv'),
    starterCode: `from sklearn.linear_model import LinearRegression, Lasso

def comparar_modelos(dados_treino, dados_teste):
    # dados_treino / dados_teste: renda, tempo_emprego, num_cartoes, indice_x1..x5, limite_credito
    # 3 colunas são relevantes de verdade; as 5 "indice_x" são ruído puro
    #
    # 1. Treine um LinearRegression() com TODAS as colunas de entrada (menos o alvo)
    # 2. Calcule o R² dele em dados_teste (modelo.score(...))
    # 3. Treine um Lasso(alpha=50) com as MESMAS colunas
    # 4. Calcule o R² dele em dados_teste
    # 5. Devolva os dois números: (r2_linear, r2_lasso)
    ...
`,
    setupCode: SETUP_CREDITO,
    tests: [
      {
        name: 'comparar_modelos(...) devolve dois valores',
        hidden: false,
        code: `_res = comparar_modelos(dados_treino, dados_teste)
assert len(_res) == 2, "Esperava (r2_linear, r2_lasso)"
`,
      },
      {
        name: 'Os dois valores são números (R² pode ser negativo, mas tem que ser float)',
        hidden: false,
        code: `_a, _b = comparar_modelos(dados_treino, dados_teste)
float(_a); float(_b)
`,
      },
      {
        name: 'Teste oculto: o modelo regularizado generaliza melhor',
        hidden: true,
        code: `_a, _b = comparar_modelos(dados_treino, dados_teste)
assert float(_b) - float(_a) >= 0.05, f"r2_lasso ({_b}) deveria superar r2_linear ({_a}) por pelo menos 0.05"
`,
      },
      {
        name: 'Teste oculto: o R² regularizado atinge a meta (≥ 40%)',
        hidden: true,
        code: `_a, _b = comparar_modelos(dados_treino, dados_teste)
assert float(_b) >= 0.4, f"r2_lasso = {_b}"
`,
      },
    ],
    metricsCode: `_a, _b = comparar_modelos(dados_treino, dados_teste)
_ne_result = {
    "R² modelo comum": round(float(_a), 3),
    "R² modelo regularizado": round(float(_b), 3),
    "Melhora": round(float(_b) - float(_a), 3),
}
`,
    hints: [
      'colunas = todas menos "limite_credito" — use [c for c in dados_treino.columns if c != "limite_credito"].',
      'lin = LinearRegression().fit(dados_treino[colunas], dados_treino["limite_credito"]); r2_lin = lin.score(dados_teste[colunas], dados_teste["limite_credito"]).',
      'las = Lasso(alpha=50).fit(dados_treino[colunas], dados_treino["limite_credito"]); r2_las = las.score(dados_teste[colunas], dados_teste["limite_credito"]).',
    ],
    solution: `from sklearn.linear_model import LinearRegression, Lasso

def comparar_modelos(dados_treino, dados_teste):
    colunas = [c for c in dados_treino.columns if c != "limite_credito"]
    y_treino = dados_treino["limite_credito"]
    y_teste = dados_teste["limite_credito"]

    linear = LinearRegression()
    linear.fit(dados_treino[colunas], y_treino)
    r2_linear = linear.score(dados_teste[colunas], y_teste)

    lasso = Lasso(alpha=50, max_iter=20000)
    lasso.fit(dados_treino[colunas], y_treino)
    r2_lasso = lasso.score(dados_teste[colunas], y_teste)

    return r2_linear, r2_lasso
`,
    interrogation: [
      {
        q: 'Por que o modelo comum vai pior no teste mesmo tendo mais variáveis pra usar?',
        options: [
          'Ele dá peso até pras variáveis de ruído, "decorando" padrões que não existem de verdade',
          'Mais variáveis sempre pioram qualquer modelo, sem exceção',
          'O modelo comum não usa nenhuma variável de verdade',
        ],
        correct: 0,
      },
      {
        q: 'O que a regularização L1 (Lasso) faz de diferente de L2 (Ridge)?',
        options: [
          'L1 pode zerar completamente o peso de uma variável (seleciona variáveis); L2 só encolhe todo mundo um pouco',
          'L1 e L2 fazem exatamente a mesma coisa',
          'L2 é sempre melhor que L1 em qualquer situação',
        ],
        correct: 0,
      },
      {
        q: 'Isso lembra qual outra skill que você já dominou?',
        options: [
          'Validação — de novo é a diferença entre desempenho no treino/modelo comum e desempenho em dados novos que conta a história',
          'KNN — regularização também usa distância entre pontos',
          'Nenhuma relação com o que já foi visto',
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
  {
    id: 'kata-svm',
    emoji: '🔓',
    titulo: 'Kata · SVM',
    setor: 'industria',
    skillId: 'svm',
    briefing: 'Aquecimento antes da Prova: treine um SVC linear e devolva as previsões para as peças novas. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma previsão (0 ou 1) por peça nova',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('pecas.csv'),
    starterCode: `from sklearn.svm import SVC

def classificar(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = defeituosa (de dados_treino)
    # 2. modelo = SVC(kernel="linear").fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_PECAS,
    tests: [
      { name: 'Uma previsão por peça nova', hidden: false, code: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'As previsões são 0 ou 1', hidden: true, code: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\nassert set(np.unique(_r)).issubset({0, 1})\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(classificar(dados_treino, dados_novos)).ravel()\n_ne_result = {"Previsões feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["espessura_mm", "peso_g"]. Alvo: "defeituosa".',
      'X = dados_treino[colunas]; y = dados_treino["defeituosa"].',
      'modelo = SVC(kernel="linear"); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.svm import SVC

def classificar(dados_treino, dados_novos):
    colunas = ["espessura_mm", "peso_g"]
    modelo = SVC(kernel="linear")
    modelo.fit(dados_treino[colunas], dados_treino["defeituosa"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
  {
    id: 'kata-regularizacao',
    emoji: '🔓',
    titulo: 'Kata · Regularização',
    setor: 'financas',
    skillId: 'regularizacao',
    briefing: 'Aquecimento antes da Prova: compare LinearRegression com Lasso no mesmo dataset. Aqui não cobramos a meta — só calcular os dois R².',
    metaLabel: 'Devolver (r2_linear, r2_lasso)',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('creditopremium.csv'),
    starterCode: `from sklearn.linear_model import LinearRegression, Lasso

def comparar(dados_treino, dados_teste):
    # 1. colunas = todas menos "limite_credito"
    # 2. treine LinearRegression e Lasso(alpha=50) nas mesmas colunas
    # 3. devolva (r2_linear, r2_lasso), cada um via modelo.score(dados_teste[colunas], alvo)
    ...
`,
    setupCode: SETUP_CREDITO,
    tests: [
      { name: 'Devolve 2 valores', hidden: false, code: `_a, _b = comparar(dados_treino, dados_teste)\nfloat(_a); float(_b)\n` },
      { name: 'Lasso não fica muito pior que o linear', hidden: true, code: `_a, _b = comparar(dados_treino, dados_teste)\nassert float(_b) >= float(_a) - 0.2\n` },
    ],
    metricsCode: `_a, _b = comparar(dados_treino, dados_teste)\n_ne_result = {"R² comum": round(float(_a),3), "R² regularizado": round(float(_b),3)}\n`,
    hints: [
      'colunas = [c for c in dados_treino.columns if c != "limite_credito"].',
      'linear = LinearRegression().fit(dados_treino[colunas], dados_treino["limite_credito"]).',
      'lasso = Lasso(alpha=50).fit(dados_treino[colunas], dados_treino["limite_credito"]); use .score(...) nos dois.',
    ],
    solution: `from sklearn.linear_model import LinearRegression, Lasso

def comparar(dados_treino, dados_teste):
    colunas = [c for c in dados_treino.columns if c != "limite_credito"]
    y_treino = dados_treino["limite_credito"]
    y_teste = dados_teste["limite_credito"]
    linear = LinearRegression().fit(dados_treino[colunas], y_treino)
    lasso = Lasso(alpha=50, max_iter=20000).fit(dados_treino[colunas], y_treino)
    return linear.score(dados_teste[colunas], y_teste), lasso.score(dados_teste[colunas], y_teste)
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
  'kata-svm': {
    intro: 'SVM não "aprende" uma fórmula fechada — ele procura a reta que separa as duas classes com a maior margem possível.',
    passos: [
      { code: 'from sklearn.svm import SVC', explica: 'Importa o classificador de margem máxima.' },
      { code: 'def classificar(dados_treino, dados_novos):', explica: 'Recebe treino e as peças novas.' },
      { code: '    colunas = ["espessura_mm", "peso_g"]', explica: 'Entradas do modelo.' },
      { code: '    modelo = SVC(kernel="linear")', explica: 'Cria o modelo com fronteira reta (kernel linear).' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["defeituosa"])', explica: 'Treina buscando a margem máxima.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Classifica as peças novas.' },
    ],
  },
  'controle-qualidade-pecas': {
    intro: 'Mesmo ritual da runa, agora valendo: escolher colunas, criar, treinar e prever.',
    passos: [
      { code: 'from sklearn.svm import SVC', explica: 'Importa o modelo.' },
      { code: 'def classificar_peca(dados_treino, dados_novos):', explica: 'Recebe treino e as peças a classificar.' },
      { code: '    colunas = ["espessura_mm", "peso_g"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada.' },
      { code: '    y = dados_treino["defeituosa"]', explica: 'y = o que queremos prever.' },
      { code: '    modelo = SVC(kernel="linear")', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(X, y)', explica: 'Treina buscando a margem máxima.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Classifica as peças novas.' },
    ],
  },
  'kata-regularizacao': {
    intro: 'Regularização penaliza pesos grandes — o modelo passa a preferir explicações mais simples, mesmo abrindo mão de um pouco de ajuste no treino.',
    passos: [
      { code: 'from sklearn.linear_model import LinearRegression, Lasso', explica: 'O modelo comum e o regularizado.' },
      { code: 'def comparar(dados_treino, dados_teste):', explica: 'Recebe treino e teste.' },
      { code: '    colunas = [c for c in dados_treino.columns if c != "limite_credito"]', explica: 'Todas as colunas de entrada, incluindo o ruído.' },
      { code: '    y_treino = dados_treino["limite_credito"]', explica: 'Alvo do treino.' },
      { code: '    y_teste = dados_teste["limite_credito"]', explica: 'Alvo do teste.' },
      { code: '    linear = LinearRegression().fit(dados_treino[colunas], y_treino)', explica: 'Modelo comum, sem penalidade.' },
      { code: '    lasso = Lasso(alpha=50).fit(dados_treino[colunas], y_treino)', explica: 'Modelo regularizado (L1) — alpha controla a força da penalidade.' },
      { code: '    return linear.score(dados_teste[colunas], y_teste), lasso.score(dados_teste[colunas], y_teste)', explica: 'Compara o R² dos dois no teste.' },
    ],
  },
  'limite-credito-regularizado': {
    intro: 'Mesmo ritual da runa, agora valendo: comparar o modelo comum com o regularizado no mesmo teste.',
    passos: [
      { code: 'from sklearn.linear_model import LinearRegression, Lasso', explica: 'Importa os dois modelos.' },
      { code: 'def comparar_modelos(dados_treino, dados_teste):', explica: 'Recebe treino e teste.' },
      { code: '    colunas = [c for c in dados_treino.columns if c != "limite_credito"]', explica: 'Todas as colunas de entrada.' },
      { code: '    y_treino = dados_treino["limite_credito"]', explica: 'Alvo do treino.' },
      { code: '    y_teste = dados_teste["limite_credito"]', explica: 'Alvo do teste.' },
      { code: '    linear = LinearRegression(); linear.fit(dados_treino[colunas], y_treino)', explica: 'Treina o modelo comum.' },
      { code: '    r2_linear = linear.score(dados_teste[colunas], y_teste)', explica: 'R² do modelo comum no teste.' },
      { code: '    lasso = Lasso(alpha=50); lasso.fit(dados_treino[colunas], y_treino)', explica: 'Treina o modelo regularizado.' },
      { code: '    r2_lasso = lasso.score(dados_teste[colunas], y_teste)', explica: 'R² do modelo regularizado no teste.' },
      { code: '    return r2_linear, r2_lasso', explica: 'Devolve os dois pra comparar.' },
    ],
  },
}
