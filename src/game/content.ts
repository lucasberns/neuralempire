// Conteúdo do Capítulo 1 "A Garagem" (GDD §2, §6, §12) + regras puras da economia.
// ponytail: contratos e regras num arquivo só — a fatia do Cap 1 não justifica
// engine separada ainda; os módulos de engine/ guardam só os tipos p/ fases futuras.
import type { Contract } from '../engine/contracts'
import type { GameState } from '../persistence/saveGame'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

// ---------------------------------------------------------------- Hardware
export interface Hardware {
  nome: string
  desc: string
  custo: number // custo para CHEGAR neste nível (0 = inicial)
}

// GDD §4.2: hardware limita modelos e cria desejo de progressão. Cap 1 = 3 níveis.
export const HARDWARE: Hardware[] = [
  { nome: 'PC de 2012', desc: 'Herança do tio. Roda o básico, reclama do resto.', custo: 0 },
  { nome: 'PC Gamer usado', desc: 'Comprado no desapego. Treinos mais rápidos, menos travadas.', custo: 350 },
  { nome: 'Rack de GPUs', desc: 'A garagem virou sala-cofre. Modelos maiores já cabem.', custo: 1200 },
]

// ---------------------------------------------------------------- Skills (Tier 1, GDD §6)
export interface SkillDef {
  id: string
  nome: string
  desc: string
  /** Contrato que prova a skill (undefined = ainda não jogável nesta fase). */
  contractId?: string
}

export const SKILLS: SkillDef[] = [
  { id: 'ler', nome: 'Ler Dados', desc: 'Carregar tabelas, olhar colunas, resumir com pandas.', contractId: 'boletim-padaria' },
  { id: 'explorar', nome: 'Explorar Dados', desc: 'Média, mediana, dispersão, correlação.' },
  { id: 'limpar', nome: 'Limpar Dados', desc: 'Faltantes, outliers, duplicatas, tipos errados.' },
  { id: 'regressao', nome: 'Regressão Linear', desc: 'Reta, erro quadrático, treino/teste, MAE.', contractId: 'previsao-padaria' },
]

// ---------------------------------------------------------------- Contratos
const SETUP_LER = `import io
import pandas as pd
dados = pd.read_csv(io.StringIO(_ne_csv))
`

// Últimos 12 dias ficam fora do treino: são o holdout dos testes ocultos (GDD §7.1).
const SETUP_REGRESSAO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["vendas"])
`

export const CONTRACTS: Contract[] = [
  {
    id: 'boletim-padaria',
    emoji: '📊',
    titulo: 'O Boletim do Seu Joaquim',
    setor: 'varejo',
    skillId: 'ler',
    briefing:
      'Antes de qualquer mágica, o Seu Joaquim só quer entender o movimento: em média, ' +
      'quantos pães ele vende por dia? Ele te entregou o caderninho de 60 dias digitado. ' +
      'Devolva a média de vendas — é o seu primeiro trabalho, capriche.',
    metaLabel: 'Devolver a média exata da coluna de vendas',
    payout: 180,
    reputacao: 6,
    prereqContractIds: [],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `def media_de_vendas(dados):
    # dados: uma tabela (DataFrame) com a coluna 'vendas', entre outras.
    # Devolva a média da coluna 'vendas'.
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      {
        name: 'media_de_vendas(dados) devolve um número',
        hidden: false,
        code: `_r = media_de_vendas(dados)
assert _r is not None, "A fun\\u00e7\\u00e3o retornou None \\u2014 faltou o return?"
float(_r)
`,
      },
      {
        name: 'É a média certa da coluna de vendas',
        hidden: true,
        code: `_r = float(media_de_vendas(dados))
assert abs(_r - float(dados["vendas"].mean())) < 0.01
`,
      },
    ],
    metricsCode: `_ne_result = {
    "M\\u00e9dia que voc\\u00ea calculou": round(float(media_de_vendas(dados)), 2),
    "Dias no caderninho": int(len(dados)),
}
`,
    hints: [
      'Uma tabela (DataFrame) tem o método .mean() que tira a média de uma coluna.',
      "Você acessa a coluna de vendas com dados['vendas'].",
      "Junte tudo: dados['vendas'].mean() já devolve a média.",
    ],
    solution: `def media_de_vendas(dados):
    return dados['vendas'].mean()
`,
  },
  {
    id: 'previsao-padaria',
    emoji: '🥖',
    titulo: 'Padaria do Seu Joaquim',
    setor: 'varejo',
    skillId: 'regressao',
    briefing:
      'O Seu Joaquim gostou do boletim e voltou com um pedido maior: parar de jogar pão fora. ' +
      'Ele anotou, por 60 dias, a temperatura, se era fim de semana e se tinha promoção. ' +
      'Preveja quantos pães ele vai vender nos próximos dias. Errar por até 8 pães em média, ele aceita.',
    metaLabel: 'MAE ≤ 8 nos 12 dias de entrega',
    payout: 420,
    reputacao: 12,
    prereqContractIds: ['boletim-padaria'],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `from sklearn.linear_model import LinearRegression

def prever_vendas(dados_treino, dados_novos):
    # dados_treino: tabela com temperatura, fim_de_semana, promocao e vendas
    # dados_novos:  mesma tabela, MENOS a coluna vendas
    #
    # 1. Separe X (colunas de entrada) e y (vendas) de dados_treino
    # 2. Treine um LinearRegression com X e y
    # 3. Devolva as previsões do modelo para dados_novos
    ...
`,
    setupCode: SETUP_REGRESSAO,
    tests: [
      {
        name: 'prever_vendas(...) devolve um resultado',
        hidden: false,
        code: `_res = prever_vendas(dados_treino, dados_novos)
assert _res is not None, "A fun\\u00e7\\u00e3o retornou None \\u2014 faltou o return?"
`,
      },
      {
        name: 'Uma previsão para cada dia novo',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previs\\u00f5es, recebi {len(_res)}"
`,
      },
      {
        name: 'As previsões são números válidos',
        hidden: false,
        code: `import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
assert np.isfinite(_res).all(), "H\\u00e1 previs\\u00f5es que n\\u00e3o s\\u00e3o n\\u00fameros v\\u00e1lidos"
`,
      },
      {
        // Pega quem devolve um valor constante (a média) em vez de treinar um modelo.
        name: 'Teste oculto: o modelo realmente reage aos dados',
        hidden: true,
        code: `import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
assert float(np.std(_res)) > 1.0
`,
      },
      {
        // Qualidade real no holdout que o jogador nunca viu.
        name: 'Teste oculto: entrega dentro da meta (MAE ≤ 8)',
        hidden: true,
        code: `import numpy as np
_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
assert _mae <= 8.0
`,
      },
    ],
    metricsCode: `import numpy as np
_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
_ne_result = {
    "MAE na entrega": round(_mae, 2),
    "Meta do contrato": "\\u2264 8",
    "Primeiras previs\\u00f5es": [round(float(p), 1) for p in _pred[:4]],
}
`,
    hints: [
      'As colunas de entrada são temperatura, fim_de_semana e promocao. O alvo é vendas.',
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
  },
]

// ---------------------------------------------------------------- Regras puras
export const contractById = (id: string) => CONTRACTS.find((c) => c.id === id)

export const isDone = (g: GameState, id: string) => g.contracts.doneIds.includes(id)

export const isAvailable = (g: GameState, c: Contract) =>
  !isDone(g, c.id) && c.prereqContractIds.every((id) => isDone(g, id))

export type SkillStatus = 'bloqueada' | 'disponivel' | 'dominada' | 'em-breve'

export function skillStatus(g: GameState, s: SkillDef): SkillStatus {
  if (!s.contractId) return 'em-breve'
  if (isDone(g, s.contractId)) return 'dominada'
  const c = contractById(s.contractId)
  return c && isAvailable(g, c) ? 'disponivel' : 'bloqueada'
}

export const currentHardware = (g: GameState) => HARDWARE[g.hardwareLevel] ?? HARDWARE[0]
export const nextHardware = (g: GameState): Hardware | undefined => HARDWARE[g.hardwareLevel + 1]

const today = () => new Date().toISOString().slice(0, 10)

/** Aplica a recompensa de um contrato entregue. Idempotente: não paga de novo. */
export function completeContract(
  g: GameState,
  c: Contract,
): { next: GameState; bonus: boolean; already: boolean } {
  if (isDone(g, c.id)) return { next: g, bonus: false, already: true }
  const streakDay = today()
  const streak =
    g.streak.lastDayISO === streakDay
      ? g.streak
      : { count: g.streak.count + 1, lastDayISO: streakDay }
  const next: GameState = {
    ...g,
    money: g.money + c.payout,
    reputation: Math.min(100, g.reputation + c.reputacao),
    streak,
    // Mantém activeId: a bancada continua montada p/ o jogador ver a recompensa.
    contracts: { ...g.contracts, doneIds: [...g.contracts.doneIds, c.id] },
  }
  return { next, bonus: false, already: false }
}

export function buyHardware(g: GameState): GameState | null {
  const nxt = nextHardware(g)
  if (!nxt || g.money < nxt.custo) return null
  return { ...g, money: g.money - nxt.custo, hardwareLevel: g.hardwareLevel + 1 }
}
