// Conteúdo do Capítulo 5 "Redes Neurais" (Tier 5, GDD §6) — 1ª skill: Perceptron e MLP.
// Diferença das skills Python: o código do jogador não define função nomeada chamada pelos
// testes — no runtime TF.js (runtime: 'tfjs'), setupCode/starterCode/tests/metricsCode são
// corpos de função que recebem (ns, tf[, csv]) e se comunicam via atribuição direta em `ns`
// (ns.model = ...), não via exec num dict (ver src/tfjs/worker.ts).
import type { Contract } from '../../engine/contracts'
import type { SkillDef, Lesson } from '../content'

const DATASET = (name: string) => `${import.meta.env.BASE_URL}datasets/${name}`

export const SKILLS_CH5: SkillDef[] = [
  {
    id: 'perceptron-mlp',
    nome: 'Perceptron e MLP',
    desc: 'Neurônio, camadas, ativações — a rede aprende fronteiras que uma reta não alcança.',
    contractId: 'cancelamento-neurostream',
    kataId: 'kata-perceptron-mlp',
    prereqSkillIds: ['reducao-dimensionalidade'],
  },
]

// Setup compartilhado entre kata e boss: parse manual do CSV (sem pandas), normaliza as 2
// features pra caber entre 0 e 1 (facilita o treino sem introduzir feature-engineering como
// conceito novo desta skill). Últimas 12 linhas = holdout oculto.
const SETUP_NEUROSTREAM = `const linhas = csv.trim().split('\\n').slice(1)
const parse = (l) => {
  const [horas, valor, cancelou] = l.split(',').map(Number)
  return [horas / 60, valor / 100, cancelou]
}
const treino = linhas.slice(0, -12).map(parse)
const holdout = linhas.slice(-12).map(parse)
ns.xsTreino = tf.tensor2d(treino.map((r) => [r[0], r[1]]))
ns.ysTreino = tf.tensor2d(treino.map((r) => [r[2]]))
ns.xsNovos = tf.tensor2d(holdout.map((r) => [r[0], r[1]]))
ns.holdoutLabels = holdout.map((r) => r[2])
`

export const CONTRACTS_CH5: Contract[] = [
  {
    id: 'cancelamento-neurostream',
    emoji: '🧠',
    titulo: 'NeuroStream',
    setor: 'tech',
    skillId: 'perceptron-mlp',
    runtime: 'tfjs',
    briefing:
      'A NeuroStream quer entender por que clientes cancelam — mas o padrão não é óbvio: ' +
      'não é "quem usa pouco cancela". É quem usa MUITO e paga POUCO, ou usa POUCO e paga MUITO — ' +
      'o desalinhado que cancela. Uma régua reta não separa isso. Você vai precisar de uma rede.',
    metaLabel: 'Acurácia ≥ 80% nos 12 clientes de entrega',
    payout: 780,
    reputacao: 25,
    prereqContractIds: ['reducao-biomarcadores'],
    datasetUrl: DATASET('neurostream.csv'),
    starterCode: `// ns.xsTreino: tensor 48x2 (horas_por_mes/60, valor_plano/100)
// ns.ysTreino: tensor 48x1 (0 = fica, 1 = cancela)
// ns.xsNovos:  tensor 12x2 (clientes novos, mesma normalização)
//
// 1. Monte um modelo em sequência com uma camada ESCONDIDA (mais de 1 neurônio) antes da
//    saída — um perceptron só com a camada de saída não separa esse padrão, precisa dobrar
//    a fronteira.
// 2. Compile com um otimizador e loss de classificação binária.
// 3. Treine com ns.xsTreino / ns.ysTreino.
// 4. Guarde o modelo treinado em ns.model.

ns.model = tf.sequential()
`,
    setupCode: SETUP_NEUROSTREAM,
    tests: [
      {
        name: 'ns.model existe e prevê um valor por cliente novo',
        hidden: false,
        code: `if (!ns.model) throw new Error("ns.model não foi definido — faltou treinar e guardar o modelo?")
const preds = ns.model.predict(ns.xsNovos).arraySync()
if (preds.length !== 12) throw new Error("Esperava 12 previsões (uma por cliente novo), veio " + preds.length)
`,
      },
      {
        name: 'As previsões são probabilidades entre 0 e 1',
        hidden: false,
        code: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => p[0])
preds.forEach((p) => {
  if (p < 0 || p > 1) throw new Error("Previsão fora do intervalo 0-1 — a camada de saída usa ativação sigmoid?")
})
`,
      },
      {
        name: 'Teste oculto: o modelo realmente separa os dois grupos',
        hidden: true,
        code: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => Math.round(p[0]))
const distintos = new Set(preds)
if (distintos.size < 2) throw new Error("O modelo previu sempre a mesma classe — não separou os dois grupos")
`,
      },
      {
        name: 'Teste oculto: entrega dentro da meta (acurácia ≥ 80%)',
        hidden: true,
        code: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => Math.round(p[0]))
let acertos = 0
preds.forEach((p, i) => { if (p === ns.holdoutLabels[i]) acertos++ })
const acc = acertos / preds.length
if (acc < 0.8) throw new Error("acurácia = " + Math.round(acc * 100) + "%")
`,
      },
    ],
    metricsCode: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => Math.round(p[0]))
let acertos = 0
preds.forEach((p, i) => { if (p === ns.holdoutLabels[i]) acertos++ })
const acc = acertos / preds.length
ns.result = { "Acurácia na entrega": Math.round(acc * 100) + "%", "Meta do contrato": "≥ 80%" }
`,
    hints: [
      'As duas colunas de entrada já normalizadas são horas_por_mes/60 e valor_plano/100 (em ns.xsTreino). O alvo é cancelou (em ns.ysTreino).',
      'Um perceptron sem camada escondida (só uma dense de saída) desenha uma reta — não separa esse padrão. Adicione uma tf.layers.dense com MAIS de 1 neurônio ANTES da camada de saída.',
      'ns.model = tf.sequential(); ns.model.add(tf.layers.dense({units: 8, activation: "tanh", inputShape: [2]})); ns.model.add(tf.layers.dense({units: 1, activation: "sigmoid"})); ns.model.compile({optimizer: tf.train.adam(0.05), loss: "binaryCrossentropy"}); await ns.model.fit(ns.xsTreino, ns.ysTreino, {epochs: 300, verbose: 0}).',
    ],
    solution: `ns.model = tf.sequential()
ns.model.add(tf.layers.dense({ units: 8, activation: 'tanh', inputShape: [2] }))
ns.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
ns.model.compile({ optimizer: tf.train.adam(0.05), loss: 'binaryCrossentropy' })
await ns.model.fit(ns.xsTreino, ns.ysTreino, { epochs: 300, verbose: 0 })
`,
    interrogation: [
      {
        q: 'Por que um Perceptron sozinho (sem camada escondida) não consegue separar esse padrão de cancelamento?',
        options: [
          'O padrão não é linearmente separável — uma única reta não consegue isolar "desalinhados" de "alinhados"',
          'Porque o Perceptron só aceita uma feature de entrada',
          'Porque faltam dados de treino',
        ],
        correct: 0,
      },
      {
        q: 'O que a camada escondida faz de diferente da camada de saída?',
        options: [
          'Aprende combinações não-lineares das entradas (via uma ativação não-linear, como tanh), que a camada de saída depois combina numa decisão final',
          'Só guarda os dados brutos sem processar nada',
          'Serve só pra deixar o modelo mais lento',
        ],
        correct: 0,
      },
      {
        q: 'Por que a camada de saída usa ativação sigmoid?',
        options: [
          'Comprime o resultado pra um valor entre 0 e 1, interpretável como probabilidade de cancelar',
          'Porque ReLU não existe em camadas de saída',
          'É só uma convenção de nome, não muda o resultado',
        ],
        correct: 0,
      },
    ],
  },
]

export const KATAS_CH5: Contract[] = [
  {
    id: 'kata-perceptron-mlp',
    emoji: '🔓',
    titulo: 'Kata · Perceptron e MLP',
    setor: 'tech',
    skillId: 'perceptron-mlp',
    runtime: 'tfjs',
    briefing:
      'Aquecimento antes da Prova: monte uma rede com camada escondida e treine pra separar ' +
      'os clientes desalinhados dos alinhados. Aqui não cobramos a meta de acurácia — só separar de verdade.',
    metaLabel: 'Prever 0 ou 1 pra cada cliente novo, separando os dois grupos',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('neurostream.csv'),
    starterCode: `// 1. ns.model = tf.sequential() com uma camada escondida (>1 neurônio) + saída sigmoid
// 2. compile + fit com ns.xsTreino / ns.ysTreino
// 3. guarde o modelo em ns.model

ns.model = tf.sequential()
`,
    setupCode: SETUP_NEUROSTREAM,
    tests: [
      {
        name: 'Uma previsão por cliente novo',
        hidden: false,
        code: `const preds = ns.model.predict(ns.xsNovos).arraySync()
if (preds.length !== 12) throw new Error("Esperava 12 previsões, veio " + preds.length)
`,
      },
      {
        name: 'O modelo separa os dois grupos (não prevê sempre igual)',
        hidden: true,
        code: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => Math.round(p[0]))
if (new Set(preds).size < 2) throw new Error("Previu sempre a mesma classe")
`,
      },
    ],
    metricsCode: `const preds = ns.model.predict(ns.xsNovos).arraySync().map((p) => Math.round(p[0]))
ns.result = { "Previsões feitas": preds.length }
`,
    hints: [
      'As entradas normalizadas estão em ns.xsTreino/ns.xsNovos, o alvo em ns.ysTreino.',
      'Sem camada escondida (só uma dense de saída) não dá — adicione uma tf.layers.dense com mais de 1 neurônio antes da saída.',
    ],
    solution: `ns.model = tf.sequential()
ns.model.add(tf.layers.dense({ units: 8, activation: 'tanh', inputShape: [2] }))
ns.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
ns.model.compile({ optimizer: tf.train.adam(0.05), loss: 'binaryCrossentropy' })
await ns.model.fit(ns.xsTreino, ns.ysTreino, { epochs: 300, verbose: 0 })
`,
    interrogation: [],
  },
]

export const LESSONS_CH5: Record<string, Lesson> = {
  'kata-perceptron-mlp': {
    intro:
      'Um neurônio sozinho (Perceptron) só separa dados com uma reta. Empilhando uma camada ' +
      'escondida antes da saída, a rede consegue dobrar essa fronteira e separar padrões mais ' +
      'complicados, como "desalinhados cancelam".',
    passos: [
      { code: 'ns.model = tf.sequential()', explica: 'Cria um modelo em sequência de camadas.' },
      {
        code: "ns.model.add(tf.layers.dense({ units: 8, activation: 'tanh', inputShape: [2] }))",
        explica: 'Camada escondida: 8 neurônios, aprende combinações não-lineares das 2 entradas.',
      },
      {
        code: "ns.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))",
        explica: 'Camada de saída: comprime tudo num valor entre 0 e 1 (probabilidade de cancelar).',
      },
      {
        code: "ns.model.compile({ optimizer: tf.train.adam(0.05), loss: 'binaryCrossentropy' })",
        explica: 'Define como o modelo aprende (Adam) e como mede o erro (classificação binária).',
      },
      {
        code: 'await ns.model.fit(ns.xsTreino, ns.ysTreino, { epochs: 300, verbose: 0 })',
        explica: 'Treina a rede — ajusta os pesos por 300 rodadas até aprender o padrão.',
      },
    ],
  },
  'cancelamento-neurostream': {
    intro:
      'Mesmo ritual da runa, agora valendo: montar a rede com camada escondida, compilar, ' +
      'treinar e guardar o modelo em ns.model.',
    passos: [
      { code: 'ns.model = tf.sequential()', explica: 'Modelo em sequência de camadas.' },
      {
        code: "ns.model.add(tf.layers.dense({ units: 8, activation: 'tanh', inputShape: [2] }))",
        explica: 'Camada escondida — sem ela, a rede vira um Perceptron simples e não separa o padrão.',
      },
      {
        code: "ns.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))",
        explica: 'Saída: probabilidade de cancelar, entre 0 e 1.',
      },
      {
        code: "ns.model.compile({ optimizer: tf.train.adam(0.05), loss: 'binaryCrossentropy' })",
        explica: 'Adam + erro de classificação binária.',
      },
      {
        code: 'await ns.model.fit(ns.xsTreino, ns.ysTreino, { epochs: 300, verbose: 0 })',
        explica: '300 épocas de treino sobre os 48 clientes conhecidos.',
      },
    ],
  },
}
