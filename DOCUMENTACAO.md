# DOCUMENTAÇÃO — Capill CHIA

Histórico do que foi construído no sistema, em ordem cronológica.

**Este arquivo é append-only.** Entradas antigas nunca são reescritas nem
apagadas — mesmo quando a decisão que elas registram foi revertida depois. Se
algo mudou, entra uma entrada nova dizendo o que mudou e por quê. O valor deste
arquivo está justamente em preservar o raciocínio da época, inclusive os erros.

Seções: [Contexto](#contexto) · [Sistemas](#sistemas) · [Habilidades](#habilidades) ·
[Integrações](#integrações) · [Automações](#automações) · [Git/GitHub](#gitgithub)

---

## Onde consultar o quê

Para quem (pessoa ou agente) chega sem contexto:

| Pergunta | Onde está |
|---|---|
| Como a Capill funciona, preços, tom de voz | `DNA_DA_CAPILL.md` |
| Regras do card e das etiquetas | `MANUAL_OPERACIONAL_CAPILL_V1.md` |
| As 11 palavras-chave de evento | `PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md` |
| Antes de propor automação, lista ou campo novo | `CRITERIOS_DE_SUCESSO_OPERACIONAL_CAPILL_V1.md` |
| Como os agentes se dividem | `PROTOCOLO_DE_TRABALHO_CAPILL_V1.md` |
| Como o Agente SDR atende e repassa | `SDR/AGENTS.md` |
| **O que já foi construído e por quê** | **este arquivo** |
| Como rodar o CSystem, o que cada tela faz | `CSystem/README.md` |
| Por que o CSystem é assim, o que foi descartado | `CSystem/docs/PLANEJAMENTO.md` |
| Como ligar o n8n no CSystem | `CSystem/docs/INTEGRACAO_N8N.md` |

**Três coisas que economizam tempo de quem for mexer no CSystem:**

1. **Arrastar o card é o que gera a métrica.** `lib/transitions.ts` grava em
   `list_transitions` a cada movimento. O comentário é opcional e serve para o
   *porquê*, nunca para o *quanto*.
2. **O mapa lista → palavra-chave → etapa vive no banco**, não no código
   (`lists.default_keyword`, `lists.counts_as_stage`), porque o Alex pode criar e
   renomear listas.
3. **O erro `Unexpected end of JSON input` no dev server não é bug nosso** — é interno
   do Next, some sozinho. Detalhe na entrada de 17/09.

---

## Contexto

### 2026-09-17 — Auditoria do board real do Trello

Leitura direta do board `Clientes Capill` (workspace "Área de trabalho de Capill",
`trello.com/b/vza5vaax`) via conector MCP, para cruzar o que os documentos dizem com
o que existe de fato. Quatro divergências encontradas:

**1. São 12 listas, não 10.** Os documentos citavam dez. A ordem real é:

`MATERIAIS DE APOIO` · `LEAD QUALIFICADO` · `LEAD FOLOW-UP` · `AVALIAÇÃO AGENDADA` ·
`ANALISANDO PROPOSTA` · `FOLLOW-UP` · `AGUARDANDO CONTRATO` · `FAZER PEDIDO DO SISTEMA` ·
`AGUARDANDO A PEÇA` · `CHEGOU PEÇA` · `1° CONTATO PÓS VENDA` · `SEM RETORNO`

**2. `LEAD FOLOW-UP` está com erro de grafia** no Trello — falta um L.

**3. `AGUARDANDO CONTRATO` existe e está em uso** (3 cards), mas não aparece em
documento nenhum.

**4. O grupo SITUAÇÃO ESPECIAL já existe** — `Prioridade` (vermelho),
`Retorno Necessário` (vermelho claro) e `Problema` (vermelho escuro), todas com zero
usos. Isso **encerra a pendência** que estava aberta no
`MANUAL_OPERACIONAL_CAPILL_V1.md`.

**Volume:** 337 cards abertos, mas o funil comercial ativo é pequeno — 156 em
`1° CONTATO PÓS VENDA`, 150 em `SEM RETORNO`, 10 templates, e **apenas 21 cards nas
demais listas somadas**.

**Lição aprendida:** o board tinha uma limitação de legibilidade que nenhum documento
registrava — as **7 etiquetas de ORIGEM têm todas a mesma cor** (`sky_light`), o que
as torna visualmente indistinguíveis no card. A etiqueta existia, mas não cumpria a
função de classificar à primeira vista.

### 2026-09-17 — Correções factuais nos documentos-fonte

Decorrentes da auditoria acima:

- `MANUAL_OPERACIONAL_CAPILL_V1.md` — pendência de SITUAÇÃO ESPECIAL marcada como
  resolvida; nova seção **LISTAS DO FUNIL** com as 12 listas reais, o typo e a lista
  não documentada; nota de que o sistema operacional passa a ser o CSystem.
- `PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md` — nota explicando que a contagem de
  funil deixou de depender do comentário (ver entrada do CSystem abaixo).
- `AGENTS.md` (raiz) — nova seção **Sistemas** apontando para `CSystem/`.

**Pendência nova aberta no Manual:** qual é a diferença real entre
`AGUARDANDO CONTRATO` e `FAZER PEDIDO DO SISTEMA`? Hoje as duas contam como "fechou"
na métrica. Se a distinção importa operacionalmente, precisa estar escrita — só o
Alex pode responder isso.

---

## Sistemas

### 2026-09-17 — CSystem: CRM operacional (construção inicial)

Criado o `CSystem/` — CRM que substitui o board do Trello e recebe os leads do Agente
SDR. **83 arquivos**, Next.js 15 + React 19 + TypeScript + Tailwind v4 + SQLite
(better-sqlite3) + Drizzle ORM + @dnd-kit.

Documentação própria em [`CSystem/README.md`](CSystem/README.md).

#### O problema que motivou

O funil vivia em dois lugares desconectados — o Trello e o WhatsApp — e **não produzia
nenhum número contável**. Responder "quantos agendaram este mês" exigia ler comentário
por comentário, e só funcionava se o comentário tivesse sido escrito. O
`DNA_DA_CAPILL.md` §30 levanta a hipótese de que o gargalo está no volume de leads
qualificados e avaliações, mas nunca houve dado para testar isso.

#### A decisão central: o arrasto gera o dado

**Mover o card entre listas grava a métrica sozinho.** Toda mudança de lista insere
uma linha em `list_transitions` — sempre, sem perguntar nada, dentro de uma transação
(ou o card move e o número é gravado, ou nada acontece).

Depois do arrasto aparece um balão sugerindo a palavra-chave do destino (`AGENDOU`,
`COMPARECEU`, `FECHOU`…), mas **ignorá-lo não perde nenhum número**. O botão secundário
se chama **"Só mover"**, não "Cancelar", exatamente para comunicar isso.

Consequência: o comentário passa a servir para o **porquê** (motivo da objeção, data de
retorno), nunca para o **quanto**. A métrica deixa de depender de disciplina de registro.

#### Teste do Engenheiro aplicado

Conforme exige a Regra 2 do `AGENTS.md`. Veredito: **APROVAR COM AJUSTES**. Os quatro
ajustes exigidos foram incorporados:

1. **O arrasto é a decisão humana.** Gravar o evento a partir dele não viola o item 9
   do `PROTOCOLO_DE_TRABALHO` — foi o Alex quem moveu. O que o sistema **não** faz é
   mover card sozinho.
2. **Métrica quantitativa e registro qualitativo são coisas separadas.**
3. **A tela Entrada SDR é passiva** — sem badge de pendência, sem fila a trabalhar. Só
   evita que o lead não-qualificado se perca no scroll do WhatsApp.
4. **Nenhum campo novo sem uso comprovado** — sem score, sem temperatura de lead.

**Risco declarado na época:** a partir do go-live, escrever no Trello cria uma segunda
fonte de verdade e quebra a Regra 1. O board precisa ser arquivado ao fim da migração.

#### Decisões do Alex durante a construção

- **Substituir o Trello**, não sincronizar — evita duas fontes de verdade.
- **Sem importação.** A base começa vazia. O seed cria só a estrutura: 12 listas, 15
  etiquetas, 4 colunas de tarefa, **zero clientes**. Os ~21 cards do funil ativo ficaram
  de fora; trazê-los depois é digitação manual ou importação pontual.
- **Tudo editável** — criar/renomear/recolorir/excluir listas, cards e etiquetas, com
  seletor de cor de 16 tons + hex livre.
- **Local agora, nuvem depois** — mesma base de código.

#### Duas decisões de arquitetura que valem preservar

**1. `list_transitions` guarda um snapshot** do nome e do estágio das listas envolvidas.
Por isso renomear ou excluir uma lista depois **não corrompe** os números dos meses
anteriores. Excluir uma lista pede destino para os cards e nunca apaga histórico.

**2. O mapa "lista → palavra-chave → etapa de métrica" vive no banco**
(`lists.default_keyword`, `lists.counts_as_stage`), não no código. Como o Alex pode
criar e renomear listas, um mapa fixo em código quebraria na primeira lista nova. Duas
listas podem apontar para a mesma etapa — é o caso de `AGUARDANDO CONTRATO` e
`FAZER PEDIDO DO SISTEMA`, ambas "fechou".

#### Regras dos documentos implementadas em código

| Regra | Onde |
|---|---|
| Regra 1 — card único por cliente (telefone normalizado como chave única; criar duplicado é bloqueado e o app oferece abrir o existente) | `lib/phone.ts`, `app/actions/clients.ts` |
| Regra 2 — 4 grupos de etiquetas independentes, grupo é texto livre | `components/config/LabelsManager.tsx` |
| As 11 palavras-chave, escolhidas em lista fechada e nunca digitadas | `lib/keywords.ts` |
| Um comentário = um evento (recusa dois eventos no mesmo texto) | `app/actions/events.ts` |
| Motivo nunca adivinhado — padrão `motivo não identificado` | `lib/keywords.ts`, `TransitionPrompt.tsx` |
| O SDR nunca registra `AGENDOU` — convertido para `OUTRO` | `lib/keywords.ts:sanitizeSdrKeyword` |
| Ausência de dado ≠ dado negativo (§13A): "sem dados", nunca 0% | `lib/metrics.ts` |
| Amostra pequena marcada como tal (§13), abaixo de 10 eventos | `lib/metrics.ts` |

**Pegadinha preservada de propósito:** a grafia `NAO COMPARECEU` e `PECA CHEGOU` está
**sem acento**, porque é assim no `PADRAO_DE_COMENTARIOS`. "Corrigir" quebraria a
correspondência com o padrão. Há teste cobrindo isso.

#### Telas

`/` Workspace · `/funil` (Kanban + Lista) · `/clientes/[id]` · `/tarefas` (Kanban +
Lista) · `/agenda` · `/metricas` · `/entrada-sdr` · `/configuracoes`. Tema claro/escuro
em qualquer tela.

#### Duas decisões de design que fogem da referência visual

**As bolinhas do card.** Na imagem de referência elas marcam "interesse". No CSystem
mostram o **nível de confiança do SDR** (ALTA/MODERADA/BAIXA), que é campo real do
bloco `===REPASSE===`. Criar um "score de interesse" seria dado novo sem uso
comprovado — reprovado pelo Teste do Engenheiro.

**Gráficos em série única.** A skill `dataviz` exige rodar um validador de paleta
antes de publicar qualquer paleta categórica. O validador roda em Node, que não estava
instalado. Em vez de publicar paleta não validada, todos os gráficos foram estruturados
em série única — os motivos de perda viraram tabela com barra de total em vez de duas
cores. **Se um dia for preciso um gráfico multi-série, o validador tem que rodar antes.**

#### Estado da entrega — LEIA ANTES DE MEXER

**Nada foi compilado nem executado.** O Node.js não estava instalado na máquina no
momento da construção, então não rodaram: `npm install`, `npm run build`,
`npm test`, nem uma única tela. O código foi revisado por leitura, não por execução.
**É esperado que apareçam erros de tipo ou de build na primeira vez.**

Passos para validar quando o Node estiver instalado:

```
npm install
cp .env.example .env.local     # e trocar CSYSTEM_WEBHOOK_TOKEN
npm run db:push
npm run db:seed
npm run dev
```

O teste principal, descrito no plano: criar 3 clientes, arrastar pelo funil inteiro até
`1° CONTATO PÓS VENDA` **sem escrever nenhum comentário**, e conferir que `/metricas`
mostra 3 agendados, 3 compareceram, 3 fecharam e 3 aplicaram.

**Lição aprendida:** verificar a existência do runtime **antes** de escolher a stack.
A checagem de Node só aconteceu já no meio do planejamento, e por sorte não mudou a
decisão — mas poderia ter mudado, e teria custado o replanejamento inteiro.

### 2026-09-17 — Registro do planejamento do CSystem

A entrada acima documentou as **decisões e o resultado**, mas não o **processo**. O
plano aprovado vivia em `~/.claude/plans/`, uma pasta interna do Claude, fora do
repositório e com nome gerado aleatoriamente — ou seja, não era contexto consultável.

Trazido para dentro do repo em
[`CSystem/docs/PLANEJAMENTO.md`](CSystem/docs/PLANEJAMENTO.md), com o que faltava:

- **As alternativas descartadas e por quê** — espelho bidirecional com o Trello, app em
  arquivo único sem Node, deploy direto na nuvem, copiar o board com o typo, descartar
  a `AGUARDANDO CONTRATO`.
- **O Teste do Engenheiro com as 9 perguntas respondidas** (antes só o veredito estava
  registrado).
- **Como o plano mudou** depois da primeira revisão do Alex, incluindo a inversão de
  arquitetura: o desenho original era *o comentário move o card*; virou *mover o card
  grava o comentário*. Foi essa inversão que tirou a métrica da dependência de
  disciplina de registro.
- A especificação visual, o mapa lista → palavra-chave → etapa, e o **checklist de
  verificação com nenhum item executado**.

**Lição aprendida:** documentar decisão não é documentar planejamento. A decisão
responde "o que ficou"; o planejamento responde "o que mais foi considerado e por que
perdeu". Sem a segunda parte, alguém — inclusive um agente lendo o repo — propõe de
novo daqui a seis meses a alternativa que já foi analisada e descartada.

### 2026-09-17 — CSystem verificado rodando: 8 bugs encontrados e corrigidos

Node.js v24.19.0 instalado. O app foi **compilado e executado pela primeira vez**, e
todo o checklist de verificação foi percorrido no navegador. Estado final:
**typecheck 0 erros, 38 testes passando, `next build` gerando as 12 rotas**.

#### O teste principal passou

Criar cliente → arrastar para AVALIAÇÃO AGENDADA → clicar em **"Só mover"** (ou seja,
**sem escrever nenhum comentário**) → `/metricas` mostra "Avaliações agendadas: 1" com
delta +1.

**A tese central do sistema está comprovada na prática: a métrica não depende de
disciplina de registro.**

Também verificados: desfazer (card volta e o contador **não** infla — de 2 não foi para
3), webhook com Regra 1 (dois disparos do mesmo telefone → `created: false` e o mesmo
`clientId`), `NÃO QUALIFICADO` não entra no funil, `AGENDOU` do SDR convertido para
`OUTRO`, webhook sem token retorna 401, modalidade Online derivada de "Mossoró",
alternador Lista ⇄ Kanban nas tarefas, e o card de tarefa de hoje ficando verde-limão
inteiro como na referência.

#### Bugs encontrados ao rodar

1. **`better-sqlite3@11` não instalava** — sem binário pré-compilado para o Node 24,
   caía no `node-gyp`, que exige Python (ausente). Resolvido subindo para a **v13**,
   que tem binário pronto: instalou em 37s sem compilar nada.
2. **Placeholder do template virava dado.** `LEAD: [nome]` era desembrulhado e criava
   um cliente chamado "nome". Agora valor inteiramente entre colchetes é tratado como
   ausente. *Foi um teste que pegou isso, não a execução.*
3. **Barra de agenda ilegível no escuro.** Ela usa `bg-ink`, que inverte entre os
   temas, mas o texto interno estava fixo em branco — sumia quando a barra ficava
   clara. Trocado por `ink-invert`. Mesmo problema no toast de desfazer.
4. **"amostra de 0" nas métricas.** O aviso de amostra pequena usava o numerador. A
   amostra de uma taxa de conversão é o **denominador** — 0 de 1 é amostra de 1.
5. **Desfazer inalcançável.** Com o balão de confirmação aberto, o toast de desfazer
   ficava atrás do modal e expirava em 9s — justamente quando se percebe ter arrastado
   o card errado. Adicionado **"Desfazer movimento" dentro do próprio balão**.
6. **Transição de entrada saía como "LEAD QUALIFICADO → LEAD QUALIFICADO"**, porque o
   cliente novo já nascia na lista de destino. Agora lead novo registra "Entrou em".
7. **Markdown cru na tela.** A descrição vinda do repasse era gerada com `**negrito**`
   mas renderizada como texto puro. Trocado por títulos em caixa alta.
8. **Erro de hidratação do `@dnd-kit`** — sem `id` fixo no `DndContext`, o
   `aria-describedby` dos cards diverge entre servidor e cliente. Ids fixados.

Melhoria de leitura aplicada junto: movimento e comentário viraram **uma entrada só**
na linha do tempo, pareados por `transitionId` em vez de proximidade de horário.

#### Um erro que NÃO é bug do CSystem

`SyntaxError: Unexpected end of JSON input` com HTTP 500 aparece esporadicamente no
dev server. É interno do Next: só ocorre imediatamente após um recompile do Fast
Refresh, a requisição seguinte à mesma página volta 200, e o stack não tem nenhum frame
do nosso código. Os dois únicos `JSON.parse` do projeto estão dentro de `try/catch`. O
build de produção não é afetado. **Não perder tempo investigando isso de novo.**

#### Lições aprendidas

- **Node LTS recente quebra módulo nativo.** Ao escolher dependência com binário
  compilado, conferir se há prebuild para a versão do Node em uso — senão o
  `npm install` exige toolchain de compilação que quase nunca está instalada.
- **A tecla é `Enter`, não `Return`.** Perdi várias rodadas de teste achando que era
  bug do app. Não era.
- **Escrever ~80 arquivos sem executar saiu melhor do que o esperado** — o typecheck
  passou de primeira. Mas os 8 bugs acima só apareceram rodando, e metade deles é de
  interação (tema, foco, ordem de camadas) que nenhum teste unitário pegaria.

---

## Habilidades

*(sem entradas ainda)*

---

## Integrações

### 2026-09-17 — Webhook CSystem para o Agente SDR

Criado `POST /api/sdr/repasse`, autenticado pelo header `x-csystem-token`. Substitui o
nó do n8n que criava o card no Trello. **A notificação por WhatsApp para o Alex
continua intacta** — só o passo do Trello muda.

Configuração completa do nó em
[`CSystem/docs/INTEGRACAO_N8N.md`](CSystem/docs/INTEGRACAO_N8N.md).

**Nada foi aplicado no n8n.** Alterar o fluxo que atende cliente real depende de
autorização explícita do Alex.

Comportamento, espelhando a automação atual:

- `QUALIFICADO` → cria ou atualiza o cliente na lista de estágio `qualificado` e grava
  a transição (o lead já conta na métrica).
- `NÃO QUALIFICADO` / `INDEFINIDO` → só no registro de entrada, **não toca no funil**.
- Deduplicação **por telefone** antes de criar (Regra 1).
- Comentário com `AGENDOU` → convertido para `OUTRO`, com aviso.
- O bloco bruto é **salvo antes** do processamento: nenhum lead se perde por erro.

**Lacuna fechada:** a modalidade Studio/Online passa a ser derivada da `CIDADE`, pela
lista literal de cidades do `SDR/AGENTS.md`, e aplicada como etiqueta. Até aqui o SDR
decidia isso na conversa e a informação **nunca chegava ao card** — o campo não existe
no bloco `===REPASSE===`.

**Limite conhecido:** o `===REPASSE===` é um contrato de **texto** gerado por um modelo
de linguagem, não um JSON. O parser (`lib/sdr-parser.ts`) foi feito tolerante — acento
faltando, dois-pontos ausente, campo em linha ou em bloco, colchetes de template não
preenchidos. O que ele **não** faz é adivinhar: campo ausente vira `null`, e `null`
nunca vira valor padrão. Os campos que faltaram são listados na tela de Entrada SDR.

**Cuidado ao rodar local:** o n8n na nuvem não alcança `localhost`. Ou se usa um túnel
temporário (`cloudflared tunnel --url http://localhost:3000`), ou se cola o bloco
manualmente em **Entrada SDR** — que tem prévia do parse antes de gravar.

---

## Automações

### 2026-09-17 — Transição de lista como evento de métrica

Documentado em detalhe na entrada do CSystem acima. Registro resumido aqui porque é,
na prática, a automação mais importante do sistema: **arrastar um card é o gatilho que
grava o dado**, e nenhum relatório manual alimenta o dashboard.

Desfazer um arrasto **apaga** a transição em vez de gravar um movimento de volta — o
arrasto foi um engano, não um passo do cliente no funil. Gravar os dois inflaria a
contagem do período.

---

## Git/GitHub

### 2026-09-17 — Nada commitado

A construção do CSystem e as correções nos documentos-fonte estão na árvore de trabalho,
**sem commit**. A decisão de commitar é do Alex.

`CSystem/.gitignore` já exclui `node_modules/`, `.next/` e — importante — o banco
`data/*.db`, que contém dado real de cliente e nunca deve ir para o repositório.

### 2026-09-17 — Correção: etiqueta de tarefa não atualizava o quadro

Durante a validação manual do CRUD, aplicar uma etiqueta em uma tarefa a gravava no
banco, mas o chip não aparecia no quadro até recarregar a página. A causa era o cache
local usado pelo drag-and-drop em `TasksBoard`: a assinatura de sincronização não
incluía `task.labels`.

Corrigido em `CSystem/components/tarefas/TasksView.tsx`, incluindo os IDs das etiquetas
na assinatura; `TaskDialog` também chama `router.refresh()` após a action. O fluxo foi
retestado: o chip aparece no quadro imediatamente depois de fechar a edição, nos temas
claro e escuro.

### 2026-09-18 — Refinamento visual, eventos e handoff do CSystem

**Estado do commit:** os refinamentos desta entrada continuam sem commit porque Alex
determinou que as mudanças sejam mostradas antes. A nota antiga de 17/09 dizendo
"Nada commitado" descreve aquele momento: depois dela existem `0786b8b`, `dc69877` e
`5f41335`. O retrato completo de arquivos pendentes e decisões está em
[`CSystem/docs/CONTEXTO_DE_CONTINUIDADE.md`](CSystem/docs/CONTEXTO_DE_CONTINUIDADE.md).

**Design e interações:** Urbanist e a paleta fornecida por Alex (`#000000`, `#B9FF66`,
`#D2D2D2`, `#66FFED`, `#FFFFFF`, `#F04949`) foram aplicados como interpretação visual
consistente, não cópia pixel a pixel, da referência do Dribbble. Workspace, agenda,
funil, tarefas, métricas e configurações ganharam espaçamento e superfícies coerentes;
modo, notificações e perfil foram para a barra de agenda do Workspace. Cards de
clientes/tarefas abrem por duplo clique, etiquetas selecionadas usam brilho em vez de
delineado preto, a rolagem de etiquetas do Funil tem fade lateral, e confiança usa
graduação vermelho → verde com chama somente no nível alto. O `C` no rail é provisório
até que exista uma marca oficial.

**Eventos:** a prévia de comentário saiu dos cards sem apagar o histórico. No detalhe
do cliente, comentários humanos são **Eventos** e movimentos, SDR e automações são
**Registros do sistema**; ambos os blocos são retráteis.

**Bug corrigido — tema:** o primeiro clique podia não alternar porque o estado React
inicial divergia do atributo aplicado antes da hidratação. `ThemeToggle` passou a ler
`document.documentElement[data-theme]` no clique, calcular o próximo tema e persistir
`csystem-theme`. A alternância foi conferida depois de reiniciar o dev server.

**Verdade da métrica:** badges positivos são verde-limão e negativos vermelhos, ambos
com número preto. Fechadas e Perdidas mostram temporariamente `+1` e `-1` apenas como
exemplo visual pedido por Alex quando não há delta real; possuem tooltip/acessibilidade
de exemplo e devem ser removidos ou calculados de verdade após aprovação visual.

**Validação e ambiente:** CRUD de listas/etiquetas, snapshot histórico, bloqueio de
arquivamento com cards, dois temas, duplo clique, tema e timeline foram exercitados no
navegador local. `npx tsc --noEmit` passou após a última alteração; `npm test` passou
com 38 testes. Não rodar `next build` junto de `next dev`: ambos disputaram `.next`,
causaram `vendor-chunks` ausente e falha de hidratação; parar e reiniciar o dev server
limpo resolveu. O banco `CSystem/data/csystem.db` continua ignorado e não deve ser
limpo sem autorização explícita.

**Retomada:** foi criado `CSystem/AGENTS.md`, que direciona todo novo agente ao README,
ao handoff, ao planejamento e a este arquivo append-only.

### 2026-09-18 — CSystem V1.01: auditoria visual aplicada

Alex autorizou a aplicação dos mockups definidos na auditoria visual: Workspace 1C,
Funil 2A, Tarefas 2B, Agenda 3A, Métricas 3B e Configurações 3C. O Workspace ganhou
grade assimétrica com a lateral "Onde os cards estão" e "Fila de follow-up", busca e
filtros antes dos cards, e a mesma largura visual de 288px nas fileiras. Cabeçalhos,
contadores, cápsula de controles, cards, Agenda, Métricas e Configurações foram
ajustados para a composição dos mockups. Etiquetas claras passaram a escurecer apenas
o texto para preservar legibilidade.

As regras de negócio, banco, webhook, listas, palavras-chave, transições e cálculos de
métrica permaneceram intocados. `npx tsc --noEmit` passou e `npm test -- --run`
passou com 38 testes. A tela Workspace foi conferida visualmente em `localhost:3002`;
o build ficou pendente porque havia um servidor `next dev` ativo na porta 3000 e o
handoff exige que ele seja parado antes de gerar build.

### 2026-09-18 — Temperatura manual no card do CSystem

Alex definiu que o Workspace deve manter temperatura e valor no rodapé do card e que
a temperatura seja classificada conforme a interação com o lead. O CSystem passou a
ter o campo nullable `clients.temperature`, com as opções `Frio`, `Morno`, `Quente` e
`Classificar`, seleção rápida no card e seleção no diálogo de edição.

No ingresso do SDR, o `NÍVEL DE CONFIANÇA` declarado preenche a temperatura inicial em
mapeamento direto: `ALTA` → `Quente`, `MODERADA` → `Morno`, `BAIXA` → `Frio`. Se Alex
já alterou manualmente o cliente, o próximo repasse preserva a classificação manual.
Não há inferência, pontuação ou cálculo de temperatura; `sdr_confidence` continua
preservado como dado original e a classificação não altera as métricas do funil.
`npm run db:push` aplicou a coluna sem resetar o banco; typecheck e os 38 testes
continuam passando.

### 2026-09-18 — Segunda rodada visual: temperatura SDR e controles do cliente

Funil, Tarefas e a tabela de listas passaram a reutilizar o fade lateral do Workspace
quando há conteúdo além da largura visível. O shell agora aplica margem interna
simétrica, deixando a distância direita dos painéis proporcional à esquerda.

O Cadastro do cliente foi reorganizado com mais respiro, hierarquia e um chip de
temperatura. Em registros anteriores à coluna `temperature`, a interface apresenta a
conversão direta já declarada pelo SDR (`ALTA`/`MODERADA`/`BAIXA`) e identifica a origem
como SDR; nenhum score, inferência ou dado operacional foi criado. O diálogo Editar
cliente substituiu selects nativos de Temperatura e Modalidade por escolhas visuais
arredondadas, e o foco dos campos segue o mesmo raio do controle.

### 2026-09-18 — Temperatura clicável e modalidade por etiqueta

Por decisão posterior do Alex, Modalidade da Avaliação não é mais editável no cadastro:
ela continua definida pelas etiquetas. O controle de temperatura foi unificado entre
o rodapé do card e o diálogo Editar cliente. As bolinhas agora são clicáveis e percorrem
`Classificar → Frio → Morno → Quente → Classificar`; no card a gravação é imediata e,
no diálogo, a escolha é gravada ao salvar.

### 2026-09-18 — Simplificação de tarefas e prioridade

Alex decidiu que tarefas não precisam de etiquetas. A atribuição e a exibição de
etiquetas foram removidas das telas e da query de tarefas; a tabela histórica
`task_labels` foi preservada, sem apagar dados existentes. A prioridade saiu do select
nativo e passou a usar uma caixa arredondada de três opções nas cores do CSystem. Como
todo campo do pop-up, essa escolha fica somente no estado local e só é gravada ao usar
Salvar. Os pontos de temperatura no pop-up Editar cliente foram aumentados levemente,
mantendo o mesmo desenho do card.

### 2026-09-18 — Correção: sinalizações especiais em tarefas

Alex esclareceu que tarefas não usam etiquetas gerais, mas precisam manter as três
sinalizações de Situação especial: `Prioridade`, `Retorno Necessário` e `Problema`.
Elas foram reintroduzidas na criação, edição e leitura de tarefas. A seleção fica local
no pop-up e só é gravada em Salvar; o servidor aceita somente IDs do grupo
`SITUACAO_ESPECIAL`, impedindo Origem, Modalidade ou Pagamento em tarefas.

### 2026-09-18 — Rodapé dos cartões de tarefa

O rodapé dos cartões de tarefa foi reorganizado: prazo e nível de prioridade ocupam a
primeira linha, com cores semânticas, e o cliente relacionado passou para uma faixa
única abaixo. Isso elimina a quebra irregular de chips e separa visualmente atraso,
urgência e vínculo com o cliente.

### 2026-09-18 — Cor de tarefa pelo prazo

Alex definiu a cor integral dos cartões de tarefa por prazo: verde-claro para tarefa
ativa, laranja-claro quando restam até 60 minutos e vermelho-claro em atraso. As cores
permanecem literais nos dois temas. O estado de menos de uma hora também integra o
filtro Hoje para evitar que uma tarefa crítica desapareça da leitura diária.

### 2026-09-18 — Colunas de tarefa sem faixa e H1 menor

Por pedido do Alex, o painel cinza atrás dos cartões de tarefa foi removido para seguir
o mockup. Os títulos H1 compartilhados pelo Workspace, Funil e demais páginas foram
reduzidos em aproximadamente 20%, de 48/62px para 38/50px.

### 2026-09-18 — Correção da faixa de tarefas

O pedido anterior de remover a faixa foi corrigido: a coluna de tarefas voltou a ter seu
painel com o título do dia, contador e ação de nova tarefa. O que foi retirado é somente
o fundo cinza amplo que ficava atrás das colunas, substituído por uma superfície neutra.

### 2026-09-18 — Ajuste final da faixa de tarefas

A faixa interna da coluna voltou ao visual anterior, sem painel cinza. Continua removido
somente o fundo amplo atrás dos cartões de tarefa.

### 2026-09-18 — Kanban restaurado conforme referência

A referência do anexo foi confirmada: o Kanban usa fundo geral cinza e cada coluna é um
painel cinza-claro arredondado, contendo cabeçalho, contador, cartões e Nova tarefa.

### 2026-09-18 — Agenda compacta no Workspace

A barra de agenda no topo do Workspace passou a ter 40px, mantendo seu comprimento. Os
compromissos e controles de tema, notificações e perfil foram ajustados à mesma altura,
alinhada aos ícones da rail lateral.

### 2026-09-18 — Refinamento da agenda compacta

A agenda foi reduzida de 40px para 36px. O controle de tema agora usa botão de 28px e
ícone de 15px, contido integralmente em sua cápsula; os controles vizinhos acompanham a
mesma escala.

### 2026-09-18 — Alinhamento da agenda conforme referência

A barra de agenda e seus controles passaram a 44px e foram equilibrados na mesma linha
do logotipo. Atalho, tema, notificações, avatar e compromissos foram redimensionados
para permanecerem alinhados e contidos em suas cápsulas.

### 2026-09-18 — Temperatura clicável no cadastro

O painel Cadastro da página do cliente agora mostra a mesma escala de bolinhas do card
do funil. Cada clique altera e grava a temperatura imediatamente; a origem SDR continua
identificada enquanto não houver classificação manual.

### 2026-09-18 — Temperatura no título do lead

A escala de temperatura foi posicionada imediatamente após o título grande com o nome
do lead. O controle é o mesmo do card do funil e salva a classificação a cada clique.
O painel Cadastro deixou de duplicar essa informação.

### 2026-09-18 — Correção de bug: mancha visível atrás dos cards no Workspace

Alex reportou uma "marcação" cinza atrás dos cards de Minhas Tarefas no Workspace, que
não batia com o design aprovado. Causa: o brilho radial do `body`
(`app/globals.css`) tinha a altura definida em `%`, relativa à altura *total* da
página (que cresce com o conteúdo) em vez da altura da tela. Na página do Workspace
(1532px de altura total), isso fazia o brilho se apagar por volta de 414px do topo —
bem onde caem os cards de tarefa — criando uma borda visível entre o brilho e o fundo
chapado, em vez de um degradê que passa despercebido perto do cabeçalho.

Correção: a altura do gradiente passou a ser um valor fixo em `px` (1000px, fade
completo por volta de 300px do topo), independente do tamanho da página. Conferido nos
temas claro e escuro, no Workspace (onde o bug aparecia) e nas demais telas (onde o
brilho continua atrás do cabeçalho, sem regressão). `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da correção.

### 2026-09-18 — Correção de bug: fade lateral imperceptível nas fileiras de cards claros

Alex pediu que a rolagem horizontal das fileiras de card (Novos Leads, Minhas Tarefas,
colunas do Funil/Tarefas, tabela de Listas) tivesse o mesmo efeito visível de degradê
que o brilho do topo da página. Verificação: o `FadeScroller`
(`components/ui/FadeScroller.tsx`) já aplicava um `mask-image` nas bordas, mas essa
técnica apaga a opacidade do próprio conteúdo — em chips escuros/saturados o efeito
aparecia bem, mas em cards claros sobre fundo cinza-claro quase da mesma cor o
desvanecimento era real, porém visualmente imperceptível, parecendo um corte reto.

Correção: trocada a técnica de `mask-image` por uma camada de degradê sobreposta
(`linear-gradient` de opaco a transparente) na cor real do fundo por trás da fileira
(`fadeColor`, novo prop, default `var(--bg)` = fundo da página). A única fileira que
não fica sobre o fundo da página é a tabela de Listas em Configurações, dentro de um
cartão branco — recebeu `fadeColor="var(--surface)"` para desvanecer na cor certa.
Conferido nos temas claro e escuro, no Workspace, no Funil (colunas do Kanban) e em
Configurações — o degradê agora é visivelmente igual ao efeito do topo em qualquer
conteúdo. `npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da correção.

### 2026-09-18 — Fundo do body virou 100% chapado, sem brilho nenhum

Alex mandou um mockup de referência ("1c — Workspace") e pediu o fundo exatamente
igual a ele. Para não adivinhar, o fundo do mockup foi amostrado pixel a pixel
(cópia temporária do PNG em `CSystem/public/`, servida pelo próprio dev server, lida
via `canvas.getImageData` no navegador — arquivo temporário removido depois, nunca
ficou no Git). Resultado: o fundo do mockup é a cor sólida `#d2d2d2` (já era o valor
de `--bg`) — não há brilho/vinheta de propósito atrás do cabeçalho; qualquer variação
de tom encontrada perto do topo (poucos pontos) é consistente com sombra dos próprios
elementos escuros da barra de agenda, não um gradiente de fundo.

Como o brilho radial (mesmo já corrigido para altura fixa em px) é uma fonte
recorrente de bug visual — qualquer altura escolhida pode voltar a aparecer como
borda em outra combinação de tela/conteúdo — ele foi removido inteiramente.
`body` agora só tem `background-color: var(--bg)`, sem `background-image`. Conferido
nos temas claro e escuro via `getComputedStyle` (`backgroundImage: "none"`).
`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da remoção.

### 2026-09-18 — Coluna lateral do Workspace alinhada com "Novos Leads"

Alex pediu para descer um pouco "Onde os cards estão" e "Fila de follow-up" para
alinhar com o subtítulo "Novos Leads". O topo do cartão já coincidia com o topo da
caixa do `<h2>`, mas não com o topo visual das letras (que sobra ~12px abaixo por
causa do `line-height`, medido com `canvas.measureText`). `WorkspaceAside` em
`app/page.tsx` ganhou `pt-3` (12px). Conferido nos dois temas; `npx tsc --noEmit`
(0 erros) e `npm test` (41 testes).

### 2026-09-18 — "Onde os cards estão" e "Fila de follow-up" viraram janelas soltas

Alex pediu que as duas janelas do Workspace pudessem ser arrastadas pela tela e
fechadas, com botões de mostrar/ocultar do lado direito no mesmo padrão visual dos
chips de filtro da esquerda. Componente novo e reutilizável
`components/ui/DraggableWindow.tsx` (arrasta pela alça, sem medição prévia — vira
`fixed` na posição atual só no primeiro arrasto; posição em `localStorage` por
painel). `components/workspace/WorkspaceAside.tsx` extraído de `app/page.tsx`
(precisa ser Client Component para ter estado); dois chips de alternância
(`chip`/`chip-on`/`chip-off`, mesma classe da fileira de filtros) sempre visíveis
para reabrir um painel fechado, alinhados com a fileira "Buscar leads" (`pt-[59px]`
no `<aside>`, medido via `getBoundingClientRect`). Estado de aberto/fechado também
em `localStorage`, por navegador. Nenhuma regra de negócio, banco ou webhook
tocado — é preferência de tela. `npx tsc --noEmit` (0 erros) e `npm test`
(41 testes) depois da mudança.

### 2026-09-18 — Arrastar foi removido; virou ícone no rail, só no Workspace

Alex testou o arrasto e pediu para desfazer, voltando ao estado estático de antes
(removidos `DraggableWindow.tsx` e o `WorkspaceAside.tsx` extraído). Os botões de
mostrar/ocultar "Onde os cards estão" e "Fila de follow-up" viraram dois ícones
redondos pequenos no rodapé do rail (menu vertical), sem texto, visíveis só na
tela Workspace. Como rail e painel são irmãos no layout, o estado precisou de um
contexto React compartilhado, novo:
`components/workspace/WorkspacePanelsContext.tsx`, consumido pelo rail
(`Rail.tsx`) e por um envelope mínimo (`PanelSlot.tsx`) em volta de cada seção em
`app/page.tsx`. Estado por navegador em `localStorage`, nunca no banco. Alex
também definiu, para quando o botão "+" de janela personalizada for construído:
no máximo duas janelas abertas ao mesmo tempo. `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da mudança.

### 2026-09-18 — Ícones de mostrar/ocultar saíram do rail, foram para o canto inferior direito

Alex pediu para os dois ícones saírem do rodapé do rail (canto inferior esquerdo
da tela) e ficarem soltos no canto inferior direito, só ícone, pelo menos 30%
menores. Novo `components/workspace/WorkspacePanelToggles.tsx` (`fixed bottom-5
right-5`, botões de 32px — 33% menor que os 48px do rail), renderizado só em
`app/page.tsx`. `Rail.tsx` voltou a ser só navegação. `npx tsc --noEmit` (0 erros)
e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Painel da direita fixo ao rolar; ícones sem fundo até clicar

Três ajustes: (1) o `<aside>` do Workspace ganhou `sticky top-6` — cola a 24px do
topo da tela ao rolar, em vez de sumir de vista; (2) realinhado com a fileira de
busca+chips do Novos Leads (`pt-[59px]`, mesma medição de uma rodada anterior,
repetida porque tinha sido revertida); (3) os dois ícones do canto inferior
direito perderam o fundo permanente — agora ficam transparentes (como os itens
inativos do rail) até serem clicados, só então mostram o fundo preto. `npx tsc
--noEmit` (0 erros) e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Widescreen: fim da coluna reservada, painéis flutuando com bandeja de fundo

Alex pediu que Novos Leads e Minhas Tarefas ocupassem a largura inteira da tela
(removida a coluna de grade de 300px reservada para o `<aside>`) e que "Onde os
cards estão"/"Fila de follow-up" ganhassem um fundo discreto atrás deles (agora
que flutuam sobre conteúdo de verdade, não mais sobre uma coluna vazia).
`app/page.tsx` perdeu a grade de duas colunas; novo
`components/workspace/WorkspacePanels.tsx` (substitui `WorkspaceAside` inline e
`PanelSlot.tsx`, removido) renderiza os dois cartões como overlay `fixed`
(`top-[233px] right-8`, trocando o `sticky` da rodada anterior porque sem coluna
de grade não sobra "altura de contenção" para ele grudar) dentro de uma bandeja
`bg-surface-sunken` com `shadow-[var(--shadow-raised)]` — cor e sombra já
existentes no sistema de design, não inventadas. `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da mudança.

### 2026-09-18 — Bandeja realinhada com os filtros; alça de arrastar pra recolher

Dois ajustes: (1) o topo da bandeja de fundo passou a bater exatamente com o
topo da fileira de busca+chips do Novos Leads (`top-[245px]`, antes o topo do
cartão de dentro é que batia, deixando a bandeja 12px acima da linha); (2) nova
alça de arrastar no topo da bandeja (estilo bottom sheet) — arrastar para baixo
recolhe as duas janelas, arrastar para cima ou um clique simples reabre/alterna;
não decide quais painéis existem (isso continua com os ícones do rail), só se a
bandeja está expandida ou minimizada. Lógica verificada via simulação de
eventos de ponteiro; **o arrasto de mouse de verdade ainda não foi confirmado
nesta sessão** — a ferramenta de automação disponível não reproduziu o gesto,
então vale o Alex testar com a mão antes de dar como fechado. `npx tsc --noEmit`
(0 erros) e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Bandeja presa embaixo à direita, laterais rentes com os cartões

Alex mandou uma referência (widget de chamada com painel de resumo embaixo, no
canto inferior direito, com alça no topo) e pediu duas mudanças: (1) a bandeja
de fundo perdeu o `px-3` — agora as laterais dela batem exatamente com as
laterais dos cartões, sem gap; (2) trocado o posicionamento de `top-[245px]`
(alinhado com a fileira de filtros) para `bottom-28` (112px do rodapé,
acima do cluster de ícones de mostrar/ocultar) — a bandeja agora cresce para
cima conforme mais painéis abrem, com a base sempre fixa. `npx tsc --noEmit`
(0 erros) e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Zero respiro embaixo, vidro fosco na bandeja, ícones foram pro lado

Alex pediu zero espaço entre a bandeja e o rodapé da tela (`bottom-28` →
`bottom-0`, cantos de baixo deixaram de ser arredondados) e um fundo
translúcido com desfoque (`bg-surface-sunken` a 70% de opacidade +
`backdrop-blur-md`, efeito vidro fosco). Como isso tira o espaço que os dois
ícones de mostrar/ocultar usavam embaixo da bandeja, eles mudaram para o lado
esquerdo dela (`WorkspacePanelToggles.tsx`) — ao lado, não acima, porque a
altura da bandeja varia com quantos painéis estão abertos, e "ao lado" nunca
colide independente dessa altura. `npx tsc --noEmit` (0 erros) e `npm test`
(41 testes) depois da mudança.

### 2026-09-18 — Correção de bug: clique na temperatura não avançava (Funil, cadastro, edição)

Alex reportou que clicar nas bolinhas de temperatura no Funil não fazia nada.
Investigação: o card mostra, quando não há classificação manual, a conversão
direta da confiança do SDR (`temperatureFromSdrConfidence`) para não parecer
"sem dado" — mas esse valor CONVERTIDO (não o dado real, que era `null`) estava
sendo passado como o valor que o clique avança. Resultado: o primeiro clique
calculava o próximo passo a partir de "Quente" (a conversão exibida) em vez de
a partir de `null` (o dado real) — o ciclo pulava direto para "Classificar" em
vez de avançar para "Frio", e como a interface volta a mostrar a mesma
conversão do SDR enquanto o campo real continuar `null`, parecia que o clique
não tinha feito nada.

O mesmo padrão (conversão do SDR usada como se fosse o dado editável) existia
em três lugares: `components/funil/ClientMiniCard.tsx`, `components/cliente/
ClientPageHeader.tsx` (temperatura ao lado do nome) e `components/cliente/
ClientDetails.tsx` (diálogo Editar cliente) — este último tinha uma
consequência mais séria: salvar o diálogo SEM tocar na temperatura gravava a
conversão do SDR como se fosse uma classificação manual, contrariando a decisão
já registrada de que a conversão é só exibição enquanto não houver escolha
manual.

Correção: `components/ui/TemperatureControl.tsx` ganhou um `displayValue`
separado de `value` — `value` é sempre o dado real (o que orienta o próximo
clique), `displayValue` é só o que aparece nas bolinhas quando `value` é
`null`. Os três locais foram ajustados para passar os dois separadamente.
Verificado clicando de fato no Funil (via evento de clique real e via
`dispatchEvent`) e recarregando a página: o ciclo agora avança
Classificar → Frio → Morno → Quente → Classificar, e a nova classificação
persiste no banco corretamente a cada passo. `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da correção.

### 2026-09-18 — "Fila de follow-up" vazia: não é bug, é a fonte de dado esperada

Alex também reportou que a "Fila de follow-up" não mostra nenhum card mesmo
depois de arrastar um cliente para a lista "Follow-up" no Funil. Investigação:
o widget (`getFollowupQueue` em `lib/queries.ts`) lê exclusivamente o campo
`clients.nextFollowupAt` — uma data — e não tem nenhuma relação com em qual
lista do Kanban o cliente está. Esse campo só é gravado num lugar do sistema
inteiro: quando o Alex registra um comentário no formato `FOLLOW-UP` com uma
data (`app/actions/events.ts`), o mesmo fluxo documentado em
`PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md`. Mover um card para uma lista
chamada "Follow-up" é só categorização do Kanban — não grava data nenhuma, de
propósito: a Regra "ausência de dado não é dado negativo" e o princípio de não
inferir motivo/data se aplicam aqui — o sistema não pode supor que mover um
card para essa lista significa uma data de retorno específica.
**Nenhum código foi alterado por este item** — é um esclarecimento de
comportamento existente, não uma correção. Se o Alex quiser que a lista
"Follow-up" e o campo de data fiquem ligados de alguma forma, isso é uma
decisão de produto nova que precisa ser conversada antes de qualquer mudança.

### 2026-09-18 — Ícones de volta ao canto direito (acima da bandeja) e reorganizar por arrasto

Alex pediu os dois ícones de mostrar/ocultar de volta à extremidade direita da
tela (estavam ao lado esquerdo da bandeja desde a rodada do `bottom-0`) e a
possibilidade de reorganizar os painéis arrastando. Ícones e bandeja passaram a
dividir um único contêiner `fixed` (`app/page.tsx`) em vez de serem dois
elementos posicionados independentemente — os ícones ficam automaticamente
colados acima da bandeja, subindo junto conforme ela cresce, sem medir nada.
Cada painel ganhou uma alcinha de grip: como só existem 2, qualquer clique ou
arrasto nela troca os dois de posição (`swapOrder` no
`WorkspacePanelsContext`), persistido em `localStorage`. Alex reportou de novo
a "Fila de follow-up" vazia — reconfirmado que não é bug (ver entrada
anterior); "Onde os cards estão" já reflete a lista "Follow-up" do Kanban
corretamente. `npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da
mudança.

### 2026-09-18 — Correção de ambiente: cache do webpack corrompendo em sessões longas

Durante os testes desta rodada, `/clientes/[id]` parou de compilar duas vezes
com `TypeError: __webpack_modules__[moduleId] is not a function`, sempre
precedido por `Caching failed for pack: Error: EPERM: operation not
permitted, rename ...\.next\cache\webpack\...pack.gz_`. A pasta do projeto
fica dentro de `Desktop`, provavelmente sincronizada pelo OneDrive — a causa
mais provável do arquivo de cache ficar bloqueado no meio da escrita. Mitigado
em `next.config.ts` desligando o cache em disco do webpack só em modo
desenvolvimento (`config.cache = false` quando `dev`); build de produção não é
afetado. Se o sintoma voltar a aparecer, a recuperação continua sendo `rm -rf
.next` + reiniciar o `next dev`.

### 2026-09-18 — Três follow-ups de teste criados pelo fluxo real, para conferência visual

A pedido do Alex, registrados três follow-ups de teste (João Nicodemos 20/09,
Carlos Mendes 15/09 — passado, para testar o destaque de atraso —, Rafael
Duarte 25/09) usando a aba "Agendar follow-up" de cada cliente, não um
`UPDATE` direto no banco, para o dado nascer com o evento de auditoria
correto. Confirmado que os três aparecem em "Fila de follow-up" ordenados por
data, com o círculo vermelho de atraso no card do Carlos Mendes. **Dado de
teste, deixado visível de propósito** para o Alex conferir; a decisão de
quando remover é dele.

Achado à parte, não corrigido: os dias exibidos no card de "Fila de
follow-up" aparecem um dia a menos do que a data registrada (provável
deslocamento de fuso horário na leitura `new Date(...).getDate()` em
`WorkspacePanels.tsx`). Não corrigido nesta rodada porque não foi pedido —
vale confirmar com o Alex antes, já que a mesma lógica pode existir em outras
telas de data.

### 2026-09-18 — Arrasto de verdade (dnd-kit), recolher suave, ícones fixos de vez

Alex rejeitou a troca instantânea por clique/arrasto simples da rodada
anterior — queria arrasto de Kanban de verdade — e reclamou que os ícones de
mostrar/ocultar sobem e desciam junto com a bandeja. Reorganizar virou arrasto
de verdade com `@dnd-kit/sortable` (mesma biblioteca já usada no Funil e em
Tarefas, mesmo `PointerSensor` com `activationConstraint: distance: 6`, que
também resolve "clico e já muda" — só ativa depois de mover de verdade).
Recolher/expandir a bandeja ganhou transição suave via CSS
(`grid-template-rows: 0fr ⇄ 1fr`, sem JS medindo altura). Os ícones de
mostrar/ocultar voltaram a ter posição `fixed` própria e independente da
bandeja — não se movem mais quando ela cresce, encolhe ou recolhe. `npx tsc
--noEmit` (0 erros) e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Ajuste fino: ícones para o lado direito de verdade, bandeja recuada

Os ícones fixos da correção anterior tinham ficado do lado esquerdo da
bandeja; Alex pediu para trocar de lado — ícones na extremidade direita de
verdade (`right-8`, a borda que a bandeja usava antes), bandeja recuada
(`right-[76px]`) para abrir espaço sem os dois se tocarem em nenhuma altura.
`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da mudança.

### 2026-09-18 — Correção de bug: "widescreen" não funcionava em monitores largos

Alex pediu para alinhar as margens esquerda/direita e o cabeçalho aos ícones
flutuantes. Ao investigar, achei que `AppShell.tsx` (usado por TODAS as
páginas) tinha um limite global `max-w-[1320px]` em volta de `{children}` que
eu nunca tinha removido depois da rodada "widescreen" de sessões atrás — o
Workspace só parecia ocupar a tela inteira porque toda verificação até agora
usou uma janela de exatamente 1320px (a largura que nunca aciona o limite);
num monitor de verdade mais largo (testado em 1600px), o limite prendia o
Workspace de volta a 1320px, cancelando o "widescreen".

Corrigido estruturalmente: o limite saiu do `AppShell` e entrou em cada página
que precisa dele (Funil, Tarefas, Agenda, Métricas, Configurações, Entrada
SDR, card do cliente) com seu próprio `<div className="mx-auto w-full
max-w-[1320px]">`, preservando a largura que já tinham. O Workspace ficou sem
nenhum limite — inclusive a agenda e o cabeçalho, que tinham um `max-w-1320`
próprio de uma rodada anterior (cobrindo só Novos Leads/Minhas Tarefas antes);
agora os controles de tema/notificações/perfil terminam na mesma borda dos
ícones flutuantes e do resto do conteúdo. `AppShell.tsx` também trocou o
padding simétrico por assimétrico a partir de `md` (`pl-5`/20px + `pr-8`/32px)
para o respiro esquerdo (rail → conteúdo) ficar perto do direito
(conteúdo → ícones), não maior como antes.

Verificado num viewport de 1600px (de propósito diferente de 1320px, para não
mascarar o bug de novo): fileira de leads, ícones flutuantes e controles da
agenda terminam todos na mesma borda (1552.8px); Funil e Tarefas continuam
com 1320px de largura, inalterados. Testado nos dois temas. `npx tsc
--noEmit` (0 erros) e `npm test` (41 testes) depois da correção.
