# Neural Empire — Game Design Document (GDD)

**Versão:** 1.0 · **Data:** 15/07/2026
**Gênero:** Tycoon/Simulação com progressão RPG e endgame competitivo
**Plataforma:** Mobile-first PWA (instalável, offline-first)
**Pitch:** Você herda uma garagem com um PC velho e constrói o maior laboratório de IA do mundo — mas o jogo só avança quando *você* aprende machine learning de verdade: escrevendo Python real, decifrando a matemática e provando domínio sem ajuda.

---

## 1. Pilares de design

1. **Mastery-based**: nada desbloqueia por grind ou tempo. A árvore de skills é um espelho do conhecimento real do jogador — skill só abre quando ele prova que aprendeu.
2. **Consequência ensina antes da teoria**: o jogador *sente* overfitting perdendo um contrato antes de aprender o nome do conceito.
3. **Código de verdade, sempre**: Python real (Pyodide + scikit-learn) rodando no celular desde o primeiro contrato. Zero pseudo-código.
4. **Vício ético**: os loops de retenção (streak, loot, near-miss) existem para sustentar o estudo, nunca para extrair tempo sem aprendizado.
5. **Conhecimento é o único ativo à prova de falência**: o jogador pode perder o lab inteiro, mas nunca perde skills.

## 2. Narrativa e ambientação

O jogador herda de um tio excêntrico uma garagem com um PC de 2012 e um bilhete: "A IA vai mudar o mundo. Aprenda antes que aprendam por você." Clientes locais começam a bater na porta com problemas de dados. Cada capítulo é uma sede nova do lab e um degrau do currículo:

| Capítulo | Sede | Tier de skills | Tema narrativo |
|---|---|---|---|
| 1. A Garagem | Garagem | 1 | Sobrevivência: primeiros clientes do bairro |
| 2. A Sala Comercial | Escritório pequeno | 2 | Primeiros funcionários, clientes PJ |
| 3. O Andar Inteiro | Escritório médio | 3 | Concorrência aparece, contratos disputados |
| 4. O Prédio | Sede própria | 4 | Clientes corporativos, projetos de risco |
| 5. O Datacenter | Campus + GPUs | 5 | Deep learning, contratos milionários |
| 6. O Império | Campus global | 6 | NLP/Visão, fama mundial, Arena aberta |

## 3. Loop principal (sessão de 5–15 min)

1. **Cliente chega** com um problema em linguagem de negócio ("a padaria quer prever as vendas de amanhã").
2. **Negociação**: aceitar/recusar; prazo, pagamento e meta de métrica (ex.: "MAE abaixo de 12").
3. **Pipeline**: explorar dados → limpar → feature engineering → escolher modelo → treinar → avaliar.
4. **Código real** nas etapas-chave: editor Python embutido com testes automáticos.
5. **Entrega**: o modelo é avaliado em um holdout que o jogador nunca viu.
6. **Recompensa/consequência**: dinheiro + XP + reputação, ou multa + reputação caindo.
7. **Reinvestimento**: upgrades de lab desbloqueiam contratos e modelos maiores.

## 4. Camada Tycoon

### 4.1 Economia
- **Receitas**: contratos (principal), contratos-relâmpago diários, bônus de qualidade (bater a meta com folga paga mais).
- **Custos fixos mensais**: energia, aluguel, "nuvem" e salários (a partir do cap. 2). Forçam o jogador a trabalhar — não dá para ficar parado.
- **Custos variáveis**: comprar datasets, horas de GPU para treinos pesados, refazer entrega para cliente insatisfeito.

### 4.2 Upgrades de lab
- **Hardware**: PC 2012 → PC gamer → rack de GPUs → cluster → datacenter. Hardware limita quais modelos podem ser treinados (rede neural exige GPU) — cria desejo natural de progressão alinhado ao currículo.
- **Instalações**: cosméticos + bônus funcionais (café = contratos-relâmpago rendem mais; biblioteca = dicas extras nas runas).
- **Equipe** (cap. 2+): estagiários automatizam tarefas já dominadas pelo jogador (ex.: limpeza básica), liberando tempo para o que é novo. Regra: só é automatizável o que o jogador já provou dominar.

### 4.3 Reputação
- Por **setor** (varejo, saúde, finanças, indústria, tech). Reputação alta desbloqueia clientes premium do setor; baixa traz só cliente ruim que paga pouco e exige muito.
- Reputação global define o capítulo/tamanho dos contratos ofertados.

### 4.4 Falência e resgate
- Entregar modelo ruim = multa + queda de reputação → espiral de clientes piores.
- **Empréstimo do agiota tech**: resgate com juros altos, tensão antes do fundo do poço.
- **Falência**: perde lab, upgrades e dinheiro. **Nunca perde skills.** Recomeça na garagem em modo "New Game+": com o conhecimento, a escalada é muito mais rápida — o jogo prova na prática que conhecimento é o ativo real.

## 5. Camada RPG — Sistema de Domínio

### 5.1 Runas (3 por skill, todas obrigatórias)
Cada skill exige dominar três runas antes de liberar a Prova de Domínio:

- **Runa da Intuição**: visualizações interativas. Ex.: arrastar uma reta sobre pontos e ver o erro mudar em tempo real; regular o k do KNN e ver as fronteiras se moverem.
- **Runa da Matemática**: decifrar/montar a fórmula peça a peça e conectá-la ao visual. Dificuldade progressiva (ver 5.4).
- **Runa do Código**: implementar em Python real e passar em testes automáticos (estilo kata: função esperada, casos de teste visíveis + ocultos).

### 5.2 Prova de Domínio (boss)
- **Boss Contract**: contrato inédito, sem tutorial, sem dicas, sem autocomplete. Problema novo que exige a skill do zero.
- **Interrogatório do Cliente**: perguntas conceituais no meio do trabalho ("por que normalizou?"). Erros reduzem o pagamento; acumulados, reprovam. Pega quem decorou sem entender.
- **Reprovação** gera um **relatório de lacunas** apontando exatamente o que faltou; as runas abrem exercícios novos focados nesses pontos.
- **Cooldown crescente**: 1ª reprovação 30 min → 2ª 2 h → 3ª 12 h. Durante o cooldown, o jogo oferece o treino guiado das lacunas — o timer é tempo de estudo, não castigo.
- Aprovação = skill desbloqueada na árvore + título cosmético + acesso aos contratos daquele tipo.

### 5.3 Ferrugem (repetição espaçada disfarçada)
- Skills sem uso enferrujam visualmente após X dias (intervalos crescentes: 3d → 7d → 21d → 60d, estilo SM-2 simplificado).
- Skill enferrujada = contratos daquele tipo pagam menos ("sua equipe está enferrujada em árvores de decisão").
- Um contrato-relâmpago de 3 min restaura o brilho. Na prática é Anki disfarçado de manutenção do lab, calibrado para revisar exatamente quando o jogador esqueceria.

### 5.4 Progressão da matemática
- **Tiers 1–2**: 100% visual — arrastar, ver erros como barras, zero notação.
- **Tiers 3–4**: notação pareada ao visual — Σ(y−ŷ)² aparece ao lado da animação já conhecida; minigames de "traduzir" fórmula ↔ imagem.
- **Tiers 5–6**: notação formal de verdade (∇, matrizes, chain rule), pois aí é ferramenta necessária: montar o backprop peça a peça, ver a bolinha descer a superfície de erro.

## 6. Árvore de skills completa (currículo)

> Regra de ouro: cada skill = 3 runas + 1 boss. Pré-requisitos formam o grafo abaixo.

### Tier 1 — Fundamentos (Cap. 1: A Garagem)
1. **Ler Dados** — tipos de dados, tabelas, pandas básico (carregar, filtrar, agrupar)
2. **Explorar Dados** — estatística descritiva: média, mediana, desvio, distribuições, correlação, gráficos
3. **Limpar Dados** — valores faltantes, outliers, duplicatas, tipos errados
4. **Regressão Linear** — reta, erro quadrático, treino/teste, MAE/RMSE

### Tier 2 — Classificação e método (Cap. 2)
5. **Regressão Logística** — probabilidade, fronteira de decisão, acurácia/precisão/recall/F1
6. **KNN** — distância, vizinhança, efeito do k, normalização de features
7. **Validação** — holdout vs. validação cruzada, data leakage, overfitting/underfitting (aqui o jogo *nomeia* o que o jogador já sofreu em contratos)
8. **Feature Engineering** — encoding categórico, escalas, criação de variáveis

### Tier 3 — Árvores e margens (Cap. 3)
9. **Árvores de Decisão** — splits, impureza (Gini/entropia), profundidade e overfitting
10. **Métricas Avançadas** — matriz de confusão, ROC/AUC, desbalanceamento de classes
11. **SVM** — margens, kernels (intuição visual forte)
12. **Regularização** — L1/L2, viés-variância, Ridge/Lasso

### Tier 4 — Ensembles e não supervisionado (Cap. 4)
13. **Random Forest** — bagging, votação, feature importance
14. **Gradient Boosting** — boosting, XGBoost/LightGBM, tuning de hiperparâmetros
15. **Clustering** — K-means, DBSCAN, silhueta (contratos sem "gabarito": segmentar clientes)
16. **Redução de Dimensionalidade** — PCA, visualização de dados de alta dimensão

### Tier 5 — Redes Neurais (Cap. 5)
17. **Perceptron e MLP** — neurônio, camadas, ativações
18. **Backpropagation** — gradiente descendente, chain rule, learning rate (boss: montar o backprop de uma rede pequena na mão)
19. **Treinamento Profundo** — batch, épocas, dropout, batch norm, early stopping
20. **Otimização** — SGD, momentum, Adam, schedulers

### Tier 6 — Especializações (Cap. 6)
21. **Visão Computacional** — convoluções, CNNs, transfer learning
22. **NLP** — tokenização, embeddings, atenção, transformers (intuição + fine-tuning leve)
23. **Séries Temporais** — lags, sazonalidade, janelas, modelos recorrentes
24. **MLOps Essencial** — versionar dados/modelos, monitorar drift, reentrega ao cliente

### Skills de suporte (transversais, desbloqueadas por eventos)
- **Ética e Viés** — contrato-armadilha: cliente pede modelo discriminatório; recusar/corrigir dá reputação especial
- **Comunicação** — traduzir métricas para o cliente; melhora negociação e pagamento

## 7. Contratos

### 7.1 Anatomia
- **Briefing** em linguagem de negócio (nunca "faça uma regressão") — traduzir problema → técnica é parte do aprendizado.
- **Dataset** real ou realista (com "sujeira" proposital nos tiers baixos).
- **Meta de métrica** + prazo em turnos + pagamento + bônus por folga.
- **Avaliação em holdout oculto** — o jogador nunca vê os dados de entrega.

### 7.2 Tipos
- **Contrato padrão**: loop principal.
- **Contrato-relâmpago (diário, 3 min)**: mantém streak e remove ferrugem.
- **Boss Contract**: prova de domínio (ver 5.2).
- **Cliente misterioso**: recompensa variável — pode ser dataset raro, pagamento dobrado ou armadilha (dados com leakage proposital; detectar = bônus enorme).
- **Contrato disputado (cap. 3+)**: concorrente NPC entrega junto; melhor métrica leva.
- **Contrato de crise**: modelo entregue no passado começou a errar (drift) — cliente volta furioso. Ensina manutenção de modelos.

### 7.3 Geração de conteúdo
- Templates paramétricos por setor × técnica × dificuldade, com datasets sintéticos gerados com ruído/sujeira controlados + pool de datasets clássicos adaptados (Titanic, housing, churn etc.).
- Cada template define: história, colunas, distribuições, defeitos plantados, métrica-alvo e perguntas de interrogatório associadas.

## 8. Retenção (vício ético)

- **Streak diário**: contrato-relâmpago de 3 min; recompensas de streak em marcos (3/7/30/100 dias). Proteção de streak comprável com moeda do jogo (nunca dinheiro real).
- **Recompensas variáveis**: clientes misteriosos, datasets com segredos escondidos (easter eggs de dados), loot de snippets lendários (código elegante colecionável e reutilizável).
- **Near-miss**: barra de "quase lá" — 87% quando a meta é 90% incentiva "só mais uma tentativa".
- **Conquistas**: "Primeiro Overfitting", "Matou um bug de shape", "Recusou o cliente antiético", "Sobreviveu ao agiota".
- **Progressão visível**: a sede muda fisicamente na tela; a árvore de skills brilhando é o retrato do próprio conhecimento.
- **Notificações push (opt-in)**: streak em risco, skill enferrujando, cliente premium esperando. Nunca mais de 1/dia.

## 9. Endgame — Model Arena (desbloqueia ~nível 20 / Tier 4)

- **Formato**: 1v1 contra bots com dificuldade crescente. Mesmo dataset, tempo limitado (3–10 min), melhor métrica vence.
- **Ligas**: Bronze → Prata → Ouro → Platina → Diamante → Grão-Mestre. Promoção/rebaixamento por série de partidas.
- **Bots**: pipelines pré-computados por faixa de liga (do "modelo default sem limpeza" ao "XGBoost tunado"), com variação para não serem previsíveis.
- **Torneios semanais**: dataset temático, modificadores ("sem ensembles", "features limitadas a 5"), recompensas cosméticas exclusivas.
- Arena consome e reforça as skills: ranking alto exige velocidade + domínio real.

## 10. Telas principais (UI)

1. **Lab (home)**: visão da sede, upgrades, equipe, indicadores financeiros, fila de clientes na porta.
2. **Mesa de contratos**: briefings, negociação, contratos ativos com prazo.
3. **Workbench (coração do jogo)**: abas Dados (tabela + gráficos) · Código (editor Python com testes e console) · Modelo (configuração/treino com feedback visual) · Entrega.
4. **Árvore de Skills**: grafo por tiers, runas de cada skill, estado (bloqueada/em progresso/dominada/enferrujada), botão da Prova de Domínio.
5. **Runa aberta**: player da visualização interativa / minigame de fórmula / kata de código.
6. **Arena**: ligas, matchmaking vs. bots, histórico, torneio da semana.
7. **Perfil**: nível, conquistas, streak, "currículo" exportável (lista de skills provadas).

Direção de arte sugerida: pixel-art ou flat vetorial com tema "startup de garagem → corporação neon"; barato de produzir e charmoso no mobile.

## 11. Stack técnica (PWA)

- **Frontend**: React + Vite, mobile-first; instalável (manifest + service worker), offline-first.
- **Python no cliente**: Pyodide (WebAssembly) com numpy/pandas/scikit-learn — código real rodando no celular, sem servidor. Carregar Pyodide em WebWorker para não travar a UI; cache agressivo dos pacotes (~15 MB inicial, avisar no primeiro load).
- **Editor de código**: CodeMirror 6 (leve no mobile) com testes executados no worker.
- **Visualizações**: Canvas/SVG próprios para as runas de intuição (interatividade é o produto); charts com biblioteca leve para exploração de dados.
- **Persistência**: IndexedDB (save do jogo, progresso de skills, agenda de ferrugem). Export/import de save em JSON. (Sync em nuvem = pós-MVP.)
- **Notificações**: Web Push opt-in.
- **Deep learning no cliente (Tiers 5–6)**: TensorFlow.js ou ONNX Runtime Web para redes pequenas; contratos calibrados para caber em celular (datasets pequenos, transfer learning).
- **Sem backend no MVP**: tudo local. Backend só quando houver sync/ranking online.

## 12. Roadmap de desenvolvimento

- **MVP — Capítulo 1 "A Garagem" (validar o design inteiro)**
  Onboarding guiado (1 contrato completo em ~10 min) · Skills 1–4 com 3 runas + boss cada · economia básica (dinheiro, 1 custo fixo, 2 upgrades, aperto financeiro sem falência total) · streak + contrato-relâmpago · Pyodide funcionando offline. ~4–6 h de jogo.
- **v0.2**: Capítulo 2 (skills 5–8), falência completa + agiota, ferrugem/repetição espaçada, equipe.
- **v0.3**: Capítulo 3 (skills 9–12), contratos disputados, contratos de crise, conquistas completas.
- **v0.4**: Capítulo 4 (skills 13–16) + **Arena** (ligas vs. bots).
- **v0.5**: Capítulo 5 (skills 17–20) com TF.js, hardware/GPU como gate.
- **v1.0**: Capítulo 6 (skills 21–24), torneios semanais, polish, push notifications.

## 13. Métricas de sucesso (do aprendizado, não só do jogo)

- Taxa de aprovação em boss na 1ª tentativa (alvo: 40–60% — abaixo disso as runas ensinam pouco; acima, o boss está fácil).
- Retenção de skill: % de contratos-relâmpago de revisão resolvidos sem erro.
- Streak médio e retenção D7/D30.
- Progresso no currículo: tempo médio por tier.
- Sinal final: o jogador consegue resolver um problema de ML *fora do jogo*.

---

## Apêndice A — Exemplo completo de skill (Regressão Linear)

- **Runa Intuição**: pontos de vendas da padaria no gráfico; o jogador arrasta uma reta e vê o erro total (barras vermelhas) mudar. Meta: erro abaixo de um limiar. Depois, botão "deixar o computador ajustar" mostra o fit ótimo — momento "aha" do que o algoritmo faz.
- **Runa Matemática** (Tier 1 = visual): montar a ideia de "somar os erros ao quadrado" arrastando peças (erro → quadrado → soma → minimizar), sem notação formal.
- **Runa Código**: kata — `def prever_vendas(dados_treino, dados_novos)` usando `LinearRegression` do sklearn; testes visíveis + ocultos (incluindo um que pega quem esqueceu o split treino/teste).
- **Boss**: floricultura quer prever demanda de buquês; dataset inédito com uma coluna inútil e 3% de faltantes; meta MAE ≤ 8; interrogatório: "por que você separou dados de teste?", "o que significa esse MAE de 6,2 pro meu negócio?".

## Apêndice B — Decisões de design já fechadas

1. Híbrido com forte ênfase em simulação/tycoon; pilares RPG completos; Arena como endgame.
2. Runas (Intuição/Matemática/Código) **obrigatórias**.
3. Economia com **falência real**; skills nunca são perdidas.
4. Progressão **mastery-based**: skill só desbloqueia quando o jogador prova que aprendeu (boss sem ajuda + interrogatório).
5. Boss reprovado tem **cooldown crescente** (30 min → 2 h → 12 h) com treino guiado das lacunas durante a espera.
6. Matemática com **dificuldade progressiva**: visual → notação pareada → notação formal.
