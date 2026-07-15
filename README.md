# Neural Empire — Fase 0 (fundação técnica)

Jogo mobile PWA para aprender machine learning escrevendo Python de verdade no celular.
O design completo está em [`neural-empire-gdd.md`](./neural-empire-gdd.md) — este repositório
implementa a **fase 0** do roadmap (§12): infraestrutura, sem gameplay.

## Como rodar

```bash
npm install
npm run dev       # desenvolvimento (http://localhost:5173)
npm run build     # typecheck estrito + build de produção em dist/
npm run preview   # serve o build (necessário p/ testar o service worker/PWA)
```

> O primeiro load baixa ~60 MB do CDN (Pyodide + numpy/pandas/scikit-learn).
> Depois disso o service worker mantém tudo em cache e o app funciona **offline**.

## Arquitetura

```
src/
  pyodide/       Python no cliente
    worker.ts      WebWorker: carrega Pyodide + pacotes e roda o harness de testes.
                   Nada de Python na thread da UI — o jogo nunca trava.
    client.ts      Fachada tipada (promises por id, timeout de 60s com reinício do
                   worker para sobreviver a loop infinito no código do jogador).
    messages.ts    Protocolo postMessage tipado UI ↔ worker.
    friendly.ts    Tradução de erros Python p/ dicas em pt-BR.
  editor/        CodeEditor.tsx — CodeMirror 6 (fonte 16px anti-zoom iOS, sem
                 autocorreção, indentação por Tab, quebra de linha).
  persistence/   db.ts (IndexedDB key-value cru) + saveGame.ts (save/load,
                 export/import JSON com validação de shape — fronteira de confiança).
  engine/        Módulos das próximas fases — por ora só os tipos/vocabulário:
    contracts/     anatomia de contrato (GDD §7) — já usado pela demo
    skills/        skills/runas (GDD §5–6)
    economy/       carteira/custos (GDD §4)
  demo/          Tela que prova o pipeline inteiro: contract.ts (dataset da padaria,
                 código inicial, testes visíveis+ocultos, métricas) + DemoScreen.tsx.
  components/    LoadingScreen (progresso do 1º load), TestResults, DataPreview.
public/datasets/ CSVs dos contratos (entram no precache do SW → offline).
```

### Decisões técnicas

- **Pyodide via CDN + cache do service worker.** Os ~60 MB de wasm não ficam no repo;
  o Workbox usa `CacheFirst` na origem `cdn.jsdelivr.net/pyodide` (ver `vite.config.ts`).
  A versão é pinada em `worker.ts` (`PYODIDE_VERSION`) e casa com a devDependency
  `pyodide` (usada só para types).
- **Testes de código como dados.** Um contrato define `setupCode`, `tests[]`
  (Python com asserts; ocultos só reportam passou/falhou) e `metricsCode`. O harness
  no worker executa tudo num namespace isolado e devolve JSON puro — sem proxies
  Python↔JS atravessando a fronteira.
- **Persistência**: IndexedDB sem biblioteca (~40 linhas). Import de save valida o
  shape antes de aplicar (arquivo externo = entrada não confiável).
- **Estado**: React puro + autosave com debounce. Sem gerenciador de estado — a fase 0
  não justifica; reavaliar quando a economia/skills existirem.
- **PWA**: `vite-plugin-pwa` com precache do app + manifest instalável. Testar
  instalação/offline sempre com `npm run build && npm run preview` (SW não roda no dev).

## Riscos técnicos conhecidos

1. **Tamanho do primeiro load (~60 MB).** Inevitável com pandas+sklearn completos.
   Mitigado com tela de progresso honesta e cache permanente. Se doer na retenção,
   dá para adiar o `loadPackage` do scikit-learn até o primeiro contrato que o usa.
2. **Tempo de boot do Pyodide em celular modesto** (~5–15 s mesmo com cache, por causa
   da compilação do wasm). Medir em aparelho real; se necessário, iniciar o worker
   durante o onboarding narrativo para esconder a espera.
3. **Loop infinito no código do jogador**: worker é terminado após 60 s e recriado.
   O reinício recarrega o Pyodide do cache (segundos, não minutos) — mas é uma pausa
   perceptível; interrupção mais fina exigiria `pyodide.setInterruptBuffer` (fase futura).
4. **Quota de armazenamento**: Cache Storage + IndexedDB de ~60 MB é tranquilo em
   Android/desktop; no iOS o Safari pode expurgar dados de PWAs sem uso por semanas —
   o export de save em JSON é a rede de segurança do jogador.
5. **CSP exige `unsafe-eval`** (limitação do Pyodide). Aceitável: app 100% local,
   sem dados sensíveis e sem conteúdo de terceiros renderizado.

## 🔒 Segurança aplicada

- Sem backend, sem segredos, sem dados pessoais; tudo roda e fica no aparelho.
- CSP restrita a `'self'` + CDN do Pyodide; sem `innerHTML`/HTML dinâmico.
- Import de save (única entrada externa) validado por type guard + limite de tamanho.
- Dependências pinadas via lockfile — rode `npm audit` periodicamente.
