// Contratos especiais (GDD §7.2): disputado (concorrente NPC) e crise (modelo antigo em drift).
// Gated por isAvailable/isDone (não por skill nova) — ver spec 2026-07-19-contratos-disputado-crise-design.md.
import type { Contract } from '../../engine/contracts'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

const SETUP_PECAS = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["defeituosa"])
`

const SETUP_PADARIA = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["vendas"])
`

export const SPECIAL: Contract[] = [
  {
    id: 'duelo-controle-qualidade',
    emoji: '⚔️',
    titulo: 'Duelo — Fábrica Peça Certa II',
    setor: 'industria',
    skillId: 'svm',
    briefing:
      'Um freelancer concorrente também está de olho no contrato da fábrica, com um lote novo de ' +
      'peças pra classificar. Quem entregar a acurácia mais alta fica com o cliente — o trabalho ' +
      'do concorrente já foi entregue, com 83% de acerto. Supere isso.',
    metaLabel: 'Vença o concorrente (acurácia dele: 83%) — meta mínima 75%',
    payout: 600,
    reputacao: 20,
    prereqContractIds: ['controle-qualidade-pecas'],
    datasetUrl: DATASET('pecas2.csv'),
    disputado: { npcScore: 0.83, scoreKey: '_score', npcLabel: 'freelancer concorrente' },
    starterCode: `from sklearn.svm import SVC

def classificar_peca(dados_treino, dados_novos):
    # dados_treino: tabela com espessura_mm, peso_g e defeituosa (0 ou 1)
    # dados_novos:  mesma tabela, MENOS a coluna defeituosa
    #
    # 1. Separe X (colunas de entrada) e y (defeituosa) de dados_treino
    # 2. Treine um SVC(kernel="linear")
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
    "_score": _acc,
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
        q: 'O concorrente também usou SVM. O que pode ter feito seu modelo entregar melhor?',
        options: [
          'Uma margem melhor ajustada aos dados desse lote específico de peças',
          'O SVM sempre entrega o mesmo resultado, não importa quem treina',
          'Sorte, não tem nada a ver com o modelo',
        ],
        correct: 0,
      },
      {
        q: 'Perder esse duelo significa que você não sabe a skill?',
        options: [
          'Não — o contrato ainda conta como entregue e aprovado; só o cliente foi pro concorrente',
          'Sim, perder um duelo derruba a skill de volta pra "em treino"',
          'Sim, e a skill fica travada até vencer um duelo',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'crise-padaria',
    emoji: '🔥',
    titulo: 'Crise na Padaria do Seu Joaquim',
    setor: 'varejo',
    skillId: 'regressao',
    briefing:
      'O Seu Joaquim está furioso: o modelo que você entregou há tempos parou de bater. O ' +
      'mercado mudou — promoções agora puxam muito mais as vendas do que antes. Ele te chamou de ' +
      'volta com dados novos: refaça a previsão do zero, sem assumir nada do modelo antigo.',
    metaLabel: 'MAE ≤ 8 nos 12 dias de entrega (dados de agora)',
    payout: 480,
    reputacao: 14,
    prereqContractIds: ['previsao-padaria'],
    datasetUrl: DATASET('padaria-crise.csv'),
    crise: { originalContractId: 'previsao-padaria' },
    starterCode: `from sklearn.linear_model import LinearRegression

def prever_vendas(dados_treino, dados_novos):
    # dados_treino: tabela com temperatura, fim_de_semana, promocao e vendas (dados NOVOS, pós-crise)
    # dados_novos:  mesma tabela, MENOS a coluna vendas
    #
    # 1. Separe X (colunas de entrada) e y (vendas) de dados_treino
    # 2. Treine um LinearRegression do zero, com os dados NOVOS
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_PADARIA,
    tests: [
      {
        name: 'prever_vendas(...) devolve um resultado',
        hidden: false,
        code: `_res = prever_vendas(dados_treino, dados_novos)
assert _res is not None, "A função retornou None — faltou o return?"
`,
      },
      {
        name: 'Uma previsão para cada dia novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previsões, recebi {len(_res)}"
`,
      },
      {
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
assert float(np.std(_res)) > 1.0
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (MAE ≤ 8)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
assert _mae <= 8.0, f"MAE = {_mae}"
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
_ne_result = {
    "MAE na entrega": round(_mae, 2),
    "Meta do contrato": "≤ 8",
}
`,
    hints: [
      'Mesmas colunas de antes (temperatura, fim_de_semana, promocao) — mas os DADOS mudaram, então retreine do zero.',
      'X = dados_treino[["temperatura", "fim_de_semana", "promocao"]] e y = dados_treino["vendas"].',
      'Crie o modelo com LinearRegression(), treine com modelo.fit(X, y) e preveja com modelo.predict(dados_novos).',
    ],
    solution: `from sklearn.linear_model import LinearRegression

def prever_vendas(dados_treino, dados_novos):
    colunas = ["temperatura", "fim_de_semana", "promocao"]
    X = dados_treino[colunas]
    y = dados_treino["vendas"]
    modelo = LinearRegression()
    modelo.fit(X, y)
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [
      {
        q: 'Por que o modelo antigo parou de funcionar, mesmo tendo funcionado bem antes?',
        options: [
          'O comportamento dos dados mudou (drift) — o padrão que o modelo aprendeu não é mais o padrão real',
          'O modelo antigo tinha um bug desde o início',
          'Modelos de regressão sempre param de funcionar depois de um tempo',
        ],
        correct: 0,
      },
      {
        q: 'Por que retreinar do zero com dados novos, em vez de "ajustar" o modelo antigo?',
        options: [
          'A relação entre as variáveis mudou — um modelo novo aprende o padrão atual, não o antigo',
          'Retreinar do zero é sempre pior que ajustar',
          'Não faz diferença nenhuma qual dos dois se faz',
        ],
        correct: 0,
      },
      {
        q: 'Essa situação (modelo que funcionava e parou) tem nome em produção de ML?',
        options: [
          'Drift — mudança na distribuição dos dados/comportamento em relação ao que foi treinado',
          'Overfitting — o mesmo problema de Validação',
          'Não tem nome, é só azar',
        ],
        correct: 0,
      },
    ],
  },
]
