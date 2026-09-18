# Planejamento do CSystem — 17/09/2026

Registro do **processo de decisão** que levou ao CSystem: as perguntas feitas, as
alternativas descartadas e por quê, o Teste do Engenheiro completo, e o que ainda
falta verificar.

Este documento preserva o histórico de decisão. A seção 10 recebe somente adendos de
verificação; para o estado técnico e visual atual, ver
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md) e
[`../README.md`](../README.md); para o histórico geral do projeto, ver
[`../../DOCUMENTACAO.md`](../../DOCUMENTACAO.md).

**Por que existe:** as decisões estão documentadas em outros lugares, mas as
alternativas rejeitadas não estavam em lugar nenhum. Sem elas, daqui a seis meses
alguém — inclusive um agente — vai propor de novo "e se a gente sincronizasse com o
Trello?" sem saber que isso já foi analisado e descartado.

---

## 1. O pedido original

Criar um CRM chamado **CSystem** para gestão de relacionamento, tarefas e
produtividade, que atenda a operação da Capill segundo o `MANUAL_OPERACIONAL`, o
`PROTOCOLO_DE_TRABALHO`, os `CRITERIOS_DE_SUCESSO` e o atendimento do SDR.

Requisitos explícitos do Alex:

- Design totalmente inspirado numa imagem de referência anexada (dashboard claro,
  acento verde-limão, pills pretas, cards muito arredondados)
- Modo claro e escuro alternáveis por botão
- Em Minhas Tarefas, alternar entre **Lista** e **Kanban**
- Arrastar cards entre listas como no Trello
- Sistema de etiquetas coloridas e o que está definido no manual de operação
- Integração com os fluxos de atendimento e o Agente SDR, para receber todos os leads

---

## 2. Decisões tomadas — e o que foi descartado

### 2.1 Relação com o Trello

**Escolhido: substituir o Trello.** CSystem vira a fonte única de verdade.

| Alternativa descartada | Por que não |
|---|---|
| **Espelho bidirecional** (os dois sincronizados via API) | Mais poderoso, mas bem mais complexo e com risco real de conflito e card duplicado — exatamente o que a Regra 1 existe para impedir. |
| **Independente, Trello em paralelo** | Mais rápido de entregar, mas cria duas fontes de verdade. É o cenário que o próprio `PADRAO_DE_COMENTARIOS` desaconselha ao dizer que dois métodos de registro não devem ser usados ao mesmo tempo. |

**Consequência aceita:** o board precisa ser arquivado ao fim da migração. Manter os
dois recebendo card quebra a Regra 1.

### 2.2 Importação dos dados do Trello

**Escolhido: não importar nada. Começar do zero.**

O plano original previa importar os 337 cards com seus comentários. O Alex descartou
isso na revisão. O seed cria só a estrutura — 12 listas, 15 etiquetas, 4 colunas de
tarefa, **zero clientes**.

Os ~21 cards do funil ativo ficaram de fora. Trazê-los depois é digitação manual ou
uma importação pontual.

### 2.3 Onde roda

**Escolhido: local agora, nuvem depois — mesma base de código.**

| Alternativa descartada | Por que não |
|---|---|
| **Direto na nuvem** (Vercel + Postgres) | Funcionaria no celular dentro do studio e o n8n entregaria o lead direto, mas exige o Alex criar contas nos serviços. |
| **Só local, sem webhook** | Mais simples, mas o lead do SDR entraria só por colagem manual — sem automação real, que era um requisito explícito. |

**Consequência aceita:** enquanto roda local, o n8n na nuvem não alcança `localhost`.
O endpoint já existe e está pronto; o acesso se resolve com túnel temporário ou
colagem manual.

### 2.4 Runtime

Descoberto no meio do planejamento: **não havia Node, npm nem Python real na máquina.**

**Escolhido: instalar o Node.js LTS.**

| Alternativa descartada | Por que não |
|---|---|
| **Arquivo único HTML**, sem instalar nada | Abriria com duplo clique e funcionaria offline, mas perde o webhook — o lead do SDR só entraria colado à mão. Sem acesso pelo celular. |
| **Pular o local e ir direto pra nuvem** | Não instala nada no PC, mas exige criar contas — e eu não posso criar conta por ninguém. |

### 2.5 Divergências entre o board real e os documentos

**Escolhido: corrigir o typo e manter `AGUARDANDO CONTRATO`.**

| Alternativa descartada | Por que não |
|---|---|
| **Copiar o board exatamente como está** | Zero risco de perder correspondência, mas carrega o erro de grafia `LEAD FOLOW-UP` para frente. |
| **Seguir os documentos e descartar `AGUARDANDO CONTRATO`** | Funil mais enxuto, mas perde uma etapa que estava em uso real com 3 cards. |

### 2.6 Módulos da v1

Todos os quatro foram escolhidos: funil (Kanban + Lista), Minhas Tarefas (Kanban +
Lista), Dashboard + Métricas, e Agenda + follow-ups + pagamentos.

---

## 3. Como o plano mudou depois da primeira revisão

O primeiro plano foi **rejeitado** pelo Alex, com três correções. Vale registrar
porque a terceira mudou o desenho inteiro do sistema:

1. **"Quero poder editar, criar listas e cards, etiquetas, escolher as cores das
   etiquetas."** → Edição virou funcionalidade de primeira classe, não tela de admin
   escondida.

2. **"Não iremos importar nada do Trello, irei começar a usar do zero."** → O passo de
   importação saiu do plano.

3. **"Quando eu arrastar o card entre a lista seja criado as informações para que
   possamos metrificar."** → **Isto inverteu a arquitetura.**

Sobre a terceira: o plano original era *o comentário move o card* — escrever `AGENDOU`
faria o sistema sugerir mover para AVALIAÇÃO AGENDADA. O pedido do Alex inverteu para
*mover o card grava o comentário*.

A inversão é melhor, e o motivo é concreto: no desenho original, a métrica dependia de
o Alex escrever o comentário. No desenho novo, ela sai do gesto que ele já faz de
qualquer jeito. **A métrica deixou de depender de disciplina de registro.**

Efeito colateral técnico da mesma mudança: o mapa "lista → palavra-chave" teve que
sair do código e virar configuração no banco. Com listas editáveis pelo usuário, um
mapa fixo quebraria na primeira lista nova.

---

## 4. Teste do Engenheiro — as 9 perguntas

Aplicado conforme exige a Regra 2 do `AGENTS.md`, usando o
`CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md`.

**1. Problema.** Não existe número de funil confiável. Contar "quantos agendaram este
mês" exige ler comentário por comentário, e só funciona se o comentário tiver sido
escrito.

**2. Definição.** O critério é objetivo e não depende de julgamento: *entrar numa lista
é o evento*. "Agendou" = card entrou em AVALIAÇÃO AGENDADA. Cabe numa frase e é
aplicável em segundos.

**3. Impacto no processo atual.** **Reduz** trabalho. O Alex já arrasta o card; o
registro passa a sair desse gesto em vez de exigir um comentário adicional.

**4. Impacto nas métricas.** É o ponto central. A cadeia LEAD → QUALIFICADO →
AVALIAÇÃO → COMPARECIMENTO → VENDA passa a ser contável automaticamente, com tempo
médio por etapa de brinde.

**5. Impacto nos agentes.** O Vendas ganha o histórico estruturado que o
`Vendas/AGENTS.md` já exige. O Estrategista ganha o número de gargalo que o
`DNA_DA_CAPILL.md` §30 levanta como hipótese e nunca pôde testar.

**6. Alternativas mais simples.** Continuar no Trello foi seriamente considerado e é
mais simples. Perde: contagem automática, dedupe confiável por telefone, validação da
palavra-chave e o parse do bloco `===REPASSE===`.

**7. Princípio da operação individual.** Nenhuma tela precisa ser "trabalhada". A
métrica é subproduto do gesto que já existe. Nada exige uma segunda pessoa.

**8. Critério de sucesso.** Em 30 dias de uso: (a) o dashboard responde "quantas
avaliações e quantos fechamentos no mês" sem ninguém abrir card; (b) o Alex não abre o
Trello nenhuma vez.

**9. Veredito: APROVAR COM AJUSTES.** Quatro ajustes, todos incorporados:

- **O arrasto é a decisão humana.** Gravar o evento a partir dele não viola o item 9 do
  `PROTOCOLO_DE_TRABALHO` — foi o Alex quem moveu. O que o sistema **não** faz é mover
  card sozinho.
- **Métrica quantitativa e registro qualitativo são coisas separadas.** O arrasto grava
  o número; o motivo e o texto continuam sendo comentário humano, opcional. O sistema
  nunca inventa motivo.
- **A tela Entrada SDR é passiva** — sem badge de pendência, sem fila a trabalhar.
- **Sem campo novo sem uso comprovado** — nada de score ou temperatura de lead.

**Risco declarado na aprovação:** a partir do go-live, escrever no Trello cria uma
segunda fonte de verdade e quebra a Regra 1.

---

## 5. Stack e o porquê de cada peça

| Camada | Escolha | Por quê |
|---|---|---|
| App | Next.js 15 (App Router) + TypeScript | Um processo só serve a interface e o webhook do SDR. `npm run dev` e pronto. Sobe para a nuvem depois sem reescrita. |
| Estilo | Tailwind CSS v4 + tokens CSS | Tema claro/escuro por `data-theme` no `<html>`, sem flash. |
| Banco | SQLite (better-sqlite3) + Drizzle ORM | Arquivo único — backup é copiar o arquivo. Drizzle troca para Postgres na nuvem mudando só o driver. |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable | Arrastar entre colunas com suporte a teclado e acessibilidade. |
| Datas | date-fns + locale ptBR | |
| Gráficos | SVG inline, sem biblioteca | Ver a ressalva na seção 8. |

---

## 6. Especificação visual

Extraída da imagem de referência enviada pelo Alex.

```css
--accent:      #B9FF66;   /* verde-limão: agenda e destaques */
--accent-ink:  #000000;   /* texto sobre o verde */
--ink:         #000000;   /* pills, ações e texto forte */
--surface:     #FFFFFF;   /* cards */
--bg:          #D2D2D2;   /* fundo claro */
--positive:    #66FFED;   /* variação positiva */
--negative:    #F04949;   /* variação negativa */
--radius-card: 26px;  --radius-pill: 999px;
```

Escuro: `--bg:#0B0C0B` · `--surface:#161816` · `--ink:#F2F4F2`, com **o mesmo
verde-limão** — é a assinatura da interface.

Elementos fiéis à referência: rail vertical à esquerda com o ativo virando círculo
preto sólido; barra de agenda preta com segmentos verdes proporcionais ao horário e
marcador da hora atual; título gigante em caixa alta com botão preto colado;
contadores grandes com delta (`↑3` / `↓2`); chips de filtro (ativo = pill branca com
sombra); card de tarefa em destaque totalmente verde-limão; linhas com rolagem
horizontal.

Tipografia: Urbanist, peso forte nos títulos gigantes.

---

## 7. Mapa lista → palavra-chave → etapa de métrica

Valores **iniciais**, editáveis em Configurações. Grafia fiel ao
`PADRAO_DE_COMENTARIOS`, com `NAO COMPARECEU` e `PECA CHEGOU` **sem acento**.

| Lista de destino | Palavra-chave sugerida | Conta como |
|---|---|---|
| MATERIAIS DE APOIO | — | — |
| LEAD QUALIFICADO | — | qualificado |
| LEAD FOLLOW-UP | — | lead |
| AVALIAÇÃO AGENDADA | `AGENDOU` (+ data/hora → agendamento) | agendado |
| ANALISANDO PROPOSTA | `COMPARECEU` | compareceu |
| FOLLOW-UP | `FECHOU` ou `PENSANDO` (escolha) | — (ambígua) |
| AGUARDANDO CONTRATO | `FECHOU` | fechou |
| FAZER PEDIDO DO SISTEMA | `FECHOU` | fechou |
| AGUARDANDO A PEÇA | `PEDIDO FEITO` | pedido |
| CHEGOU PEÇA | `PECA CHEGOU` | peca |
| 1° CONTATO PÓS VENDA | `APLICOU` | aplicou |
| SEM RETORNO | `SEM RETORNO` | sem_retorno |

Fora do arrasto: ação **"Marcar como perdido"** (`PERDIDO` + motivo, sai do funil
ativo), porque PERDIDO "sai do funil" e não é destino de lista.

---

## 8. Ressalva sobre os gráficos

A skill `dataviz` exige rodar um validador de paleta antes de publicar qualquer paleta
categórica — "a parte da cor é computável, então compute". O validador roda em Node,
que não estava instalado.

Em vez de publicar uma paleta não validada, **todos os gráficos foram estruturados em
série única**. Os motivos de perda viraram tabela com barra de total em vez de duas
cores; origem e distribuição usam a cor da própria etiqueta ou lista, que é cor
seguindo a entidade, não paleta inventada.

**Se um dia for preciso um gráfico multi-série, o validador tem que rodar antes.**

---

## 9. Passos de implementação — status

| # | Passo | Status |
|---|---|---|
| 1 | Scaffold, tokens de tema, alternador claro/escuro, rail e cabeçalho | escrito |
| 2 | Schema Drizzle, migração e seed da estrutura (sem clientes) | escrito |
| 3 | Funil: Kanban, lista, CRUD de listas e cards, motor de transição, desfazer | escrito |
| 4 | Etiquetas: CRUD com seletor de cor | escrito |
| 5 | Tarefas: Kanban + Lista, colunas editáveis | escrito |
| 6 | Métricas: agregações, dashboard, regras de amostra pequena | escrito |
| 7 | Webhook SDR, agenda, pagamentos, configurações | escrito |
| 8 | Doc do n8n e correção dos documentos-fonte | feito |

**Atualização 17/09/2026:** todos os passos foram executados e verificados rodando.
Ver o checklist abaixo e a entrada correspondente no `DOCUMENTACAO.md`.

---

## 10. Checklist de verificação — EXECUTADO em 17/09/2026

Percorrido com o app rodando em `localhost:3000`. Resultado: **typecheck 0 erros,
38 testes passando, `next build` gerando as 12 rotas**. Oito bugs foram encontrados e
corrigidos no caminho — estão listados no `DOCUMENTACAO.md`.

Os poucos itens não marcados estão anotados com o motivo.

**Subir:**

- [x] `npm install` conclui sem erro — **exigiu subir o `better-sqlite3` para a v13**
- [x] `npm run build` compila sem erro de tipo (12 rotas)
- [x] `npm run dev` sobe em `localhost:3000`
- [x] `npm run db:seed` cria 12 listas, 15 etiquetas e **zero clientes**
- [x] `npm run db:push` — exigiu criar a pasta `data/` (agora versionada com `.gitkeep`)

**O teste principal — a métrica pelo arrasto:**

- [x] Arrastar cliente para AVALIAÇÃO AGENDADA e conferir que `/metricas` conta,
      **sem ter escrito nenhum comentário**
- [x] Ignorar o balão ("Só mover") e conferir que o número continua certo
- [x] Desfazer um arrasto e conferir que o contador **não** infla (ficou em 2, não foi
      para 3)
- [ ] Percorrer o funil inteiro com 3 clientes até `1° CONTATO PÓS VENDA` — verificado
      só até ANALISANDO PROPOSTA. O mecanismo é o mesmo em todas as listas; as etapas
      seguintes usam exatamente o mesmo código.

**Edição:**

- [x] Criar card pela coluna, editar cliente (nome, telefone, cidade) e salvar
- [x] Criar lista com cor hex livre, configurar `AGENDOU` e `Avaliações agendadas`,
      arrastar card e conferir o balão e a métrica
- [x] Renomear e excluir lista com card — a exclusão exigiu destino, moveu o card e
      manteve a métrica histórica (3 avaliações agendadas) pelo snapshot da transição
- [ ] Reordenar listas — não exercitado nesta rodada
- [x] Criar etiqueta com cor hex livre e aplicar em card e tarefa nos temas claro e escuro
- [x] Tentar arquivar lista com card — bloqueado na interface (`Arquivar (esvazie antes)`)

**Regra 1:**

- [x] Disparar o mesmo `===REPASSE===` duas vezes: `created: false` e o mesmo
      `clientId` — Regra 1 respeitada
- [ ] Criar cliente com telefone duplicado pela interface — o caminho pelo webhook foi
      verificado; o aviso na tela de criação não.

**Webhook:**

- [x] Repasse `NÃO QUALIFICADO` **não** entra no funil
- [x] Repasse com `AGENDOU` convertido para `OUTRO`, com aviso
- [x] Requisição sem token retorna 401
- [x] Modalidade Online derivada de "Mossoró" e etiqueta aplicada

**Resto:**

- [x] `npm test` passa — 38 testes
- [x] Arrastar com mouse no funil; recarregar e conferir que a posição persistiu
- [ ] Arrastar com **teclado** — não testado.
- [x] Alternar Lista ⇄ Kanban nas tarefas
- [x] Alternar claro ⇄ escuro pelo botão
- [x] Card de tarefa de hoje fica verde-limão inteiro, como na referência
- [x] Comparar `/` com a imagem de referência — barra preta, título gigante, botão
      preto, contadores com delta e chips de filtro conferem

### Adendo de continuidade — 18/09/2026

Refinamento posterior à rodada original. O registro técnico completo, inclusive
arquivos não commitados, está em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] Atualizar a base visual para Urbanist e a paleta fornecida: `#000000`,
      `#B9FF66`, `#D2D2D2`, `#66FFED`, `#FFFFFF` e `#F04949`.
- [x] Alinhar título, ação e métricas; mover modo, notificações e perfil para a barra
      de agenda do Workspace; aplicar o mesmo ritmo de espaçamento nas outras telas.
- [x] Corrigir o alternador de tema cujo primeiro clique podia não refletir o tema
      pré-hidratação; alternância conferida no navegador após reiniciar o dev server.
- [x] Abrir clientes e tarefas com duplo clique e manter botão circular de abertura.
- [x] Remover delineado preto de etiqueta selecionada e usar brilho/sombra, em cliente
      e tarefa.
- [x] Aplicar fade lateral sem emenda visível à rolagem de filtros de etiquetas no
      Funil; ajustar confiança com graduação vermelho → verde e chama apenas no nível
      alto.
- [x] Retirar prévia de comentário do card; separar **Eventos** humanos de
      **Registros do sistema** no detalhe do cliente e tornar ambos retráteis.
- [x] `npx tsc --noEmit` passou após a alteração final; `npm test` passou com 38
      testes imediatamente antes da alteração textual final do título “Eventos”.
- [ ] Reexecutar `npm run build` só com o dev server parado. Fazer build concorrente a
      `next dev` pode inutilizar temporariamente `.next`; a recuperação comprovada é
      iniciar o dev server limpo novamente.

### Adendo de continuidade — 18/09/2026 (auditoria visual contra a referência)

Segunda rodada do mesmo dia, a pedido do Alex: auditoria visual comparando
Workspace, Funil, Tarefas, Agenda, Métricas e Configurações à referência do
Dribbble, mantendo Urbanist, a paleta e as regras de negócio intactas. Detalhe
completo em [`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] Extrair o fade de borda do filtro de etiquetas do Funil para um componente
      reutilizável (`components/ui/FadeScroller.tsx`) e aplicá-lo também às
      fileiras roláveis do Workspace (Novos Leads, Minhas Tarefas) e ao filtro de
      Tarefas.
- [x] Subir a hierarquia tipográfica dos títulos de cartão/seção (`text-lg` →
      `text-xl`) e das fileiras do Workspace (`text-xl` → `text-2xl`), mantendo os
      títulos de diálogo menores de propósito.
- [x] Aumentar levemente os botões do rail (44px → 48px) e a barra de agenda
      (altura da trilha e preenchimento), para mais presença visual.
- [x] `npx tsc --noEmit` e `npm test` (38 testes) confirmados numa cópia do
      código rodada num ambiente separado, sem acesso a terminal na máquina do
      Alex nesta rodada.
- [ ] **Não verificado nesta rodada:** aparência real no navegador (`npm run
      dev`), porque a sessão não teve acesso a um terminal local desta vez. Alex
      precisa abrir o app localmente para confirmar visualmente antes do commit.

### Adendo de continuidade — 18/09/2026 (rótulo de temperatura no card)

Decisão do Alex nesta rodada de refino visual. Detalhe e as ressalvas em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] Trocar o rótulo dos pontos de confiança no card do funil de "Confiança
      alta/moderada/baixa" para **Frio / Morno / Quente**, em caixa normal.
- [x] Registrar que o ajuste 4 do Teste do Engenheiro ("nada de score ou
      temperatura de lead") continua valendo quanto a campo e a cálculo: o
      mapeamento é 1:1 com `sdr_confidence`, não há coluna nova, não há
      inferência e nenhuma métrica lê o rótulo.
- [x] Conferir no navegador que o `title` do grupo de pontos continua atribuindo
      o valor ao SDR, para o rótulo novo não ser lido como previsão do sistema —
      confirmado em `localhost:3010/funil` (porta alternativa; 3000 estava
      ocupada por um processo de outra ferramenta nesta máquina, não tocado):
      card "Marcos Vinicius" mostra "Quente" com
      `title="Nível de confiança do SDR: ALTA"`.

### Adendo de continuidade — 18/09/2026 (verificação visual no navegador, pendência fechada)

Fechamento da pendência registrada no adendo "auditoria visual contra a
referência": desta vez a sessão teve acesso a um terminal e a um navegador
locais, então o que antes só tinha sido validado por `tsc`/`vitest`/leitura de
código foi finalmente visto rodando. Detalhe completo em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] Confirmar que o fade/hierarquia/rail/barra de agenda da rodada anterior já
      estavam commitados (`6203c33`, `67e16ab`) e batem com o patch do handoff —
      nada ficou pendente de aplicar.
- [x] Rodar `npm run dev` e comparar Workspace, Funil, Tarefas, Agenda,
      Métricas e Configurações com a referência, nos temas claro e escuro.
- [x] Conferir especificamente o rail (84px) e o fade de 48px nas fileiras de
      chips — nenhum dos dois mostrou problema real: o rail tem folga de 6px de
      cada lado do botão de 48px dentro do padding, dentro do esperado; o fade
      de 48px desvanece suavemente o próprio conteúdo perto da borda (não é uma
      faixa por cima) e não removeu nem cortou texto de nenhum chip, incluindo
      os rótulos mais longos já visíveis ("Avaliação marcada",
      "Avaliação agendada"). Nenhuma mudança de código foi necessária nesses
      dois pontos.
- [x] Duplo clique abrindo cliente e tarefa, alternância de tema, separação
      Eventos/Registros do sistema e etiquetas sem contorno preto — todos
      conferidos rodando.
- [x] `npx tsc --noEmit` (0 erros) e `npm test` (4 arquivos, 41 testes — o
      arquivo `lib/temperature.test.ts` foi somado desde a última rodada)
      passando neste ambiente.
- [x] Nenhum erro no console do navegador durante a navegação pelas seis telas.

### Adendo — dois bugs visuais reportados pelo Alex após a verificação, 18/09/2026

Alex testou pessoalmente logo após o fechamento acima e reportou dois problemas reais,
que a verificação anterior não tinha pegado porque foi feita com poucos cards (sem
overflow suficiente para expor o segundo). Ambos corrigidos e detalhados em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md) e no
[`DOCUMENTACAO.md`](../../DOCUMENTACAO.md) raiz.

- [x] **Mancha atrás dos cards de tarefa no Workspace** — o brilho do topo do `body`
      usava altura em `%` da altura total da página; corrigido para um valor fixo em
      `px`.
- [x] **Fade lateral imperceptível em cards claros** — o `FadeScroller` usava
      `mask-image` (apaga a opacidade do próprio conteúdo), que só é visível em
      conteúdo escuro/saturado. Trocado por uma camada de degradê sobreposta na cor
      real do fundo (`fadeColor`), visível em qualquer conteúdo.
- [x] `npx tsc --noEmit` e `npm test` (41 testes) depois das duas correções.

### Adendo — fundo do body virou chapado, a pedido do Alex, 18/09/2026

Alex mandou o mockup "1c — Workspace" e pediu o fundo exatamente igual. Amostragem
pixel a pixel do PNG (via `canvas.getImageData`, arquivo temporário nunca commitado)
confirmou que o fundo da referência é a cor sólida `#d2d2d2` (já era `--bg`), sem
brilho de propósito. O brilho radial do `body` foi removido por completo —
`background-color` sozinho, sem `background-image` — porque qualquer altura de
brilho escolhida continuava sendo um risco de virar borda visível em outra
combinação de tela/conteúdo. Detalhe em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] `npx tsc --noEmit` e `npm test` (41 testes) depois da remoção.

### Adendo — "Onde os cards estão" e "Fila de follow-up" viraram janelas soltas, 18/09/2026

Alex pediu que os dois painéis da coluna direita do Workspace pudessem ser
arrastados pela tela e fechados, com chips de mostrar/ocultar do lado direito no
mesmo padrão visual dos chips de filtro à esquerda, e que a janela branca alinhasse
com a fileira de filtros (não mais com o título). Componente novo
`components/ui/DraggableWindow.tsx` (genérico, reutilizável) e
`components/workspace/WorkspaceAside.tsx` (extraído de `app/page.tsx`, virou Client
Component). Posição e estado aberto/fechado por painel em `localStorage`, por
navegador — não é dado do sistema. Detalhe completo em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] `npx tsc --noEmit` e `npm test` (41 testes) depois da mudança.

### Correção de rumo — arrastar removido, virou ícone no rail, 18/09/2026

Alex testou o arrasto do adendo acima e pediu para desfazer — voltou ao estado
estático de antes. O pedido revisado: os botões de mostrar/ocultar viraram dois
ícones redondos no rodapé do rail, sem texto, visíveis só no Workspace (rail e
painel são irmãos no layout, por isso o estado agora mora num contexto React
compartilhado, `WorkspacePanelsContext`). Detalhe completo em
[`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

- [x] `npx tsc --noEmit` e `npm test` (41 testes) depois da mudança.

---

## 11. Pendências abertas

- **Diferença entre `AGUARDANDO CONTRATO` e `FAZER PEDIDO DO SISTEMA`.** Hoje as duas
  contam como "fechou". Se a distinção importa operacionalmente, precisa estar escrita.
  Só o Alex pode responder.
- **Critério das etiquetas de Situação Especial** — o que qualifica "Prioridade" vs.
  "Retorno Necessário". Pendência herdada do `MANUAL_OPERACIONAL`.
- **Autorização para alterar o n8n.** A configuração está pronta em
  [`INTEGRACAO_N8N.md`](INTEGRACAO_N8N.md); nada foi aplicado.
- **Arquivar o board do Trello** ao fim da migração.
- **Os ~21 cards do funil ativo** que ficaram no Trello: digitar à mão ou importar.
- **Botão "+" de janela personalizada no Workspace.** Alex quer poder criar,
  além de "Onde os cards estão" e "Fila de follow-up", outras janelas: agenda
  estilo Google, resumo de dados de um cliente, gráfico de uma métrica
  específica. São três recursos distintos — decidir com o Alex qual construir
  primeiro antes de desenhar o pop-up de criação. Regra já combinada: no máximo
  duas janelas abertas ao mesmo tempo (as duas atuais já contam); abrir uma
  terceira exige fechar uma antes. Contexto em
  [`CONTEXTO_DE_CONTINUIDADE.md`](CONTEXTO_DE_CONTINUIDADE.md).

### Adendo de decisão — temperatura manual do cliente — 18/09/2026

Alex solicitou que o Workspace mostre temperatura no rodapé do card, junto dos
pontos e do valor, e que ele possa classificar o cliente conforme a interação.
Esta decisão cria o campo operacional nullable `clients.temperature`, com as opções
fechadas `frio`, `morno` e `quente`, além de vazio para "Classificar".

O campo recebe inicialmente a classificação declarada pelo SDR através do mapeamento
direto `ALTA` → `Quente`, `MODERADA` → `Morno`, `BAIXA` → `Frio`. O Alex pode alterar
essa classificação manualmente conforme a interação; depois de alterada, novos
repasses preservam o valor manual. Não há cálculo a partir de mensagens, tempo, etapa
ou probabilidade de fechamento. `sdr_confidence` continua sendo preservado como o
dado original do SDR. A classificação não alimenta as métricas do funil.

### Adendo visual — rolagem, cadastro e edição — 18/09/2026

- [x] Usar `FadeScroller` nos quadros horizontais de Funil e Tarefas e na tabela de
      listas, preservando a indicação visual de conteúdo lateral oculto.
- [x] Exibir a temperatura do SDR como `Quente`, `Morno` ou `Frio` também em cards
      legados sem a coluna preenchida, identificado como dado do SDR.
- [x] Reorganizar Cadastro e substituir os selects nativos de Temperatura e
      Modalidade no diálogo de edição por escolhas arredondadas e minimalistas.
- [x] Igualar a margem horizontal interna das páginas e o arredondamento do foco ao
      formato dos campos.

### Adendo visual — temperatura clicável — 18/09/2026

- [x] Remover Modalidade do diálogo Editar cliente, pois a definição continua nas
      etiquetas de modalidade da avaliação.
- [x] Usar o mesmo controle de pontos de temperatura no card e na edição; cada clique
      avança `Classificar → Frio → Morno → Quente → Classificar`.

### Adendo visual — tarefas sem etiquetas — 18/09/2026

- [x] Remover etiquetas de tarefas da interface e das queries de tarefas, preservando
      os registros históricos no banco sem apagar dados.
- [x] Trocar a seleção nativa de prioridade por caixa arredondada de opções Baixa,
      Média e Alta; a escolha só é persistida ao clicar em Salvar.
- [x] Aumentar discretamente os pontos de temperatura no diálogo Editar cliente, sem
      alterar o tamanho do controle no card.

### Correção de escopo — etiquetas de Situação especial — 18/09/2026

- [x] Manter em tarefas apenas `Prioridade`, `Retorno Necessário` e `Problema`, do
      grupo Situação especial.
- [x] Persistir essas sinalizações somente junto do botão Salvar e validar no servidor
      que nenhuma etiqueta de outra categoria entra em uma tarefa.

### Adendo visual — rodapé de tarefas — 18/09/2026

- [x] Separar prazo/prioridade do cliente relacionado em duas linhas e usar cores
      semânticas para melhorar a leitura dos cards de tarefa.

### Adendo visual — cor por prazo — 18/09/2026

- [x] Colorir cartões ativos de verde-claro, laranja-claro nos últimos 60 minutos e
      vermelho-claro após o prazo, preservando as mesmas cores no modo escuro.
- [x] Incluir tarefa a menos de uma hora no filtro Hoje.

### Adendo visual — colunas e H1 — 18/09/2026

- [x] Remover o painel de fundo das colunas de tarefas, mantendo somente o cabeçalho e
      os cartões.
- [x] Reduzir os títulos H1 compartilhados das páginas em cerca de 20%.

### Correção visual — faixa de tarefas — 18/09/2026

- [x] Restaurar a faixa da coluna de tarefas (dia, contador e ação Nova tarefa).
- [x] Manter removido apenas o fundo cinza amplo do quadro atrás das colunas.

### Correção visual — faixa da coluna — 18/09/2026

- [x] Voltar a faixa interna da coluna de tarefas ao visual anterior, sem painel cinza.
- [x] Preservar a remoção do fundo amplo atrás dos cartões.

### Correção visual final — Kanban — 18/09/2026

- [x] Restaurar o Kanban ao padrão do anexo: fundo geral cinza e painéis de coluna
      cinza-claro arredondados.

### Ajuste visual — agenda do Workspace — 18/09/2026

- [x] Reduzir a barra superior de agenda e seus controles para 40px, preservando seu
      comprimento e alinhando-a aos ícones da navegação lateral.

### Refinamento visual — agenda do Workspace — 18/09/2026

- [x] Reduzir a agenda de 40px para 36px e corrigir o controle de tema para caber
      integralmente na cápsula.

### Ajuste pela referência — agenda do Workspace — 18/09/2026

- [x] Ajustar a agenda e controles para 44px e alinhar toda a linha ao logotipo,
      conforme referência visual.

### Ajuste — temperatura no cadastro — 18/09/2026

- [x] Usar a escala de temperatura clicável do card no painel Cadastro do cliente,
      com gravação imediata a cada clique.

### Correção — temperatura no título do lead — 18/09/2026

- [x] Posicionar a escala de temperatura ao lado do nome no título da página do cliente,
      com gravação imediata a cada clique.
