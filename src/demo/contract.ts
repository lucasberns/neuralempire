// Contrato de demonstração da fase 0 — prova o pipeline inteiro
// (CSV → editor → worker → testes visíveis+ocultos → métrica), nos moldes
// do Apêndice A do GDD (Regressão Linear / padaria).
import type { Contract } from '../engine/contracts'

const STARTER_CODE = `from sklearn.linear_model import LinearRegression

def prever_vendas(dados_treino, dados_novos):
    # dados_treino: DataFrame com temperatura, fim_de_semana, promocao e vendas
    # dados_novos:  DataFrame com as mesmas colunas, MENOS vendas
    #
    # 1. Separe X (features) e y (vendas) de dados_treino
    # 2. Treine um LinearRegression
    # 3. Retorne as previsões para dados_novos
    ...
`

// Roda no worker antes do código do usuário. `_ne_csv` é o texto do CSV.
// Os últimos 12 dias ficam de fora do treino: são o "holdout" dos testes ocultos.
const SETUP_CODE = `
import io
import pandas as pd

_ne_df = pd.read_csv(io.StringIO(_ne_csv))
dados_treino = _ne_df.iloc[:-12].reset_index(drop=True)
_ne_holdout = _ne_df.iloc[-12:].reset_index(drop=True)
dados_novos = _ne_holdout.drop(columns=["vendas"])
`

const METRICS_CODE = `
import numpy as np

_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
_ne_result = {
    "MAE nos 12 dias de entrega": round(_mae, 2),
    "Meta do contrato": "MAE \\u2264 8",
    "Primeiras previs\\u00f5es": [round(float(p), 1) for p in _pred[:4]],
}
`

export const DEMO_CONTRACT: Contract = {
  id: 'demo-padaria-regressao',
  titulo: 'Padaria do Seu Joaquim',
  setor: 'varejo',
  briefing:
    'O Seu Joaquim joga fora pão todo dia — ou deixa cliente sem. Ele anotou 60 dias de ' +
    'vendas com a temperatura, se era fim de semana e se tinha promoção. Ele quer saber ' +
    'quantos pães vai vender nos próximos dias para assar a quantidade certa. ' +
    'Errar por até 8 pães em média, ele aceita.',
  datasetUrl: '/datasets/padaria.csv',
  starterCode: STARTER_CODE,
  setupCode: SETUP_CODE,
  metricsCode: METRICS_CODE,
  tests: [
    {
      name: 'prever_vendas(dados_treino, dados_novos) retorna um resultado',
      hidden: false,
      code: `
_res = prever_vendas(dados_treino, dados_novos)
assert _res is not None, "A fun\\u00e7\\u00e3o retornou None \\u2014 faltou o return?"
`,
    },
    {
      name: 'Retorna uma previsão para cada dia novo',
      hidden: false,
      code: `
import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos)).ravel()
assert len(_res) == len(dados_novos), f"Esperava {len(dados_novos)} previs\\u00f5es, recebi {len(_res)}"
`,
    },
    {
      name: 'As previsões são números',
      hidden: false,
      code: `
import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
assert np.isfinite(_res).all(), "H\\u00e1 previs\\u00f5es que n\\u00e3o s\\u00e3o n\\u00fameros v\\u00e1lidos"
`,
    },
    {
      // Pega quem retorna um valor constante (ex.: a média) em vez de treinar um modelo.
      name: 'Teste oculto 1',
      hidden: true,
      code: `
import numpy as np
_res = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
assert float(np.std(_res)) > 1.0
`,
    },
    {
      // Qualidade real da entrega no holdout que o jogador nunca viu (GDD §7.1).
      name: 'Teste oculto 2',
      hidden: true,
      code: `
import numpy as np
_pred = np.asarray(prever_vendas(dados_treino, dados_novos), dtype=float).ravel()
_mae = float(np.abs(_pred - _ne_holdout["vendas"].to_numpy()).mean())
assert _mae <= 8.0
`,
    },
  ],
}

export async function loadDemoCsv(): Promise<string> {
  const res = await fetch(DEMO_CONTRACT.datasetUrl)
  if (!res.ok) throw new Error(`Não consegui carregar o dataset (${res.status})`)
  return res.text()
}
