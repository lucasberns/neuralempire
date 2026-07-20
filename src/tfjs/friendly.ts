import type { JsError } from './messages'

// Tradução de erros JS/TF.js para dicas em pt-BR — espelha pyodide/friendly.ts, mas com
// os erros e causas típicas de JavaScript (não Python).
const DICAS: Record<string, string> = {
  SyntaxError: 'Erro de sintaxe — confira chaves, parênteses, vírgulas e aspas.',
  ReferenceError: 'Você usou um nome que não existe. Digitou errado ou esqueceu de expor a variável (ex.: `ns.model = ...`, não `const model = ...`)?',
  TypeError: 'Tipos incompatíveis — confira se o método existe nesse objeto (ex.: .fit, .predict) ou se algum valor esperado veio undefined.',
  RangeError: 'Valor fora do intervalo esperado — confira o shape/tamanho dos tensores envolvidos.',
}

export function friendlyJsError(e: JsError): string {
  const dica = DICAS[e.kind] ?? 'Algo deu errado ao executar o código.'
  const onde = e.line ? ` (linha ${e.line} do seu código)` : ''
  return `${dica}${onde}`
}
