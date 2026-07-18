// Conteúdo do Capítulo 1 "A Garagem" (GDD §2, §6, §12).
import type { Contract } from '../../engine/contracts'
import type { SkillDef, Lesson } from '../content'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

export const SKILLS_CH1: SkillDef[] = [
  { id: 'ler', nome: 'Ler Dados', desc: 'Carregar tabelas, olhar colunas, resumir com pandas.', contractId: 'boletim-padaria', kataId: 'kata-ler', prereqSkillIds: [] },
  { id: 'explorar', nome: 'Explorar Dados', desc: 'Média, correlação, o que os dados dizem.', contractId: 'analise-clima', kataId: 'kata-explorar', prereqSkillIds: ['ler'] },
  { id: 'limpar', nome: 'Limpar Dados', desc: 'Valores faltantes, sujeira, tipos errados.', contractId: 'faxina-cadastro', kataId: 'kata-limpar', prereqSkillIds: ['explorar'] },
  { id: 'regressao', nome: 'Regressão Linear', desc: 'Reta, erro quadrático, treino/teste, MAE.', contractId: 'previsao-padaria', kataId: 'kata-regressao', prereqSkillIds: ['limpar'] },
]

// ---------------------------------------------------------------- Setups Python
const SETUP_LER = `import io
import pandas as pd
dados = pd.read_csv(io.StringIO(_ne_csv))
`

// Últimos 12 dias fora do treino: holdout dos testes ocultos (GDD §7.1).
const SETUP_REGRESSAO = `import io
import pandas as pd
_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["vendas"])
`

// ---------------------------------------------------------------- Contratos (bosses)
export const CONTRACTS_CH1: Contract[] = [
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
    interrogation: [
      {
        q: 'O Seu Joaquim pergunta: "esse tal de média, o que ele me diz na prática?"',
        options: [
          'O valor mais vendido de todos os dias',
          'Quanto ele vende num dia típico, no geral',
          'O maior número de pães que ele já vendeu',
        ],
        correct: 1,
      },
      {
        q: 'Num dia de feira ele vendeu o triplo do normal. O que esse dia faz com a média?',
        options: [
          'Puxa a média pra cima — ela é sensível a valores extremos',
          'Nada, a média ignora dias fora do padrão',
          'Derruba a média pela metade',
        ],
        correct: 0,
      },
      {
        q: 'Pra chegar nesse número, quantos dias do caderninho você usou?',
        options: [
          'Todos — média é a soma de tudo dividida pela quantidade',
          'Só os 10 primeiros dias',
          'Só os fins de semana',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'analise-clima',
    emoji: '🌡️',
    titulo: 'Será que é o calor?',
    setor: 'varejo',
    skillId: 'explorar',
    briefing:
      'O Seu Joaquim desconfia que vende mais pão nos dias quentes, mas não tem certeza. ' +
      'Com o mesmo caderninho, descubra: existe relação entre a temperatura e as vendas? ' +
      'Devolva a correlação entre as duas colunas — um número de -1 a 1.',
    metaLabel: 'Devolver a correlação entre temperatura e vendas',
    payout: 240,
    reputacao: 8,
    prereqContractIds: ['boletim-padaria'],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `def correlacao_temp_vendas(dados):
    # dados: tabela com as colunas 'temperatura' e 'vendas'.
    # Devolva a correlação entre 'temperatura' e 'vendas'.
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      {
        name: 'Devolve um número entre -1 e 1',
        hidden: false,
        code: `_r = float(correlacao_temp_vendas(dados))
assert -1.0001 <= _r <= 1.0001, "Correla\\u00e7\\u00e3o fica sempre entre -1 e 1"
`,
      },
      {
        name: 'É a correlação certa das duas colunas',
        hidden: true,
        code: `_r = float(correlacao_temp_vendas(dados))
assert abs(_r - float(dados["temperatura"].corr(dados["vendas"]))) < 0.01
`,
      },
    ],
    metricsCode: `_r = float(correlacao_temp_vendas(dados))
_ne_result = {
    "Correla\\u00e7\\u00e3o encontrada": round(_r, 3),
    "Leitura": "quanto mais perto de 1, mais o calor puxa as vendas",
}
`,
    hints: [
      'Uma coluna do pandas tem o método .corr() que mede a relação com outra coluna.',
      "Pegue as duas colunas: dados['temperatura'] e dados['vendas'].",
      "Junte: dados['temperatura'].corr(dados['vendas']).",
    ],
    solution: `def correlacao_temp_vendas(dados):
    return dados['temperatura'].corr(dados['vendas'])
`,
    interrogation: [
      {
        q: 'Cliente: "deu 0,8 de correlação. Isso quer dizer o quê?"',
        options: [
          'Que o calor causa 80% das vendas',
          'Que temperatura e vendas sobem juntas com força',
          'Que 80 dias tiveram calor',
        ],
        correct: 1,
      },
      {
        q: 'Se a correlação desse perto de 0, o que você diria?',
        options: [
          'Que temperatura e vendas quase não andam juntas',
          'Que os dados estão errados',
          'Que vende mais no frio, com certeza',
        ],
        correct: 0,
      },
      {
        q: 'Correlação alta prova que o calor CAUSA as vendas?',
        options: [
          'Não — mostra que andam juntas, não que uma causa a outra',
          'Sim, correlação é o mesmo que causa',
          'Só se passar de 0,9',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'faxina-cadastro',
    emoji: '🧹',
    titulo: 'A lista bagunçada',
    setor: 'varejo',
    skillId: 'limpar',
    briefing:
      'O Seu Joaquim começou a anotar os clientes fiéis, mas a lista veio cheia de buracos — ' +
      'gente sem idade, sem gasto anotado. Antes de usar esses dados, alguém precisa saber o ' +
      'tamanho da bagunça. Quantas informações estão faltando na tabela inteira?',
    metaLabel: 'Contar quantas células estão vazias (faltantes)',
    payout: 300,
    reputacao: 10,
    prereqContractIds: ['analise-clima'],
    datasetUrl: DATASET('clientes.csv'),
    starterCode: `def total_faltantes(dados):
    # dados: tabela de clientes com algumas células vazias (faltantes).
    # Devolva quantas células estão faltando no total.
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      {
        name: 'total_faltantes(dados) devolve um número inteiro',
        hidden: false,
        code: `_r = total_faltantes(dados)
assert _r is not None, "A fun\\u00e7\\u00e3o retornou None \\u2014 faltou o return?"
assert int(_r) == _r, "O total de faltantes \\u00e9 um n\\u00famero inteiro"
`,
      },
      {
        name: 'Conta certo os faltantes da tabela',
        hidden: true,
        code: `_r = int(total_faltantes(dados))
assert _r == int(dados.isnull().sum().sum())
`,
      },
    ],
    metricsCode: `_r = int(total_faltantes(dados))
_ne_result = {
    "C\\u00e9lulas faltando": _r,
    "Total de c\\u00e9lulas": int(dados.size),
}
`,
    hints: [
      'O método .isnull() marca com True cada célula vazia da tabela.',
      'Somando com .sum() duas vezes você conta todas as células True da tabela inteira.',
      'Junte: dados.isnull().sum().sum() e converta para int.',
    ],
    solution: `def total_faltantes(dados):
    return int(dados.isnull().sum().sum())
`,
    interrogation: [
      {
        q: 'Cliente: "por que se preocupar com esses campos vazios?"',
        options: [
          'Porque a maioria dos modelos quebra ou erra feio com dados faltando',
          'Porque campo vazio deixa a tabela feia',
          'Não tem problema nenhum, pode ignorar',
        ],
        correct: 0,
      },
      {
        q: 'Contou as células vazias. Qual o passo seguinte antes de treinar um modelo?',
        options: [
          'Decidir o que fazer com elas (preencher ou remover)',
          'Ignorar e treinar assim mesmo',
          'Apagar a tabela e pedir outra',
        ],
        correct: 0,
      },
      {
        q: 'Por que somar .isnull() duas vezes (.sum().sum())?',
        options: [
          'A 1ª soma conta por coluna; a 2ª junta as colunas no total da tabela',
          'Pra garantir que o número dobra',
          'Porque o pandas exige sempre dois .sum()',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'previsao-padaria',
    emoji: '🥖',
    titulo: 'Padaria do Seu Joaquim',
    setor: 'varejo',
    skillId: 'regressao',
    briefing:
      'O Seu Joaquim confia em você agora e quer o pulo do gato: parar de jogar pão fora. ' +
      'Ele anotou, por 60 dias, a temperatura, se era fim de semana e se tinha promoção. ' +
      'Preveja quantos pães ele vai vender nos próximos dias. Errar por até 8 pães em média, ele aceita.',
    metaLabel: 'MAE ≤ 8 nos 12 dias de entrega',
    payout: 420,
    reputacao: 12,
    prereqContractIds: ['faxina-cadastro'],
    minHardware: 1, // treinar regressão de verdade pede o PC Gamer (Fase 2: hardware com função)
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
    interrogation: [
      {
        q: 'Cliente: "por que você separou uns dias e não usou todos pra treinar?"',
        options: [
          'Pra testar o modelo em dias que ele nunca viu e saber se ele acerta de verdade',
          'Pra treinar mais rápido',
          'Porque sobra dado, não faz diferença',
        ],
        correct: 0,
      },
      {
        q: 'Cliente: "esse MAE de 6 pães significa o quê pro meu negócio?"',
        options: [
          'Que erro, em média, uns 6 pães pra mais ou pra menos por dia',
          'Que acerto 6% das vezes',
          'Que vou perder 6 reais por dia',
        ],
        correct: 0,
      },
      {
        q: 'O modelo acertou o treino em cheio, mas errou feio nos dias novos. O que houve?',
        options: [
          'Decorou o treino e não generaliza (overfitting)',
          'Os dias novos vieram com dados errados',
          'Regressão linear nunca erra',
        ],
        correct: 0,
      },
    ],
  },
]

// Contrato-relâmpago diário (GDD §7.2): 3 min, mantém streak e reputação.
export const RELAMPAGO: Contract = {
  id: 'relampago-diario',
  emoji: '⚡',
  titulo: 'Relâmpago do dia',
  setor: 'varejo',
  skillId: 'ler',
  briefing:
    'Trabalho rápido pra manter a máquina girando: o Seu Joaquim só quer o maior número de ' +
    'vendas registrado no caderninho. Devolva o valor máximo da coluna de vendas.',
  metaLabel: 'Devolver o maior valor de vendas',
  payout: 40,
  reputacao: 1,
  prereqContractIds: [],
  datasetUrl: DATASET('padaria.csv'),
  starterCode: `def maior_venda(dados):
    # Devolva o maior valor da coluna 'vendas'.
    ...
`,
  setupCode: SETUP_LER,
  tests: [
    {
      name: 'Devolve um número',
      hidden: false,
      code: `_r = maior_venda(dados)
assert _r is not None, "Faltou o return?"
float(_r)
`,
    },
    {
      name: 'É o máximo certo',
      hidden: true,
      code: `assert abs(float(maior_venda(dados)) - float(dados["vendas"].max())) < 0.01
`,
    },
  ],
  metricsCode: `_ne_result = {"Maior venda": round(float(maior_venda(dados)), 1)}
`,
  hints: ["Uma coluna tem o método .max(): dados['vendas'].max()."],
  solution: `def maior_venda(dados):
    return dados['vendas'].max()
`,
  interrogation: [],
}

// ---------------------------------------------------------------- Runa do Código (katas)
// Prática guiada (GDD §5.1): menor que o boss, com dicas — treina a mão antes da Prova.
// Sem pagamento/interrogatório; concluir marca a runa 'codigo'. Corretos por construção.
export const KATAS_CH1: Contract[] = [
  {
    id: 'kata-ler',
    emoji: '📖',
    titulo: 'Kata · Ler Dados',
    setor: 'varejo',
    skillId: 'ler',
    briefing: 'Aquecimento: quantos dias o Seu Joaquim anotou no caderninho? Devolva o número de linhas da tabela.',
    metaLabel: 'Devolver o número de linhas',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `def numero_de_dias(dados):
    # Devolva quantas linhas a tabela tem.
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      { name: 'Devolve um número inteiro', hidden: false, code: `_r = numero_de_dias(dados)\nassert _r is not None, "Faltou o return?"\nassert int(_r) == _r\n` },
      { name: 'É a contagem certa de linhas', hidden: true, code: `assert int(numero_de_dias(dados)) == int(len(dados))\n` },
    ],
    metricsCode: `_ne_result = {"Linhas": int(numero_de_dias(dados))}\n`,
    hints: ['len(x) devolve o tamanho de uma lista ou tabela.', 'Numa tabela do pandas, len(dados) já dá o número de linhas.'],
    solution: `def numero_de_dias(dados):
    return len(dados)
`,
    interrogation: [],
  },
  {
    id: 'kata-explorar',
    emoji: '🌡️',
    titulo: 'Kata · Explorar Dados',
    setor: 'varejo',
    skillId: 'explorar',
    briefing: 'Aquecimento: qual foi a temperatura média nesses dias? Devolva a média da coluna temperatura.',
    metaLabel: 'Devolver a média da temperatura',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `def media_temperatura(dados):
    # Devolva a média da coluna 'temperatura'.
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      { name: 'Devolve um número', hidden: false, code: `_r = media_temperatura(dados)\nassert _r is not None, "Faltou o return?"\nfloat(_r)\n` },
      { name: 'É a média certa da temperatura', hidden: true, code: `assert abs(float(media_temperatura(dados)) - float(dados["temperatura"].mean())) < 0.01\n` },
    ],
    metricsCode: `_ne_result = {"Temperatura média": round(float(media_temperatura(dados)), 1)}\n`,
    hints: ["Acesse a coluna com dados['temperatura'].", "Some o método .mean(): dados['temperatura'].mean()."],
    solution: `def media_temperatura(dados):
    return dados['temperatura'].mean()
`,
    interrogation: [],
  },
  {
    id: 'kata-limpar',
    emoji: '🧽',
    titulo: 'Kata · Limpar Dados',
    setor: 'varejo',
    skillId: 'limpar',
    briefing: 'Aquecimento: na lista de clientes, quantos estão SEM a idade preenchida? Conte os faltantes só da coluna idade.',
    metaLabel: 'Contar faltantes na coluna idade',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('clientes.csv'),
    starterCode: `def idades_faltando(dados):
    # Devolva quantas células da coluna 'idade' estão vazias (faltando).
    ...
`,
    setupCode: SETUP_LER,
    tests: [
      { name: 'Devolve um número inteiro', hidden: false, code: `_r = idades_faltando(dados)\nassert _r is not None, "Faltou o return?"\nassert int(_r) == _r\n` },
      { name: 'Conta certo os faltantes da coluna idade', hidden: true, code: `assert int(idades_faltando(dados)) == int(dados["idade"].isnull().sum())\n` },
    ],
    metricsCode: `_ne_result = {"Idades faltando": int(idades_faltando(dados))}\n`,
    hints: ["dados['idade'].isnull() marca True onde falta.", "Some com .sum(): dados['idade'].isnull().sum() e converta para int."],
    solution: `def idades_faltando(dados):
    return int(dados['idade'].isnull().sum())
`,
    interrogation: [],
  },
  {
    id: 'kata-regressao',
    emoji: '📈',
    titulo: 'Kata · Regressão',
    setor: 'varejo',
    skillId: 'regressao',
    briefing: 'Aquecimento antes da Prova: treine um LinearRegression e devolva as previsões para os dias novos. Aqui não cobramos a meta — só fazer o modelo prever.',
    metaLabel: 'Devolver uma previsão para cada dia novo',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('padaria.csv'),
    starterCode: `from sklearn.linear_model import LinearRegression

def prever(dados_treino, dados_novos):
    # 1. X = colunas de entrada, y = vendas (de dados_treino)
    # 2. modelo = LinearRegression().fit(X, y)
    # 3. devolva modelo.predict(dados_novos)
    ...
`,
    setupCode: SETUP_REGRESSAO,
    tests: [
      { name: 'Uma previsão para cada dia novo', hidden: false, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos)).ravel()\nassert len(_r) == len(dados_novos)\n` },
      { name: 'As previsões são números válidos', hidden: true, code: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos), dtype=float).ravel()\nassert np.isfinite(_r).all()\n` },
    ],
    metricsCode: `import numpy as np\n_r = np.asarray(prever(dados_treino, dados_novos), dtype=float).ravel()\n_ne_result = {"Previs\\u00f5es feitas": int(len(_r))}\n`,
    hints: [
      'Colunas de entrada: ["temperatura", "fim_de_semana", "promocao"]. Alvo: "vendas".',
      'X = dados_treino[colunas]; y = dados_treino["vendas"].',
      'modelo = LinearRegression(); modelo.fit(X, y); return modelo.predict(dados_novos[colunas]).',
    ],
    solution: `from sklearn.linear_model import LinearRegression

def prever(dados_treino, dados_novos):
    colunas = ["temperatura", "fim_de_semana", "promocao"]
    modelo = LinearRegression()
    modelo.fit(dados_treino[colunas], dados_treino["vendas"])
    return modelo.predict(dados_novos[colunas])
`,
    interrogation: [],
  },
]

// ---------------------------------------------------------------- Contratos do bairro (repetíveis)
// GDD §7.2: contrato-padrão que dá renda contínua + replay. Reusa a TAREFA de um boss
// já verificado (mesmo setup/testes), só troca a história — corretude herdada.
const clone = (bossId: string, over: Partial<Contract>): Contract => {
  const base = CONTRACTS_CH1.find((c) => c.id === bossId)!
  return { ...base, repeatable: true, interrogation: [], ...over }
}

export const REPEATABLE: Contract[] = [
  clone('boletim-padaria', {
    id: 'bairro-mercadinho',
    emoji: '🏪',
    titulo: 'Mercadinho da Esquina',
    briefing:
      'Correu a fama do seu boletim. A dona do mercadinho quer a mesma coisa: a média de ' +
      'vendas do caderno dela. Trabalho de rotina, paga na hora.',
    metaLabel: 'Devolver a média de vendas',
    payout: 110,
    reputacao: 2,
    prereqContractIds: ['boletim-padaria'],
  }),
  clone('analise-clima', {
    id: 'bairro-sorveteria',
    emoji: '🍦',
    titulo: 'Sorveteria do Gelo',
    briefing:
      'A sorveteria jura que vende mais no calor. Rode a mesma análise de correlação entre ' +
      'temperatura e vendas pra eles. Serviço rápido, cliente fiel.',
    metaLabel: 'Devolver a correlação temperatura × vendas',
    payout: 150,
    reputacao: 2,
    prereqContractIds: ['analise-clima'],
  }),
]

// ---------------------------------------------------------------- Aulas de código (ensino)
// GDD §3/§12: ensina o Python de verdade — "qual código colocar", linha a linha.
// Mapa por id do contrato (evita editar cada objeto). Aberta por padrão na Runa do Código.
export const LESSONS_CH1: Record<string, Lesson> = {
  'kata-ler': {
    intro: 'A tabela chega na variável `dados` (um DataFrame do pandas). Você só precisa contar as linhas.',
    passos: [
      { code: 'def numero_de_dias(dados):', explica: 'Comece definindo a função com o nome exato que o teste espera.' },
      { code: '    return len(dados)', explica: 'len(dados) conta quantas linhas a tabela tem. O return devolve esse número.' },
    ],
  },
  'boletim-padaria': {
    intro: 'Média = somar tudo e dividir pela quantidade. O pandas faz isso com .mean().',
    passos: [
      { code: 'def media_de_vendas(dados):', explica: 'A função recebe a tabela em `dados`.' },
      { code: "    return dados['vendas'].mean()", explica: "dados['vendas'] pega só a coluna de vendas; .mean() calcula a média dela." },
    ],
  },
  'kata-explorar': {
    intro: 'Mesma ideia da média, mas agora na coluna da temperatura.',
    passos: [
      { code: 'def media_temperatura(dados):', explica: 'Recebe a tabela.' },
      { code: "    return dados['temperatura'].mean()", explica: "Pega a coluna 'temperatura' e tira a média com .mean()." },
    ],
  },
  'analise-clima': {
    intro: 'Correlação mede se duas colunas sobem/descem juntas. O pandas tem .corr() para isso.',
    passos: [
      { code: 'def correlacao_temp_vendas(dados):', explica: 'Recebe a tabela.' },
      { code: "    return dados['temperatura'].corr(dados['vendas'])", explica: "Pega a coluna temperatura e pede a correlação dela com a coluna vendas. Resultado entre -1 e 1." },
    ],
  },
  'kata-limpar': {
    intro: 'Célula vazia no pandas é NaN. .isnull() acha, .sum() conta.',
    passos: [
      { code: 'def idades_faltando(dados):', explica: 'Recebe a tabela.' },
      { code: "    return int(dados['idade'].isnull().sum())", explica: "isnull() marca True onde falta; .sum() soma os True (conta); int() deixa como número inteiro." },
    ],
  },
  'faxina-cadastro': {
    intro: 'Agora conte os faltantes da tabela INTEIRA, não de uma coluna só — por isso dois .sum().',
    passos: [
      { code: 'def total_faltantes(dados):', explica: 'Recebe a tabela.' },
      { code: '    return int(dados.isnull().sum().sum())', explica: 'O primeiro .sum() conta por coluna; o segundo soma todas as colunas → total da tabela.' },
    ],
  },
  'kata-regressao': {
    intro: 'Treinar um modelo é sempre o mesmo ritual: escolher as colunas, criar o modelo, .fit() (treinar) e .predict() (prever).',
    passos: [
      { code: 'from sklearn.linear_model import LinearRegression', explica: 'Traz o modelo de regressão do scikit-learn.' },
      { code: 'def prever(dados_treino, dados_novos):', explica: 'Recebe os dados de treino e os dias novos.' },
      { code: '    colunas = ["temperatura", "fim_de_semana", "promocao"]', explica: 'As colunas de entrada que o modelo usa para prever.' },
      { code: '    modelo = LinearRegression()', explica: 'Cria o modelo (ainda vazio).' },
      { code: '    modelo.fit(dados_treino[colunas], dados_treino["vendas"])', explica: 'Treina: aprende a relação entre as colunas e as vendas.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Usa o modelo treinado para prever as vendas dos dias novos.' },
    ],
  },
  'previsao-padaria': {
    intro: 'Mesmo ritual do treino da runa, agora valendo: escolher colunas, criar, treinar (.fit) e prever (.predict).',
    passos: [
      { code: 'from sklearn.linear_model import LinearRegression', explica: 'Importa o modelo.' },
      { code: 'def prever_vendas(dados_treino, dados_novos):', explica: 'Recebe treino e os dias a prever.' },
      { code: '    colunas = ["temperatura", "fim_de_semana", "promocao"]', explica: 'Entradas do modelo.' },
      { code: '    X = dados_treino[colunas]', explica: 'X = as colunas de entrada do treino.' },
      { code: '    y = dados_treino["vendas"]', explica: 'y = o que queremos prever (vendas).' },
      { code: '    modelo = LinearRegression()', explica: 'Cria o modelo.' },
      { code: '    modelo.fit(X, y)', explica: 'Treina com X e y.' },
      { code: '    return modelo.predict(dados_novos[colunas])', explica: 'Prevê as vendas dos dias novos.' },
    ],
  },
}
