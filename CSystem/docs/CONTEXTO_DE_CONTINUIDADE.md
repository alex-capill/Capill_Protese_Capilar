# CSystem — contexto de continuidade

> Atualizado em 18/09/2026 (duas rodadas no mesmo dia — ver "Rodada de refino
> visual" abaixo para a mais recente). Este é o ponto de partida para outro chat,
> Claude ou agente técnico retomar o projeto. Ele descreve fatos observados nesta
> sessão; não substitui os documentos-fonte da Capill.

## Leitura obrigatória e ordem de confiança

1. `../AGENTS.md` (instruções locais, que apontam às regras raiz) e os documentos-fonte
   da Capill definem as regras de operação.
2. `README.md` descreve a aplicação e como operá-la.
3. `docs/PLANEJAMENTO.md` registra as decisões de produto e as alternativas já
   descartadas.
4. `../../DOCUMENTACAO.md` é o histórico geral **append-only**. Não reescrever entradas
   existentes.
5. Este arquivo é o retrato técnico da retomada em 18/09/2026. Atualize-o quando o
   estado mudar e registre descobertas relevantes também em `../../DOCUMENTACAO.md`.

## Estado do repositório nesta retomada

- Diretório: `CSystem/`, dentro do repositório Capill-CHIA.
- Último commit no momento deste registro: `5f41335 chore: ignorar configuracao local
  do Claude`. Os commits imediatamente anteriores são `dc69877`, `0786b8b`,
  `70fe240` e `6a80e67`.
- Há refinamentos de interface **ainda não commitados**, intencionalmente: Alex pediu
  para ver as mudanças antes de qualquer commit. Não criar commit, resetar, descartar
  ou misturar alterações sem uma nova autorização explícita.
- Arquivos fonte alterados antes deste handoff:

  ```text
  app/agenda/page.tsx                   components/funil/ClientMiniCard.tsx
  app/configuracoes/page.tsx            components/funil/FunilView.tsx
  app/entrada-sdr/page.tsx              components/metricas/FunnelChart.tsx
  app/globals.css                       components/metricas/MetricPanels.tsx
  app/layout.tsx                        components/sdr/RepassePaste.tsx
  app/metricas/page.tsx                 components/shell/AppShell.tsx
  app/page.tsx                          components/shell/PageHeader.tsx
  components/cliente/ClientDetails.tsx  components/shell/Rail.tsx
  components/cliente/ClientTimeline.tsx components/shell/ScheduleBar.tsx
  components/cliente/PaymentsPanel.tsx  components/shell/ThemeToggle.tsx
  components/config/LabelsManager.tsx   components/tarefas/TaskCard.tsx
  components/config/ListsManager.tsx    components/tarefas/TaskDialog.tsx
  components/ui/FadeScroller.tsx (novo) components/tarefas/TasksView.tsx
  components/ui/icons.tsx               components/ui/primitives.tsx
  components/workspace/LeadsRow.tsx     components/workspace/TodayTasksRow.tsx
  lib/colors.ts
  ```

  Este handoff, `AGENTS.md`, `README.md` e `docs/PLANEJAMENTO.md` também passam a
  fazer parte do conjunto a revisar antes do commit.
- O `git status` pode emitir aviso de permissão para
  `C:\Users\Alex Bezerra\.config\git\ignore`; é configuração global da máquina, não
  mudança do projeto.

## Fundamentos que não devem regredir

- Um cliente é único por telefone normalizado (Regra 1). O webhook SDR atualiza o
  existente em vez de duplicar.
- Arrastar um card cria `list_transitions`; é esse registro que alimenta métricas.
  Um comentário explica o contexto, mas não é condição para contar a métrica.
- A transição guarda um snapshot da lista. Por isso renomear ou excluir uma lista não
  pode alterar a leitura histórica de métricas já registradas.
- Excluir lista com cards exige destino e move os cards antes de excluir. Arquivar
  lista não vazia precisa continuar bloqueado.
- As palavras-chave pertencem à lista configurável e são fechadas conforme
  `lib/keywords.ts`; não criar variações livres.
- Etiquetas são cores escolhidas pelo usuário e podem ser aplicadas em clientes e
  tarefas. Não usar borda preta para indicar seleção.
- A confiança do card vem do SDR. Os pontos coloridos são apresentação da confiança
  declarada, não uma inferência de intenção, temperatura de lead ou probabilidade de
  venda.
- O banco `data/csystem.db` é ignorado pelo Git por conter dados reais. Não executar
  `npm run db:reset`, apagar ou substituir a base sem autorização explícita.

## Referência visual e decisões aplicadas

Referências fornecidas por Alex:

- Dribbble: [HubSpot CRM Sales Management Dashboard](https://dribbble.com/shots/24400756-HubSpot-CRM-Sales-Management-Dashboard), Jack R. / RonDesignLab.
- Paleta e tipo de referência: Urbanist; `#000000`, `#B9FF66`, `#D2D2D2`, `#66FFED`,
  `#FFFFFF` e `#F04949`.

O objetivo é uma interpretação consistente da referência, não uma afirmação de
correspondência pixel a pixel. As decisões atuais são:

- Fonte global Urbanist; superfícies claras brancas sobre fundo `#D2D2D2`; preto para
  ações e texto forte; verde-limão `#B9FF66` como acento; ciano `#66FFED` para
  variação positiva e vermelho `#F04949` para negativa. O tema escuro conserva o
  verde-limão e ajusta superfícies/contraste por tokens em `app/globals.css`.
- O workspace ganhou maior respiro, largura máxima de 1320px, rail a partir de telas
  médias, barra de agenda preta e os controles de tema, notificações e perfil nessa
  barra. O `C` do rail é uma aproximação com a inicial Capill: não havia arquivo de
  marca fornecido; trocar pelo logo oficial se ele for disponibilizado.
- Título, ação e métricas do cabeçalho são alinhados. No workspace os controles não
  se repetem no cabeçalho, porque ficam na barra de agenda.
- As páginas Agenda, Métricas, Configurações, Funil e Tarefas receberam os mesmos
  ajustes de espaçamento, gaps e superfícies para manter ritmo visual.
- Cartões de cliente e de tarefa têm canto superior direito recortado/arredondado e
  botão externo circular de abertura, inspirado na referência. Cliente e tarefa
  abrem com duplo clique; o botão circular continua como alternativa explícita.
- A faixa horizontal de filtros de etiquetas no Funil usa máscara CSS, com fade de
  88px apenas no lado que ainda tem conteúdo oculto. Ela deve desaparecer suavemente
  nas laterais sem um overlay visível; `ResizeObserver` recalcula início/meio/fim.
- Os níveis de confiança usam, da esquerda para a direita, vermelho frio, laranja,
  amarelo, verde-amarelado e verde-limão. A chama aparece somente na confiança alta
  (cinco pontos), no fim da graduação.
- Em cards do Funil não se mostra mais a prévia do último comentário. O histórico foi
  preservado na tela do cliente.
- A tela do cliente agora chama a primeira seção de **Eventos**. Eventos humanos de
  Alex ficam em um bloco retrátil; movimentos de lista, entrada do SDR e registros
  não humanos ficam em **Registros do sistema**, também retrátil. Isso separa texto
  humano de auditoria sem apagar entradas existentes.

### Rodada de refino visual — 18/09/2026 (auditoria contra a referência Dribbble)

Pedido do Alex: aproximar ainda mais o Workspace, Funil, Tarefas, Agenda, Métricas
e Configurações da referência (Dribbble "HubSpot CRM — Sales Management
Dashboard", Jack R./RonDesignLab), sem alterar regra de negócio, métrica, banco,
webhook, palavra-chave, lista, transição ou dado. Nenhuma dessas restrições foi
tocada. Mudanças aplicadas, todas em CSS/marcação:

- **Fade nas rolagens horizontais.** O mascaramento de borda que já existia só no
  filtro de etiquetas do Funil foi extraído para `components/ui/FadeScroller.tsx`
  (mesma lógica de `ResizeObserver`, mesmo cálculo de máscara) e passou a ser usado
  também nas fileiras "Novos Leads" e "Minhas Tarefas" do Workspace e no filtro de
  Tarefas — os cards agora recebem o mesmo corte suave na borda que a referência
  mostra em suas fileiras roláveis, em vez de cortar bruscamente.
- **Hierarquia tipográfica.** Os títulos de cartão/seção que usavam `text-lg`
  (Cadastro, Etiquetas, Situação, Pagamentos, Eventos, Registros do sistema,
  Comparecimento, Tempo médio, Motivos, Origem, Distribuição, Funil do período,
  Listas do funil, Próximos 30 dias, Fila de follow-up etc.) subiram para
  `text-xl`, e os títulos de fileira do Workspace ("Novos Leads", "Minhas
  Tarefas", via `SectionHeader`) subiram de `text-xl` para `text-2xl`. Os títulos
  de diálogo (`components/ui/Dialog.tsx`) ficaram de propósito em `text-lg`, para
  não competir com o conteúdo da página por trás. Objetivo: uma escala mais clara
  entre título da página (42–56px) → título de fileira (24px) → título de cartão
  (20px) → corpo (14px).
- **Rail.** Botões do rail (logo e ícones de navegação) de 44px para 48px
  (`size-11` → `size-12`), com um pouco mais de espaço entre eles; a coluna do
  rail cresceu de 76px para 84px para caber a folga sem apertar.
- **Barra de agenda.** Preenchimento interno de `p-1.5` para `p-2` e altura da
  trilha de compromissos de `h-10` para `h-11`, para ficar mais próxima da barra
  preta "encorpada" da referência; os blocos de compromisso foram recentralizados
  nessa trilha mais alta.

**O que este refino NÃO fez:** não mudou nenhuma regra de negócio, cálculo de
métrica, schema de banco, payload de webhook, palavra-chave, nome ou
comportamento de lista, nem os deltas de exemplo de Fechadas/Perdidas (que
continuam exemplo visual documentado, não dado real). Também não tocou
`data/csystem.db`, não rodou `db:reset` nem mexeu no n8n.

**Como foi validado — e o limite disso.** Esta sessão rodou num ambiente de nuvem
sem acesso a um terminal na máquina do Alex: os arquivos foram lidos e escritos
pela ponte de arquivos, mas `npm run dev`, `npm run build` e a inspeção visual no
navegador local **não puderam ser exercitados nesta rodada**. A validação foi:

- Cópia integral do código-fonte relevante para um ambiente Node separado, nesta
  sessão de nuvem.
- `npm install --ignore-scripts` (o binário nativo do `better-sqlite3` não pôde
  ser compilado ali por falta de acesso à rede de download de headers do Node;
  isso não afeta `tsc` nem os testes, que não tocam o banco).
- `npx tsc --noEmit`: **0 erros**.
- `npx vitest run`: **3 arquivos, 38 testes, todos passando** — os mesmos three
  arquivos e contagem de antes desta rodada (`lib/keywords.test.ts`,
  `lib/phone.test.ts`, `lib/sdr-parser.test.ts`); nenhum teste novo foi necessário
  porque a mudança é só visual.
- Revisão manual de cada arquivo alterado, comparando com screenshots da
  referência do Dribbble (capturados nesta sessão).

Isto confirma que o código compila e os testes de domínio continuam passando —
**não confirma a aparência real na tela**, porque a alteração não foi vista
rodando. Antes de aprovar ou commitar, o ideal é o Alex rodar
`npm run dev` localmente (com o dev server parado antes de qualquer `build`,
como já registrado abaixo) e olhar as seis telas.

### Rótulo de temperatura no card — decisão do Alex, 18/09/2026

O card do funil passa a rotular os cinco pontos com **Frio / Morno / Quente** em
vez de "Confiança alta/moderada/baixa", em caixa normal (sem maiúsculas). O
mapeamento é direto e não introduz cálculo:

| `sdr_confidence` (do bloco `===REPASSE===`) | Pontos | Rótulo exibido |
|---|---|---|
| `BAIXA` | 1 | Frio |
| `MODERADA` | 3 | Morno |
| `ALTA` | 5 | Quente |

**O dado não mudou — só o rótulo.** O valor continua sendo a confiança que o SDR
declarou no repasse. O sistema **não** calcula temperatura, não infere intenção,
não pontua probabilidade de venda e não cria campo novo: nenhuma coluna foi
adicionada e nenhuma métrica lê esse rótulo.

Isto ressalva, sem revogar, duas passagens existentes:

- `AGENTS.md`: "Não inferir motivo de perda, interesse, preço ou decisão
  comercial. A confiança exibida no card é a que o SDR declarou; não é um score
  calculado." — continua valendo na íntegra. A frase descreve a origem do dado,
  e a origem segue sendo o SDR.
- `docs/PLANEJAMENTO.md` §4, ajuste 4 do Teste do Engenheiro: "Sem campo novo sem
  uso comprovado — nada de score ou temperatura de lead." — continua valendo
  quanto a **campo** e a **cálculo**. O que mudou é vocabulário de interface, não
  modelo de dados.

**Risco assumido, declarado:** "quente" soa como leitura do sistema sobre o
cliente, enquanto "confiança alta" atribuía a leitura ao SDR. Se alguém passar a
tratar o rótulo como previsão de fechamento, a ressalva acima é a resposta — e o
`title`/`aria-label` do grupo de pontos deve continuar dizendo de onde o valor
vem ("Nível de confiança declarado pelo SDR: ALTA").

Alteração restrita a `components/funil/ClientMiniCard.tsx` (texto e estilo do
rótulo). Sem efeito em `lib/keywords.ts`, `lib/metrics.ts`, schema ou webhook.

## Métricas do workspace: dado real versus demonstração visual

`components/ui/primitives.tsx` renderiza variações reais como pequenos badges:

- delta positivo: verde-limão, seta e número pretos;
- delta negativo: vermelho, seta e número pretos;
- o número principal da métrica permanece preto.

Para Alex comparar a composição em todas as métricas, `app/page.tsx` passa
`previewDelta` apenas para **Fechadas** (`+1`) e **Perdidas** (`-1`) quando não há
delta real. Esses dois badges têm `title` e `aria-label` dizendo que são exemplo
visual, e **não representam dado de negócio**. Remover esses exemplos ou substituí-los
por cálculo real assim que Alex aprovar a aparência. Nunca deixar uma demonstração ser
interpretada como métrica operacional.

## Correções funcionais feitas nesta rodada

1. **Alternador claro/escuro.** Havia um caso em que o primeiro clique não mudava o
   tema porque o estado React podia iniciar diferente do atributo aplicado antes da
   hidratação. `ThemeToggle` agora lê `document.documentElement[data-theme]` no clique,
   aplica o próximo tema e persiste em `csystem-theme`. A alternância foi conferida
   após reiniciar o dev server.
2. **Abertura por duplo clique.** `ClientMiniCard` navega ao cliente e `TaskCard` abre
   a edição por duplo clique. A interação foi compatibilizada com os controles de
   arrastar e com botões/links internos para evitar disparos acidentais.
3. **Seleção de etiquetas.** A seleção deixou de usar delineado preto e passou a usar
   brilho/sombra na cor, nos fluxos de cliente e tarefa.
4. **Linha do tempo.** Comentários/eventos e registros de sistema foram divididos e
   ambos podem ser recolhidos. Transições preservam origem/destino; registros SDR são
   identificados como tal.

## Validação feita e limites da evidência

Fatos verificados manualmente nesta máquina nesta sessão:

- CRUD de listas: criação com cor hex, palavra-chave e etapa de métrica; movimento de
  card; sugestão de palavra; soma em Métricas; renomeação sem quebrar histórico;
  exclusão com destino e preservação por snapshot; e bloqueio para arquivar lista com
  cards.
- CRUD de etiquetas: criação com hex livre, aplicação em cliente e tarefa, e leitura
  nos temas claro e escuro.
- Duplo clique de cliente e de tarefa, abertura de Nova Tarefa, alternador de tema e
  a separação visual de Eventos/Registros foram exercitados no navegador local. O
  bloco **Eventos** foi aberto e recolhido; o bloco de registros recebeu a mesma
  estrutura retrátil e passou em TypeScript/testes.
- `npx tsc --noEmit` passou após a última alteração de código.
- `npm test` passou com **3 arquivos e 38 testes**. A última alteração posterior foi
  apenas textual no título “Eventos”; o typecheck passou depois dela.
- Um `npm run build` havia passado antes dos refinamentos finais de interface. Não
  repetir o build enquanto o dev server estiver ativo, pela ressalva abaixo.

Limite honesto: inspeção visual em navegador confirma comportamento e composição
geral, mas não constitui prova de correspondência pixel a pixel com a imagem do
Dribbble. O painel de chamada/vídeo da referência não foi reproduzido porque não há
integração de chamada selecionada no produto.

## Ambiente local e comandos seguros

- No momento deste handoff, o dev server CSystem foi reiniciado e atendia em
  `http://localhost:3000/`. A URL pública configurada localmente pressupõe essa porta.
  Pode haver um processo antigo em 3001; não alterá-lo sem confirmar que pertence a
  este projeto.
- O `npm` não estava no PATH usado pela automação. Nesta máquina, os comandos que
  funcionaram foram:

  ```powershell
  & 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit
  & 'C:\Program Files\nodejs\npm.cmd' test
  & 'C:\Program Files\nodejs\npm.cmd' run dev
  ```

- Rodar `next build` enquanto `next dev` usa a mesma pasta `.next` pode deixar o
  dev server com erro de módulo de `vendor-chunks` e sem hidratação. Isso ocorreu
  nesta sessão e foi resolvido encerrando os processos CSystem e iniciando um dev
  server limpo na porta 3000. Pare o dev server antes de `npm run build`; depois,
  suba-o novamente.
- Em ambiente com sandbox, o Vitest/esbuild pode não conseguir ler
  `vitest.config.ts`; executar os testes com a permissão normal/escalada apropriada,
  sem modificar a configuração de testes para contornar o sandbox.

## Dados de teste e efeitos locais

- A validação criou dados de teste durante o CRUD. Os itens criados exclusivamente
  para a rodada “Card E2E Métrica” e “Etiqueta E2E” foram removidos ao final.
- Não apagar clientes, listas, eventos ou banco existentes para “limpar” a tela: o
  conteúdo restante pode ser dado do Alex ou de outra sessão. Em especial, entradas
  como `Cliente Teste CRUD` não devem ser presumidas descartáveis.

## Pendências reais para decisão futura

- Remover ou converter em cálculo real os badges de exemplo de Fechadas/Perdidas
  quando Alex aprovar a composição.
- Substituir o `C` de texto do rail por logotipo/asset oficial quando disponibilizado.
- Itens funcionais já conhecidos em `docs/PLANEJAMENTO.md`: percorrer três clientes
  por todo o funil, reordenar listas, tentar telefone duplicado pela interface e
  arrastar pelo teclado.
- Pendências operacionais que só Alex pode decidir continuam no Planejamento:
  diferença semântica entre AGUARDANDO CONTRATO e FAZER PEDIDO DO SISTEMA; critério
  para etiquetas de Situação Especial; autorização para alterar n8n; migração/arquivo
  do Trello; destino dos cards ainda ativos no Trello.
- Não há autorização para alterar o n8n nem para criar regras comerciais, descontos,
  preços ou condições por conta própria.

## Preparação para o próximo commit

Proposta de escopo, ainda **não executada**: refinamento visual do workspace e das
demais telas, interações de card, tema, etiquetas, timeline, a rodada de fade/
hierarquia/rail/barra de agenda descrita acima, e a documentação deste handoff.
Sugestão de mensagem: `feat(csystem): refina workspace, cards, histórico de eventos e auditoria visual`.

Antes de commitar, mostrar ao Alex o `git diff --stat` e o diff dos arquivos alterados,
confirmar que `data/csystem.db` não entrou no staging, rodar `npm run dev` localmente
para conferir visualmente as seis telas (a rodada de fade/hierarquia/rail/barra de
agenda só foi validada por `tsc`/`vitest` e revisão de código, não visualmente — ver
seção acima), e informar os comandos de validação. O commit continua dependendo da
autorização explícita dele.

## V1.01 — aplicação da auditoria visual escolhida

Em 18/09/2026, Alex autorizou a aplicação dos mockups da auditoria visual:
Workspace **1C**, Funil **2A**, Tarefas **2B**, Agenda **3A**, Métricas **3B** e
Configurações **3C**. O ajuste foi restrito à apresentação e à composição das telas.

O Workspace passou a usar grade assimétrica com lateral de distribuição e fila de
follow-up; busca e filtros ficam antes das fileiras de cards; cards de cliente e
tarefa usam a medida visual de 288px; métricas alinham número, rótulo e delta na
mesma linha; os controles de tema, notificações e perfil ficam agrupados em uma
cápsula; Agenda, Métricas e Configurações receberam os espaçamentos, títulos e
superfícies dos mockups. O contraste de etiquetas claras foi corrigido usando texto
escurecido quando necessário. Nenhuma regra de negócio, métrica, banco, webhook,
lista, palavra-chave ou transição foi alterada.

Validação realizada: `npx tsc --noEmit` sem erros; `npm test -- --run` com 3 arquivos
e 38 testes passando; inspeção visual do Workspace em `localhost:3002`. O build não
foi executado porque havia um `next dev` ativo na porta 3000 e a regra local exige
parar o servidor antes de disputar `.next`.

## Temperatura manual — decisão posterior do Alex

Alex pediu que a temperatura apareça no rodapé do card, junto dos pontos e do valor,
e que possa ser classificada conforme a interação com o lead. Foi adicionada a coluna
nullable `clients.temperature`, com seleção rápida no card e seleção no diálogo de
edição: `Frio`, `Morno`, `Quente` ou `Classificar`.

No ingresso do SDR, o `NÍVEL DE CONFIANÇA` declarado no repasse preenche a temperatura
inicial em mapeamento direto: `ALTA` → `Quente`, `MODERADA` → `Morno`, `BAIXA` →
`Frio`. Se o Alex já tiver definido uma temperatura, um repasse posterior preserva a
classificação manual. A temperatura não é inferida de mensagens, tempo ou estágio e
não participa das métricas; `sdr_confidence` continua preservado como dado original.

## V1.01 — segunda rodada de acabamento visual

Em 18/09/2026, foram aplicados o fade lateral do Workspace aos quadros horizontais do
Funil, Tarefas e tabela de listas. A lateral interna agora mantém o mesmo respiro dos
dois lados por meio de padding simétrico do shell.

No detalhe do cliente, Cadastro recebeu maior hierarquia, espaçamento entre campos e
um chip de temperatura. Para cards legados cuja coluna `temperature` ainda está vazia,
a tela mostra a conversão direta do `sdr_confidence` com o marcador `SDR`; isso torna
visível o mesmo dado já declarado pelo SDR sem criar pontuação ou alterar registros.
Novos repasses continuam gravando a temperatura na coluna própria.

O diálogo Editar cliente trocou os selects nativos de Temperatura e Modalidade por
escolhas arredondadas com cores de estado. Campos e escolhas agora preservam o raio
do próprio controle quando recebem foco.

### Ajuste posterior: temperatura por clique e modalidade por etiqueta

Alex definiu que Modalidade da Avaliação é controlada exclusivamente pelas etiquetas,
portanto foi removida do diálogo Editar cliente. A temperatura passou a usar o mesmo
controle de pontos no card e na edição: cada clique percorre `Classificar → Frio →
Morno → Quente → Classificar`. No card, a mudança é salva imediatamente; no diálogo,
ela é incluída ao salvar as demais edições.

### Ajuste posterior: tarefas sem etiquetas

Alex definiu que tarefas não usam etiquetas. A interface de criação, edição, cartões,
lista, queries e props de tarefas foi simplificada para não exibir ou atribuir
etiquetas. As tabelas históricas de `task_labels` não foram apagadas, preservando dados
operacionais já existentes sem expô-los na interface. A prioridade passou a ser um
controle arredondado de três opções, mantido em estado local até o botão Salvar.

No diálogo Editar cliente, o mesmo controle de temperatura recebeu pontos levemente
maiores apenas na edição; ele continua local até Salvar.

### Correção de escopo: etiquetas de Situação especial nas tarefas

Alex corrigiu a decisão: tarefas dispensam as demais etiquetas, mas mantêm somente
`Prioridade`, `Retorno Necessário` e `Problema`, do grupo `SITUACAO_ESPECIAL`. Essas
três voltaram à criação, edição, cartão e lista de tarefas. A action valida o grupo no
servidor e só persiste a seleção ao clicar em Salvar; etiquetas de Origem, Modalidade
e Pagamento continuam indisponíveis para tarefas.

### Ajuste visual: rodapé dos cards de tarefa

O rodapé do card de tarefa foi separado em duas linhas. Prazo e nível de prioridade
ficam juntos na primeira, com cores próprias (`atrasada` em vermelho, `hoje` em preto,
prioridade alta em vermelho suave e média em amarelo suave). O cliente relacionado
fica em uma faixa inteira na linha abaixo, eliminando a quebra irregular dos chips.

### Ajuste visual: cor do cartão pelo prazo

Alex definiu o cartão de tarefa como sinal visual de tempo. Toda tarefa ativa começa
verde-claro; quando restam até 60 minutos, fica laranja-claro; ao entrar em atraso,
fica vermelho-claro. As três cores são literais e permanecem iguais no modo escuro.
O rótulo de prazo acompanha o estado, e tarefas a menos de uma hora entram no filtro
de Hoje.

### Ajuste visual: colunas de tarefa e títulos H1

Alex pediu a remoção da faixa cinza atrás dos cartões de tarefa, pois ela não consta
no mockup definido. As colunas agora mostram somente cabeçalho, cartões e ação de nova
tarefa, sem painel de fundo. Os títulos H1 fornecidos por `PageHeader` foram reduzidos
em aproximadamente 20% (48/62px para 38/50px), afetando Workspace, Funil e as demais
páginas que usam o mesmo componente.

### Correção visual: faixa de tarefa e fundo do quadro

A "faixa" da coluna de tarefas foi restaurada: ela volta a reunir o título do dia, a
quantidade de tarefas e a ação de criar uma nova tarefa. A remoção solicitada refere-se
somente ao fundo cinza amplo atrás das colunas; essa área agora usa a superfície branca
neutra, preservando o contraste dos cartões coloridos.

### Correção visual: faixa da coluna

A faixa interna da coluna de tarefas foi devolvida ao visual anterior, sem painel cinza
ou preenchimento próprio. Mantém-se apenas a superfície neutra do quadro ao redor das
colunas, que é o fundo atrás dos cartões solicitado para remoção.

### Correção visual final: Kanban de tarefas

A referência visual do Kanban foi confirmada pelo anexo: o fundo geral permanece cinza,
e cada coluna é um painel cinza-claro arredondado com cabeçalho, contador e ação Nova
tarefa. Os cartões permanecem o ponto de destaque dentro desses painéis.

### Ajuste visual: altura da agenda no Workspace

A barra de agenda do topo foi reduzida para 40px de altura, igual aos ícones da rail
lateral. Seus blocos internos, compromissos, atalho de agenda e o conjunto de tema,
notificações e perfil acompanham a mesma medida, sem alterar a largura da agenda.

### Refinamento: agenda ainda mais compacta

Após revisão visual, a agenda superior passou de 40px para 36px. O controle de tema
recebeu uma variante compacta própria (28px com ícone de 15px), evitando que o sol
ultrapasse sua cápsula; notificações, avatar e atalho da agenda acompanham a escala.

### Ajuste pela referência: alinhamento da agenda

A barra de agenda e o conjunto de controles foram ajustados para 44px, alinhados no
eixo central da mesma linha do logotipo. A escala interna foi redistribuída para manter
ícones, avatar, atalho e compromissos inteiramente contidos nas cápsulas.

### Ajuste: temperatura no cadastro do cliente

Na página de cadastro do cliente, o selo textual de temperatura foi substituído pela
mesma escala de bolinhas usada no card do funil. O clique alterna a classificação e a
salva imediatamente; a indicação SDR continua visível quando a classificação ainda vem
da confiança original do SDR.

### Correção: temperatura ao lado do nome do lead

A escala de temperatura foi removida do painel Cadastro e colocada imediatamente após o
título grande com o nome do lead, no topo da página de cliente. Ela preserva o mesmo
comportamento do card do funil: cada clique alterna e grava a temperatura na hora.
