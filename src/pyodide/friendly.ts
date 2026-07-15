import type { PyError } from './messages'

// Tradução de erros Python para dicas em pt-BR (GDD §3.4: erros amigáveis).
const DICAS: Record<string, string> = {
  SyntaxError: 'Erro de sintaxe — confira parênteses, dois-pontos no fim de def/if/for e aspas.',
  IndentationError: 'Indentação errada — em Python, os espaços no início da linha fazem parte do código.',
  NameError: 'Você usou um nome que não existe. Digitou errado ou esqueceu de definir a variável?',
  AttributeError: 'Esse objeto não tem esse método/atributo. Confira o nome (ex.: .fit, .predict).',
  KeyError: 'Essa coluna (ou chave) não existe. Confira os nomes exatos das colunas do dataset.',
  TypeError: 'Tipos incompatíveis — talvez a função tenha recebido o dado errado ou faltando argumento.',
  ValueError: 'Valor inválido — no sklearn, X precisa ser 2D (ex.: df[["col"]]) e y 1D (df["col"]).',
  IndexError: 'Índice fora do intervalo — você tentou acessar uma posição que não existe.',
  ZeroDivisionError: 'Divisão por zero em algum ponto do cálculo.',
  ImportError: 'Import falhou — aqui só existem numpy, pandas e scikit-learn (além da stdlib).',
  ModuleNotFoundError: 'Módulo não encontrado — aqui só existem numpy, pandas e scikit-learn (além da stdlib).',
  RecursionError: 'Recursão infinita — a função está chamando a si mesma sem parar.',
}

export function friendlyPyError(e: PyError): string {
  const dica = DICAS[e.kind] ?? 'Algo deu errado ao executar o código.'
  const onde = e.line ? ` (linha ${e.line} do seu código)` : ''
  return `${dica}${onde}`
}
