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
  {
    id: 'backpropagation',
    nome: 'Backpropagation',
    desc: 'Gradiente descendente, regra da cadeia — como a rede aprende com o próprio erro.',
    contractId: 'backprop-neurostream',
    kataId: 'kata-backpropagation',
    prereqSkillIds: ['perceptron-mlp'],
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

// Setup compartilhado entre kata e boss desta skill: lê o único exemplo do CSV e define os
// parâmetros fixos da rede de bancada (1 entrada -> 1 neurônio escondido com tanh -> 1 saída
// linear) — determinístico, sem aleatoriedade, pra dar pra verificar o resultado com precisão.
const SETUP_BACKPROP = `const linhas = csv.trim().split('\\n').slice(1)
const [x, y] = linhas[0].split(',').map(Number)
ns.x = x
ns.y = y
ns.w1 = 0.5
ns.b1 = 0.1
ns.w2 = -0.3
ns.b2 = 0.2
ns.lr = 0.1
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
  {
    id: 'backprop-neurostream',
    emoji: '🔄',
    titulo: 'NeuroStream',
    setor: 'tech',
    skillId: 'backpropagation',
    runtime: 'tfjs',
    briefing:
      'O time de pesquisa da NeuroStream quer confirmar que você entende backpropagation antes ' +
      'de liberar redes maiores pra você mexer. Pegue essa rede de bancada (1 entrada, 1 neurônio ' +
      'escondido, 1 saída) e um único exemplo de teste — calcule a passada pra frente, o erro, os ' +
      'gradientes pela regra da cadeia, e atualize os 4 parâmetros à mão.',
    metaLabel: 'Atualizar os 4 parâmetros com o passo de gradiente descendente correto',
    payout: 850,
    reputacao: 28,
    prereqContractIds: ['cancelamento-neurostream'],
    datasetUrl: DATASET('backprop-neurostream.csv'),
    starterCode: `// Rede de bancada: x -> (w1,b1) -> z1 -> tanh -> h1 -> (w2,b2) -> z2 -> yhat (saída linear)
// ns.x, ns.y: entrada e alvo do exemplo de teste
// ns.w1, ns.b1, ns.w2, ns.b2: parâmetros atuais (fixos, vindos do setup)
// ns.lr: taxa de aprendizado
//
// 1. Forward pass: z1 = w1*x+b1; h1 = tanh(z1); yhat = w2*h1+b2
// 2. Gradiente da saída: dL/dz2 = yhat - y (perda é 0.5*(yhat-y)^2, saída linear)
// 3. Gradiente da camada escondida (regra da cadeia): dL/dz1 = (dL/dz2 * w2) * (1 - h1^2)
// 4. Atualize os 4 parâmetros: novo = atual - lr * gradiente, e guarde em
//    ns.w1Novo / ns.b1Novo / ns.w2Novo / ns.b2Novo

`,
    setupCode: SETUP_BACKPROP,
    tests: [
      {
        name: 'Os 4 parâmetros atualizados existem e são números',
        hidden: false,
        code: `;['w1Novo', 'b1Novo', 'w2Novo', 'b2Novo'].forEach((k) => {
  if (typeof ns[k] !== 'number' || Number.isNaN(ns[k])) throw new Error('ns.' + k + ' não foi definido como número — faltou calcular e guardar a atualização?')
})
`,
      },
      {
        name: 'A atualização realmente mudou os parâmetros',
        hidden: false,
        code: `if (ns.w1Novo === ns.w1 && ns.b1Novo === ns.b1 && ns.w2Novo === ns.w2 && ns.b2Novo === ns.b2) {
  throw new Error("Os parâmetros não mudaram — o gradiente foi calculado e aplicado?")
}
`,
      },
      {
        name: 'Teste oculto: w1Novo e b1Novo batem com o gradiente calculado à mão',
        hidden: true,
        code: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhat = ns.w2 * h1 + ns.b2
const dL_dz2 = yhat - ns.y
const dL_dh1 = dL_dz2 * ns.w2
const dh1_dz1 = 1 - h1 * h1
const dL_dz1 = dL_dh1 * dh1_dz1
const dL_dw1 = dL_dz1 * ns.x
const dL_db1 = dL_dz1
const w1Esperado = ns.w1 - ns.lr * dL_dw1
const b1Esperado = ns.b1 - ns.lr * dL_db1
if (Math.abs(ns.w1Novo - w1Esperado) > 1e-4) throw new Error('w1Novo incorreto: esperado ~' + w1Esperado.toFixed(4) + ', veio ' + ns.w1Novo)
if (Math.abs(ns.b1Novo - b1Esperado) > 1e-4) throw new Error('b1Novo incorreto: esperado ~' + b1Esperado.toFixed(4) + ', veio ' + ns.b1Novo)
`,
      },
      {
        name: 'Teste oculto: w2Novo e b2Novo batem com o gradiente calculado à mão',
        hidden: true,
        code: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhat = ns.w2 * h1 + ns.b2
const dL_dz2 = yhat - ns.y
const dL_dw2 = dL_dz2 * h1
const dL_db2 = dL_dz2
const w2Esperado = ns.w2 - ns.lr * dL_dw2
const b2Esperado = ns.b2 - ns.lr * dL_db2
if (Math.abs(ns.w2Novo - w2Esperado) > 1e-4) throw new Error('w2Novo incorreto: esperado ~' + w2Esperado.toFixed(4) + ', veio ' + ns.w2Novo)
if (Math.abs(ns.b2Novo - b2Esperado) > 1e-4) throw new Error('b2Novo incorreto: esperado ~' + b2Esperado.toFixed(4) + ', veio ' + ns.b2Novo)
`,
      },
    ],
    metricsCode: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhatAntes = ns.w2 * h1 + ns.b2
const lossAntes = 0.5 * (yhatAntes - ns.y) ** 2

const z1n = ns.w1Novo * ns.x + ns.b1Novo
const h1n = Math.tanh(z1n)
const yhatDepois = ns.w2Novo * h1n + ns.b2Novo
const lossDepois = 0.5 * (yhatDepois - ns.y) ** 2

ns.result = { "Erro antes do passo": lossAntes.toFixed(4), "Erro depois do passo": lossDepois.toFixed(4) }
`,
    hints: [
      'Forward pass: z1 = ns.w1*ns.x+ns.b1; h1 = Math.tanh(z1); yhat = ns.w2*h1+ns.b2.',
      'Gradiente da saída (perda 0.5*(yhat-y)^2, saída linear): dL/dz2 = yhat - ns.y. dL/dw2 = dL/dz2*h1. dL/db2 = dL/dz2.',
      'Regra da cadeia pra camada escondida: dL/dh1 = dL/dz2*ns.w2; dh1_dz1 = 1-h1*h1; dL/dz1 = dL/dh1*dh1_dz1. dL/dw1 = dL/dz1*ns.x. dL/db1 = dL/dz1. Depois: novo = atual - ns.lr*gradiente.',
    ],
    solution: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhat = ns.w2 * h1 + ns.b2

const dL_dz2 = yhat - ns.y
const dL_dw2 = dL_dz2 * h1
const dL_db2 = dL_dz2

const dL_dh1 = dL_dz2 * ns.w2
const dh1_dz1 = 1 - h1 * h1
const dL_dz1 = dL_dh1 * dh1_dz1
const dL_dw1 = dL_dz1 * ns.x
const dL_db1 = dL_dz1

ns.w1Novo = ns.w1 - ns.lr * dL_dw1
ns.b1Novo = ns.b1 - ns.lr * dL_db1
ns.w2Novo = ns.w2 - ns.lr * dL_dw2
ns.b2Novo = ns.b2 - ns.lr * dL_db2
`,
    interrogation: [
      {
        q: 'Por que dL/dz2 depende do erro (yhat - y)?',
        options: [
          'Porque essa é a derivada da função de perda (erro quadrático) em relação à previsão — o erro guia a direção da correção',
          'Porque é uma convenção arbitrária de nomenclatura',
          'Porque z2 sempre é igual ao erro',
        ],
        correct: 0,
      },
      {
        q: 'Por que o gradiente da camada escondida (dL/dz1) usa o peso w2 multiplicado pela derivada da ativação (tanh)?',
        options: [
          "É a regra da cadeia: o erro que chega na saída passa 'de volta' através do peso que conecta as camadas e da inclinação da ativação daquele ponto",
          'Porque w2 sempre é igual à derivada',
          'Porque a ordem das camadas não importa pro cálculo',
        ],
        correct: 0,
      },
      {
        q: 'O que acontece se o learning rate for grande demais?',
        options: [
          "A atualização pode 'pular' demais e piorar o erro em vez de melhorar, ou até divergir",
          'Nada, o modelo sempre aprende mais rápido sem risco',
          'O gradiente para de existir',
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
  {
    id: 'kata-backpropagation',
    emoji: '🔓',
    titulo: 'Kata · Backpropagation',
    setor: 'tech',
    skillId: 'backpropagation',
    runtime: 'tfjs',
    briefing:
      'Aquecimento antes da Prova: calcule a passada pra frente, o erro e os gradientes pela ' +
      'regra da cadeia, e atualize os 4 parâmetros da rede de bancada. Aqui não cobramos bater a ' +
      'fórmula exata — só que o passo realmente diminua o erro.',
    metaLabel: 'Atualizar os 4 parâmetros de forma que o erro diminua',
    payout: 0,
    reputacao: 0,
    prereqContractIds: [],
    datasetUrl: DATASET('backprop-neurostream.csv'),
    starterCode: `// Rede de bancada: x -> (w1,b1) -> z1 -> tanh -> h1 -> (w2,b2) -> z2 -> yhat (saída linear)
// 1. Forward: z1 = w1*x+b1; h1 = tanh(z1); yhat = w2*h1+b2
// 2. Gradiente da saída: dL/dz2 = yhat - y
// 3. Gradiente da escondida (regra da cadeia): dL/dz1 = (dL/dz2*w2) * (1-h1^2)
// 4. Atualize e guarde em ns.w1Novo / ns.b1Novo / ns.w2Novo / ns.b2Novo

`,
    setupCode: SETUP_BACKPROP,
    tests: [
      {
        name: 'Os 4 parâmetros atualizados existem e são números',
        hidden: false,
        code: `;['w1Novo', 'b1Novo', 'w2Novo', 'b2Novo'].forEach((k) => {
  if (typeof ns[k] !== 'number' || Number.isNaN(ns[k])) throw new Error('ns.' + k + ' não foi definido como número — faltou calcular e guardar a atualização?')
})
`,
      },
      {
        name: 'O erro diminuiu depois do passo',
        hidden: true,
        code: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhatAntes = ns.w2 * h1 + ns.b2
const lossAntes = 0.5 * (yhatAntes - ns.y) ** 2

const z1n = ns.w1Novo * ns.x + ns.b1Novo
const h1n = Math.tanh(z1n)
const yhatDepois = ns.w2Novo * h1n + ns.b2Novo
const lossDepois = 0.5 * (yhatDepois - ns.y) ** 2

if (lossDepois >= lossAntes) throw new Error('O erro não diminuiu (antes ' + lossAntes.toFixed(4) + ', depois ' + lossDepois.toFixed(4) + ') — o gradiente foi calculado e aplicado na direção certa?')
`,
      },
    ],
    metricsCode: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhatAntes = ns.w2 * h1 + ns.b2
const lossAntes = 0.5 * (yhatAntes - ns.y) ** 2

const z1n = ns.w1Novo * ns.x + ns.b1Novo
const h1n = Math.tanh(z1n)
const yhatDepois = ns.w2Novo * h1n + ns.b2Novo
const lossDepois = 0.5 * (yhatDepois - ns.y) ** 2

ns.result = { "Erro antes do passo": lossAntes.toFixed(4), "Erro depois do passo": lossDepois.toFixed(4) }
`,
    hints: [
      'Forward pass: z1 = ns.w1*ns.x+ns.b1; h1 = Math.tanh(z1); yhat = ns.w2*h1+ns.b2.',
      'dL/dz2 = yhat - ns.y (saída linear). dL/dh1 = dL/dz2*ns.w2. dh1_dz1 = 1-h1*h1. dL/dz1 = dL/dh1*dh1_dz1.',
    ],
    solution: `const z1 = ns.w1 * ns.x + ns.b1
const h1 = Math.tanh(z1)
const yhat = ns.w2 * h1 + ns.b2

const dL_dz2 = yhat - ns.y
const dL_dw2 = dL_dz2 * h1
const dL_db2 = dL_dz2

const dL_dh1 = dL_dz2 * ns.w2
const dh1_dz1 = 1 - h1 * h1
const dL_dz1 = dL_dh1 * dh1_dz1
const dL_dw1 = dL_dz1 * ns.x
const dL_db1 = dL_dz1

ns.w1Novo = ns.w1 - ns.lr * dL_dw1
ns.b1Novo = ns.b1 - ns.lr * dL_db1
ns.w2Novo = ns.w2 - ns.lr * dL_dw2
ns.b2Novo = ns.b2 - ns.lr * dL_db2
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
  'kata-backpropagation': {
    intro:
      'Backpropagation é só a regra da cadeia aplicada passo a passo: calcular a previsão, medir ' +
      'o erro, e "andar de volta" pela rede multiplicando as derivadas até chegar em cada peso.',
    passos: [
      {
        code: 'const z1 = ns.w1 * ns.x + ns.b1; const h1 = Math.tanh(z1); const yhat = ns.w2 * h1 + ns.b2',
        explica: 'Forward pass: calcula a previsão da rede.',
      },
      {
        code: 'const dL_dz2 = yhat - ns.y',
        explica: 'Gradiente da saída: quanto a perda muda em relação à previsão.',
      },
      {
        code: 'const dL_dh1 = dL_dz2 * ns.w2; const dh1_dz1 = 1 - h1 * h1; const dL_dz1 = dL_dh1 * dh1_dz1',
        explica: 'Regra da cadeia: o erro "anda de volta" pelo peso w2 e pela derivada da tanh.',
      },
      {
        code: 'const dL_dw1 = dL_dz1 * ns.x; const dL_dw2 = dL_dz2 * h1',
        explica: 'Gradiente de cada peso: derivada da perda multiplicada pela entrada daquela camada.',
      },
      {
        code: 'ns.w1Novo = ns.w1 - ns.lr * dL_dw1 /* (e o mesmo pros outros 3) */',
        explica: 'Atualiza cada parâmetro na direção contrária ao gradiente.',
      },
    ],
  },
  'backprop-neurostream': {
    intro:
      'Mesmo ritual da runa, agora valendo: forward pass, gradiente da saída, regra da cadeia até ' +
      'a camada escondida, e atualização dos 4 parâmetros.',
    passos: [
      {
        code: 'const z1 = ns.w1 * ns.x + ns.b1; const h1 = Math.tanh(z1); const yhat = ns.w2 * h1 + ns.b2',
        explica: 'Forward pass da rede de bancada.',
      },
      {
        code: 'const dL_dz2 = yhat - ns.y',
        explica: 'Gradiente da saída (perda quadrática, saída linear).',
      },
      {
        code: 'const dL_dh1 = dL_dz2 * ns.w2; const dh1_dz1 = 1 - h1 * h1; const dL_dz1 = dL_dh1 * dh1_dz1',
        explica: 'Regra da cadeia até a camada escondida.',
      },
      {
        code: 'const dL_dw1 = dL_dz1 * ns.x; const dL_dw2 = dL_dz2 * h1',
        explica: 'Gradiente de cada peso.',
      },
      {
        code: 'ns.w1Novo = ns.w1 - ns.lr * dL_dw1 /* (e o mesmo pros outros 3) */',
        explica: 'Atualização final — é aqui que a rede aprende.',
      },
    ],
  },
}
