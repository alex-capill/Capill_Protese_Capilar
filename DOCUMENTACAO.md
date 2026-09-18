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
