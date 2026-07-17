# Neural Empire — Plano de melhorias (pós-avaliação)

> Avaliação crítica do que foi entregue até 16/07/2026 + plano priorizado.
> **Ainda não implementado** — este é o roadmap de correção/polimento.
> Estado do que existe hoje: ver [`PROGRESS.md`](PROGRESS.md). Design: [`neural-empire-gdd.md`](neural-empire-gdd.md).

## Diagnóstico (resumo)

Fundação, identidade visual e o arco pedagógico (intuição → matemática → aula → boss) estão bons.
Mas dois pilares do GDD estão **furados** hoje, e a maioria das críticas graves deriva deles:

1. **O jogo não obriga a aprender.** "Ver solução → copiar" funciona em tudo, inclusive no boss; o
   interrogatório sempre paga ≥50% e sempre domina a skill (`content.ts` `earned = payout*(0.5+0.5*score)`),
   então **nunca reprova** (GDD §5.2 quer que erros reprovem).
2. **Economia trivial.** Contratos do bairro são repetíveis sem limite → renda infinita → upgrades
   baratos, hardware-gate vazio e **falência/agiota/ferrugem quase não disparam** organicamente.

Outros achados: streak nunca quebra (`content.ts:767`); "hoje" é UTC, não local (`content.ts:750`);
runas Intuição/Matemática são genéricas de regressão reusadas em todas as skills; toasts de slot único
se sobrescrevem; reprovar boss não acolhe; sem tela de Perfil/currículo (§10.7); bug de tap no mesmo
tick na RunaMatematica; árvore de skills é lista (não escala p/ 24 skills); acessibilidade não auditada.

Severidade: 🔴 crítico · 🟡 médio · 🟢 polish.

---

> **Fases 1, 2 e 3 — ✅ implementadas em 16/07/2026.** Detalhes de cada uma abaixo. Decisão da
> Fase 2: escolhido **teto diário** (1x/dia por contrato do bairro, espelhando o relâmpago) em vez de
> pagamento decrescente — reusa o mecanismo existente e alinha tudo ao loop diário.

## Fase 1 — Fazer o aprendizado valer 🔴 ✅

**Objetivo:** o boss volta a ser prova de verdade; treino e prova ficam separados.

- Separar **treino** (kata) de **prova** (boss): no kata mantém tudo (aula + copiar solução);
  no **boss NÃO** tem "copiar solução" nem dica progressiva.
- **Interrogatório com dente:** exigir acerto mínimo (ex.: ≥⅔) pra entregar; abaixo disso **reprova**.
  Mais perguntas, embaralhadas, sem "chutar até acertar".
- **Reprovação real (GDD §5.2):** cooldown crescente (30 min → 2 h → 12 h) + **relatório de lacunas**
  apontando qual runa refazer.
- **Abandonar o boss = tentativa perdida.** Sair/fechar o boss no meio consome a tentativa e aplica o
  cooldown. **Exige um aviso de confirmação antes de sair** ("Se sair agora, perde a tentativa e entra
  em cooldown. Sair mesmo?") pra garantir que foi intencional. Vale para: botão voltar/TopBar, hotspot,
  e navegação do sistema quando possível.

## Fase 2 — Economia com dente 🔴 ✅

**Objetivo:** renda deixa de ser infinita; falência/agiota/ferrugem passam a acontecer jogando.

- Limitar contratos do bairro: **teto/cooldown diário** (como o relâmpago) ou **pagamento decrescente**
  por repetição no mesmo dia. Mata o grind infinito.
- **Dar função ao hardware:** treino demora/limita no PC velho; alguns contratos exigem upgrade.
- **Rebalancear** conta diária/custos vs. renda limitada pra a tensão econômica ser real (não só quando
  o jogador para de jogar).

## Fase 3 — Tempo correto 🟡 (barato) ✅

- `today()` em **horário local** (hoje usa UTC → o dia vira às 21h no Brasil).
- **Streak quebra** em dia perdido (reset se gap > 1 dia); proteção de streak comprável (§8).

## Fase 4 — Runas específicas por skill 🟡

**Objetivo:** cada skill ensina a SUA intuição/matemática (hoje são genéricas de regressão).

- Intuição/Matemática próprias: ler (explorar a tabela), explorar (dispersão/correlação visual),
  limpar (caçar outliers/faltantes), regressão (a atual).
- **Bom para subagents:** 1 runa por agente, arquivos isolados + interface congelada.

## Fase 5 — Grafo da árvore de skills 🟡

**Objetivo:** substituir a lista vertical por um **grafo** de verdade (prepara para as 24 skills do currículo).

- Nós conectados por arestas mostrando o grafo de pré-requisitos (GDD §6), com pan/zoom no mobile,
  estados (bloqueada/em treino/prova/dominada/enferrujada) e os tiers.
- Manter a estética neon-terminal; leve e performático (SVG/Canvas, sem lib pesada).
- Layout que aguente crescer por tiers/capítulos sem virar bagunça.

## Fase 6 — Conteúdo, retenção & robustez 🟡/🟢

- **Gerador paramétrico de contratos** (§7.3) + mais contratos por skill (rampa de dificuldade) pra
  chegar perto das "4–6 h" do MVP.
- **Tela de Perfil / currículo exportável** (§10.7) — o retrato do conhecimento.
- **Fila de toasts** (não sobrescrever eventos importantes, ex.: conta diária × conquista).
- **Acolhimento na reprovação** do boss (orientação, não só testes vermelhos).
- Affordance melhor do primeiro load do Pyodide (~60 MB no celular).
- Bugs/estrutura: fix do stale-closure da RunaMatematica; consolidar os `useEffect` em `[game]`;
  corrigir chave de `runes` na migração v2→v3; split de `content.ts` por capítulo; auditoria de
  acessibilidade (contraste, foco, leitor de tela na cena SVG).

## Fase 7 — Melhorar o ícone do jogo 🟢 ✅ (opção A)

**Objetivo:** ícone minimalista que combine com o tema (terminal-punk neon), usando as cores mais
presentes: fundo quase-preto `#0d1117`, **lime `#b6f145`** (primária), **ciano `#58d6ff`** (acento).
Representa "Neural Empire" (rede neural + império/lab). Sem texto no ícone pequeno (ilegível); nome
usado no wordmark/splash.

**Opção A — gerar em outra IA (o usuário cola a imagem aqui).** Prompt pronto:

> Minimalist mobile app icon, 1024×1024, flat vector, dark near-black background (#0d1117).
> A single glowing neon-lime (#b6f145) symbol of a tiny neural network — three connected nodes with
> one cyan (#58d6ff) accent node — clean geometric lines, subtle outer glow, high contrast, centered
> with generous padding, rounded-square friendly, no text, no gradients on the background.
> Style: cyberpunk-terminal minimalism, premium, crisp at small sizes.

(Se quiser um wordmark separado p/ o splash: "NEURAL://EMPIRE" em fonte monoespaçada, lime sobre fundo
escuro, com o `://` em ciano.)

**Opção B — gerar no código** (evoluir o `scripts/gen-icons.mjs` atual, que já desenha o glifo de rede
neural neon). Preciso manter os 3 PNGs (192/512/maskable) + favicon coerentes e a área segura do maskable.

Decidir A ou B; se A, o usuário fornece o PNG e eu gero os tamanhos/maskable a partir dele.

## Fase 8 — Melhorar a garagem visualmente 🟢 ✅ (1ª leva — aguarda validação no celular)

> Feito em 16/07/2026: porta comum → **porta de garagem seccional americana** (janelas + puxador);
> **luz pendente removida** (lâmpada + fio + poça no piso); pôster de squares → **pôster de rede neural
> (IA/ML)** que ecoa o logo; portão-lâmina redundante da parede A removido. Revisão de geometria (agente
> B) OK. Verificação visual final = no celular (esta máquina não pinta a cena).

**Objetivo:** manter a estética iso neon, mas corrigir os defeitos e refinar os elementos.

- **Bug conhecido:** linhas se colidem e aparecem onde não deviam (ordem de pintura/back-to-front do
  SVG iso, grade aparecendo por cima de objetos, caixas do personagem se sobrepondo).
- Refinar os elementos (mesa, PC, personagem, prateleira, portão) sem trocar a identidade.
- **Fluxo com dois agentes (recomendado pelo usuário):**
  - Agente A: implementa as melhorias/correções na `GarageScene.tsx`.
  - Agente B: revisa o resultado e aponta pontos a melhorar (ordem de pintura, colisões, proporções,
    contraste, leitura no mobile).
  - Iterar A↔B até fechar. (Lembrar: nesta máquina o navegador embutido não tira screenshot — validar
    geometria por número/bounds e o visual final no celular do usuário.)

---

## Ordem sugerida de execução

**1+2+3 juntas** (devolvem sentido ao jogo: aprendizado obrigatório + economia com tensão + tempo
correto — e destravam de verdade falência/agiota/ferrugem). Depois **5 (grafo)** e **4 (runas)**,
que são visuais/independentes e cabem em subagents. **7 (ícone)** pode entrar a qualquer momento
(rápido). **8 (garagem)** e **6** como polimento contínuo.
