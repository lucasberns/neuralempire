# Neural Empire — Estado do desenvolvimento

> Fonte de verdade do **design**: [`neural-empire-gdd.md`](neural-empire-gdd.md).
> Este arquivo registra **o que já foi construído e de onde continuar**. Atualize ao fim de cada leva.

**Última atualização:** 16/07/2026
**No ar:** https://lucasberns.github.io/neuralempire/ (deploy automático a cada push na `main`).

---

## Onde estamos no roadmap (GDD §12)

| Marco | Status |
|---|---|
| **MVP — Cap. 1 "A Garagem"** | ✅ **Completo** |
| **v0.2 — economia (falência/agiota/ferrugem) + backbone** | ✅ **Completo** |
| v0.2 — Cap. 2 (skills 5–8) + equipe/estagiários | ⬜ pendente |
| v0.3 — Cap. 3 (skills 9–12), contratos disputados/crise, conquistas completas | ⬜ pendente |
| v0.4 — Cap. 4 (skills 13–16) + Arena (ligas vs. bots) | ⬜ pendente |
| v0.5 — Cap. 5 (skills 17–20) com TF.js, GPU gate | ⬜ pendente |
| v1.0 — Cap. 6 (skills 21–24), torneios, push notifications | ⬜ pendente |

**Próximo passo natural:** Capítulo 2 — escritório novo, skills 5–8 (Regressão Logística, KNN, Validação, Feature Engineering) com 3 runas + boss + datasets, e os **estagiários** (automatizam o que o jogador já domina, GDD §4.2).

---

## O que já funciona (mapeado ao GDD)

- **Fundação (fase 0):** PWA React 19 + Vite + TS estrito, offline-first; Python real via **Pyodide** (numpy/pandas/scikit-learn) em WebWorker; save em **IndexedDB**; deploy automático (GitHub Actions → Pages).
- **Modo garagem (§10):** cena **isométrica 2.5D** em SVG gerado por código, tela cheia, evolui com o hardware. Acesso só por 3 hotspots — **PC → Bancada** (com zoom de câmera), **Porta → Contratos** (badge de cliente esperando), **Quadro → Skills**. HUD mínimo; backup do save + conquistas nas configurações (⚙).
- **Loop principal (§3):** aceitar contrato → escrever Python → testes visíveis + ocultos (holdout) → recompensa.
- **Runas + Boss (§5):** cada skill = **3 runas** + Prova de Domínio.
  - *Intuição:* regressão visual (arrasta a reta, vê o erro, "deixar o computador ajustar").
  - *Matemática:* montar a "receita do erro" (tap-to-place).
  - *Código:* **kata** de prática, com **aula "Como escrever esse código"** (ensino linha a linha).
  - *Boss:* o contrato pago + **Interrogatório** (perguntas conceituais que escalam o pagamento). Só libera com as 3 runas.
- **Currículo Tier 1 (§6):** 4 skills jogáveis — `ler`, `explorar`, `limpar`, `regressao`.
- **Economia (§4):** caixa, reputação (0–100), streak, **hardware em 3 níveis**; **custo por entrega** (boss) + **conta diária do lab** (cresce com hardware); **contrato-relâmpago diário**; **contratos do bairro repetíveis** (renda contínua).
- **Falência + agiota (§4.4):** caixa negativo → agiota (empréstimo com juros 10%/dia); fundo do poço → **falência** (reseta lab, **nunca perde skills**, New Game+).
- **Ferrugem / repetição espaçada (§5.3):** skill sem uso enferruja (SM-2 [3,7,21,60] dias); contrato do bairro dela paga 60%; trabalhar/revisar tira a ferrugem.
- **Retenção (§8):** streak + relâmpago diário; **8 conquistas** com toast e painel.
- **Onboarding (§12):** intro narrativa (o tio, o bilhete, Seu Joaquim).

---

## Inventário de conteúdo (tudo em `src/game/content.ts`)

- **Skills (`SKILLS`):** ler → explorar → limpar → regressao (grafo de pré-requisitos).
- **Bosses (`CONTRACTS`):** `boletim-padaria` (média), `analise-clima` (correlação), `faxina-cadastro` (faltantes), `previsao-padaria` (regressão, MAE ≤ 8).
- **Katas (`KATAS`):** um por skill (`kata-ler`…`kata-regressao`).
- **Relâmpago (`RELAMPAGO`):** `relampago-diario`.
- **Repetíveis (`REPEATABLE`):** `bairro-mercadinho` (reusa média), `bairro-sorveteria` (reusa correlação) — via `clone()`.
- **Aulas (`LESSONS`):** mapa por id de contrato (8 aulas).
- **Conquistas (`ACHIEVEMENTS`):** 8.
- **Datasets:** `public/datasets/padaria.csv`, `public/datasets/clientes.csv` (com faltantes).

> **Regra dos contratos:** o Python é **correto por construção** — o teste oculto calcula o valor esperado com a MESMA expressão da solução. Datasets novos "sujos"/sintéticos passam sem recalibrar.

---

## Mapa de arquivos

```
src/
  App.tsx            # shell: rotas, gate de onboarding, conta diária, conquistas, overlay do agiota
  nav.ts             # tipos View / RuneKind
  game/content.ts    # TODO o conteúdo + regras puras (economia, runas, ferrugem, conquistas)
  persistence/       # db.ts (IndexedDB kv), saveGame.ts (estado v3 + migração + export/import)
  pyodide/           # worker.ts, client.ts, messages.ts, friendly.ts
  editor/CodeEditor.tsx     # CodeMirror 6 (touch)
  screens/
    LabScreen.tsx GarageScene.tsx      # a garagem (hub) + cena SVG iso
    ContractsScreen.tsx WorkbenchScreen.tsx
    SkillTreeScreen.tsx RunaScreen.tsx RunaIntuicao.tsx RunaMatematica.tsx
    Interrogatorio.tsx Onboarding.tsx  # (cada tela com CSS próprio co-localizado)
  components/        # TopBar, DataPreview, TestResults
  styles.css         # design system (tokens + a maioria dos componentes)
public/datasets/     # CSVs dos contratos
public/              # favicon.svg + icon-192/512/maskable (ver scripts/gen-icons.mjs)
scripts/gen-icons.mjs        # regera os PNGs do ícone (node scripts/gen-icons.mjs public)
.github/workflows/deploy.yml # build + deploy no Pages a cada push na main
```

---

## Decisões técnicas e armadilhas (ler antes de mexer)

- **Design system "terminal-punk":** tokens CSS globais em `:root` (`--lime #b6f145`, `--amber`, `--cyan`, `--mono`, etc.). Telas novas devem usar esses tokens e ter **CSS próprio co-localizado** (não inflar `styles.css`).
- **Estado v3** (`saveGame.ts`): campos novos são adicionados de forma **tolerante** (normalizados no `loadGame`, sem bump de versão) para não invalidar saves existentes. Regras puras de tempo (`applyDailyBill`, `isRusted`) recebem `todayISO` → **testáveis por seeding**.
- **Cena iso (`GarageScene.tsx`):** `viewBox` justo (`GARAGE_VIEWBOX`); a origem do zoom no CSS depende dele. Se adicionar objetos, valide os bounds (há um helper `iso()`).
- **Nunca use `requestAnimationFrame` para soltar estados** (não dispara com aba oculta e trava o estado) — use `setTimeout`.
- **Deploy = push na `main`.** O service worker (Workbox) gera hashes novos por build → PWAs instalados atualizam sozinhos. O "build {data}" fica nas configurações.
- **Padrão de subagents (superpowers):** eu (orquestrador) faço a fundação (arquivos-hub: content/saveGame/styles) e a fiação; cada subagent cria **uma tela nova isolada** (arquivos disjuntos + CSS próprio + interface de props congelada) e valida com `npm run build`. Funcionou bem para as runas/onboarding.
- **Ambiente desta máquina:** o painel de navegador embutido **não pinta frames** (screenshots travam, rAF não roda). Verificação: **visual pelo celular do usuário**; **lógica via DOM/JS** e por **seeding do IndexedDB**.

---

## Rodar / build / deploy

```bash
npm install
npm run dev        # dev server
npm run build      # tsc --noEmit + vite build (precisa passar limpo)
node scripts/gen-icons.mjs public   # regenera os ícones do PWA
```

Deploy: `git push origin main` → GitHub Actions publica no Pages.
