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

### Verificação visual no navegador — 18/09/2026 (pendência da rodada de refino fechada)

As sessões anteriores desta rodada de refino (fade, hierarquia tipográfica, rail,
barra de agenda) tinham sido validadas só por `tsc`/`vitest`/leitura de código,
porque rodaram sem acesso a terminal e navegador locais. Esta sessão teve os dois,
então a pendência foi fechada de verdade.

**Estado do Git no início desta sessão:** as mudanças descritas no handoff
(`CSystem/Claude outputs/HANDOFF_refino_visual_csystem.md` e o patch anexo) já
estavam commitadas em `67e16ab` e `6203c33` — a árvore de trabalho estava limpa
(`git status` sem alterações em `CSystem/`, só a pasta `Claude outputs/` nova e
não rastreada). Conferido com `git apply --check` mental (diff linha a linha):
o conteúdo do patch bate com o que já está em disco. Nada precisou ser reaplicado.

**Como foi verificado:**

- Servidor local: criado `CSystem/.claude/launch.json` (ignorado pelo Git,
  `.gitignore:2` cobre `.claude/`) apontando `npm run dev` para a porta 3000, que
  estava livre nesta máquina (3002 e 3003 tinham processos de outras ferramentas
  não relacionados ao CSystem — não foram tocados).
- Percorridas as seis telas (Workspace, Funil, Tarefas, Agenda, Métricas,
  Configurações) nos temas escuro e claro, em duas larguras (1280×800 e a
  largura padrão do painel), comparando com a referência do Dribbble.
- Duplo clique abrindo cliente e tarefa: confirmado (`window.location.pathname`
  mudou para `/clientes/<id>` depois do duplo clique num card do Workspace).
- Alternador de tema: primeiro clique já troca claro ⇄ escuro, sem precisar de
  um segundo clique.
- Separação Eventos / Registros do sistema, ambos retráteis, e etiquetas sem
  contorno preto: confirmado na tela do cliente.
- Console do navegador sem erros durante toda a navegação.

**Sobre o rail (84px) e o fade de 48px nas chips — as duas dúvidas que o handoff
tinha deixado em aberto:**

- Rail: o botão tem 48px (`size-12`), a coluna tem `px-3` (12px de padding de
  cada lado) dentro de uma largura total de 84px. Isso deixa 6px de folga de
  cada lado do botão além do padding — visualmente discreto, não "folgado
  demais". Nenhuma mudança foi feita.
- Fade de 48px: a máscara CSS desvanece o próprio conteúdo perto da borda (não
  é uma faixa sólida por cima) e o efeito é gradual, não um corte abrupto. Os
  chips mais longos já visíveis nas fileiras que usam `fadeWidth=48` ("Avaliação
  marcada" no Workspace, "Avaliação agendada" no Funil) apareceram inteiros,
  sem texto suprimido — o que se vê no chip parcialmente sob a máscara, próximo
  da borda com mais conteúdo, é o mesmo comportamento pretendido de indicar que
  há mais itens fora da área visível. Nenhuma mudança foi feita.

**Limite desta verificação:** a inspeção foi feita com dados de seed/teste (os
mesmos citados nas rodadas anteriores: `João Nicodemos`, `Carlos Mendes`,
`Rafael Duarte`, `Marcos Vinicius`, `Cliente Teste CRUD`), não com o volume real
de produção — filas com muito mais cards ou etiquetas com nomes ainda mais
longos que os do seed não foram exercitadas.

**Validação:** `npx tsc --noEmit` — 0 erros. `npm test` — 4 arquivos, 41 testes
(cresceu de 38 para 41 desde a última rodada, por causa de
`lib/temperature.test.ts`, adicionado na decisão de temperatura manual).
`npm run build` não foi executado nesta rodada porque não havia necessidade de
recompilar para produção; o dev server foi parado ao final da verificação.

Nenhuma mudança de código de produto foi necessária nesta rodada — a única
alteração em disco é `CSystem/.claude/launch.json` (fora do Git), criado para
abrir o preview local.

### Dois bugs reais encontrados pelo Alex após esta verificação — 18/09/2026

A verificação acima usou poucos dados de seed (3 leads, 2 tarefas) e a largura padrão
do painel do Claude, o que não expôs overflow suficiente em todos os pontos. Alex
testou pessoalmente com a janela mais larga e achou dois bugs reais:

**1. Mancha cinza atrás dos cards de "Minhas Tarefas" no Workspace.**

Causa: o brilho radial do `body` (`app/globals.css`) tinha a altura em `%`, relativa à
altura TOTAL da página (que cresce com o conteúdo), não à altura da tela. Na página do
Workspace (1532px de altura total nesta sessão), o brilho se apagava por volta de
414px do topo — bem onde caem os cards de tarefa — criando uma borda visível entre o
brilho e o fundo chapado.

Correção: a altura do gradiente virou um valor fixo em `px` (`1000px`, fade completo
por volta de 300px do topo), independente do tamanho da página. Conferido nos temas
claro e escuro; sem regressão no brilho atrás do cabeçalho nas outras telas.

**2. Fade lateral das fileiras de card imperceptível — pedido do Alex para igualar ao
efeito do topo.**

Depois da correção acima, Alex pediu que a rolagem horizontal (Novos Leads, Minhas
Tarefas, colunas do Funil e Tarefas, tabela de Listas) tivesse o mesmo tipo de fade
visível que o brilho do topo. Ao investigar, o `FadeScroller`
(`components/ui/FadeScroller.tsx`) já tinha a lógica de detectar bordas com conteúdo
oculto (`ResizeObserver`, `hasLeft`/`hasRight`), mas usava `mask-image` — uma técnica
que apaga a opacidade do próprio conteúdo. Isso funciona bem em conteúdo escuro ou
saturado (chips de filtro, como confirmado na rodada anterior), mas em cards CLAROS
sobre fundo cinza-claro quase da mesma cor, o efeito era real (confirmado via
`getComputedStyle` no navegador) mas visualmente imperceptível — parecia um corte reto.

Correção: `FadeScroller` foi reescrito para usar uma camada de degradê sobreposta
(`linear-gradient`, opaco → transparente) na cor real do fundo por trás da fileira, em
vez de mascarar o conteúdo. Novo prop `fadeColor` (default `var(--bg)`, o fundo da
página) permite indicar a cor certa quando a fileira não está sobre o fundo da página
— usado em `components/config/ListsManager.tsx` (`fadeColor="var(--surface)"`, porque
aquela tabela vive dentro de um cartão branco, não do fundo cinza da página).

Estrutura do componente: um wrapper `relative` recebeu a margem/padding negativos que
antes estavam no próprio elemento com scroll (para manter o alinhamento visual com o
resto da seção), e duas camadas absolutas (`aria-hidden`, `pointer-events-none`) nas
bordas esquerda/direita, com opacidade 0/1 conforme `hasLeft`/`hasRight`, cada uma um
`linear-gradient` da `fadeColor` para transparente.

Conferido nos temas claro e escuro, forçando overflow horizontal em: Novos Leads e
Minhas Tarefas no Workspace (`getComputedStyle` confirmou `scrollWidth > clientWidth`
e opacidade correta da camada de fade), colunas do Kanban no Funil (fade visível a
olho nu, mais evidente que antes por causa dos rótulos de coluna mais escuros) e a
tabela de Listas em Configurações (fade na cor do cartão branco).

Nenhuma regra de negócio, banco ou webhook foi tocado. `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois das duas correções.

### Fundo do body: de brilho radial para chapado, a pedido do Alex — 18/09/2026

Alex mandou o mockup "1c — Workspace" (uma das referências já aprovadas na rodada de
auditoria visual anterior) e pediu o fundo exatamente igual a ele, depois das duas
correções acima. Em vez de comparar a olho, o PNG foi amostrado pixel a pixel: copiado
temporariamente para `CSystem/public/` (removido depois — nunca ficou no Git, e a
pasta `public/` também foi apagada por não existir antes), servido pelo próprio
`next dev`, e lido com `canvas.getImageData` numa aba do navegador.

Resultado da amostragem: o fundo do mockup é a cor sólida `#d2d2d2` — o mesmo valor
que já era `--bg` no código. Não há um brilho/vinheta de propósito atrás do
cabeçalho; a pequena variação de tom encontrada bem perto do topo em alguns pontos é
consistente com sombra dos próprios elementos escuros da barra de agenda (a barra
preta, o texto), não um gradiente de página.

Diagnóstico: o brilho radial do `body`, mesmo já corrigido para altura fixa em `px`
(ver seção acima), continuava sendo uma fonte de risco — qualquer altura escolhida
pode voltar a aparecer como uma borda visível em outra combinação de tela e
conteúdo que não foi testada. Como a referência aprovada não tem brilho nenhum, a
solução mais robusta era remover o efeito por completo, não ajustar o número de
pixels de novo.

`app/globals.css`: `body` ficou só com `background-color: var(--bg)`, sem
`background-image`. Conferido nos temas claro e escuro via `getComputedStyle`
(`backgroundImage` retornando `"none"` nos dois). `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da remoção.

### Alinhamento da coluna lateral do Workspace com "Novos Leads" — 18/09/2026

Alex pediu para descer um pouco os dois painéis da coluna direita do Workspace
("Onde os cards estão" e "Fila de follow-up") para alinhar com o subtítulo "Novos
Leads" à esquerda. Medi via `getBoundingClientRect` antes de mexer: o topo do
cartão branco já coincidia matematicamente com o topo da CAIXA do `<h2>` (ambos em
y=186), mas não com o topo VISUAL das letras — o `<h2>` usa `line-height: 42px`
para um `font-size: 28px`, então sobra espaço (leading) acima do traço da letra em
si. Calculei esse espaço com `canvas.measureText` (fonte Urbanist, 500 28px):
`fontBoundingBoxAscent` 25 + `actualBoundingBoxAscent` 20 apontam a tinta da letra
começando ~12px abaixo do topo da caixa do `<h2>`.

Correção: `app/page.tsx`, `WorkspaceAside` — troquei `className="hidden flex-col
gap-4 xl:flex"` por `className="hidden flex-col gap-4 pt-3 xl:flex"` (12px). Depois
do ajuste, o topo do cartão "Onde os cards estão" ficou exatamente em y=198, igual à
estimativa do topo visual das letras de "Novos Leads". Conferido nos temas claro e
escuro (com `body.style.zoom` temporário só para inspecionar visualmente de perto,
desfeito depois). `npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois do
ajuste.

### "Onde os cards estão" e "Fila de follow-up" viraram janelas soltas — 18/09/2026

Pedido seguinte do Alex, em três partes (confirmadas por `AskUserQuestion` antes de
mexer, porque a frase original misturava vários pedidos):

1. As duas janelas devem poder ser arrastadas pela tela e fechadas.
2. A janela branca ("Onde os cards estão") deve alinhar com a **fileira de filtros**
   dos leads (não mais com o título "Novos Leads" — supera o ajuste da seção
   anterior), e "Fila de follow-up" continua logo abaixo dela.
3. Do lado direito, no mesmo padrão visual da fileira de filtros à esquerda (os
   chips "Todos/Qualificados/..."), tem que ter botões para mostrar/ocultar cada
   painel.

**Arquivos novos:**

- `components/ui/DraggableWindow.tsx` — wrapper genérico e reutilizável: antes do
  primeiro arrasto ocupa o próprio lugar no layout (`position: relative`, sem
  medição nem flash); no primeiro `pointerdown` na alça (ícone de grip), lê a
  posição atual via `getBoundingClientRect`, vira `position: fixed` nessa mesma
  posição (sem pulo visual) e passa a seguir o cursor via `pointermove`. Fechar é
  responsabilidade de quem usa o componente (prop `onClose`) — o wrapper só cuida
  de arrastar. Posição por painel em `localStorage`
  (`csystem-window-pos:<id>`), envolta em `try/catch` (pode falhar em aba anônima
  ou storage bloqueado; sem posição salva, o painel só nasce no lugar de sempre).
- `components/workspace/WorkspaceAside.tsx` — extraído de dentro de `app/page.tsx`
  (precisava virar Client Component para ter estado de aberto/fechado). Renderiza
  os dois chips de alternância (mesmas classes `chip`/`chip-on`/`chip-off` da
  fileira de filtros — pedido 3) sempre visíveis, e cada painel dentro de um
  `DraggableWindow` só quando está aberto. Estado de aberto/fechado por painel
  também em `localStorage` (`csystem-window-open`), começando com os dois
  abertos (era o único comportamento antes) até o efeito ler a preferência salva.

**Alinhamento (pedido 2):** medi a fileira de filtros (`input` "Buscar leads" +
chips) via `getBoundingClientRect`: topo em y=245.2, contra y=186 do `<aside>` sem
padding. `WorkspaceAside` ganhou `pt-[59px]` (substituindo o `pt-3` da seção
anterior) — o topo da fileira de chips de alternância bateu em y=245, igual à
fileira de filtros à esquerda.

**`app/page.tsx`** ficou só com a chamada `<WorkspaceAside clients={clients}
lists={lists} followups={followups} />`; a função que antes desenhava os dois
painéis inline foi removida de lá (mudou de arquivo, não de comportamento visual
por padrão — o layout inicial, sem nenhum arrasto, é visualmente idêntico ao de
antes, só a fileira de chips nova no topo).

**Verificado nesta sessão** (via `dispatchEvent` de `PointerEvent` — mais confiável
que coordenada de mouse no viewport emulado desta sessão, que às vezes escala):
fechar por chip funciona (o painel some, o chip vira `chip-off`); reabrir pelo
mesmo chip funciona; arrastar pela alça muda a posição pelo delta exato do
movimento e grava em `localStorage`; a posição sobrevive a um F5 (`navigate` de
novo, painel reaparece no mesmo lugar); fechar funciona também com o painel já
flutuando (`position: fixed`). Testado nos dois temas. `localStorage` de teste
limpo ao final, para o Alex ver os painéis nascendo no lugar padrão na primeira
vez que abrir.

`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da mudança. Nenhuma
regra de negócio, banco ou webhook tocado — é só uma preferência de tela, por
navegador, guardada em `localStorage`, nunca sincronizada nem gravada no banco.

### Correção de rumo: sem arrastar, botões viraram ícones no rail — 18/09/2026

Alex testou o resultado da seção anterior e voltou atrás: "não ficou bom, ele
[móvel] não" — pediu para desfazer o arrasto e voltar exatamente ao estado
anterior. Removidos `components/ui/DraggableWindow.tsx` e
`components/workspace/WorkspaceAside.tsx` (o arquivo extraído na tentativa
anterior); `app/page.tsx` voltou a ter a função `WorkspaceAside` inline, do jeito
que estava antes de qualquer coisa deste round (só com o `pt-3` de alinhamento com
"Novos Leads", sem chips, sem arrastar).

Pedido revisado, confirmado sem mais popups depois de uma pergunta com
`AskUserQuestion` (o Alex pediu explicitamente **no máximo dois popups de
pergunta por vez**, registrado abaixo para valer também no recurso de janela
personalizada):

1. Os botões de mostrar/ocultar viram **ícones redondos pequenos, sem texto**, no
   rodapé do rail (menu vertical de navegação) — não mais chips com rótulo no
   Workspace.
2. Só aparecem **na tela Workspace** (confirmado via `AskUserQuestion`) — nas
   outras telas o rail continua igual a antes.
3. O botão "+" de criar janela personalizada e o auto-ajuste ficam para depois
   (ver pendência abaixo); o Alex já adiantou que quer no máximo **duas janelas
   abertas ao mesmo tempo** — para abrir uma terceira, precisa fechar uma antes.
   Essa regra ainda não está implementada (não há terceira janela ainda), só
   registrada para quando o botão "+" for construído.

**Arquitetura:** o rail (`components/shell/Rail.tsx`) e a página do Workspace
(`app/page.tsx`) são irmãos no layout — os dois filhos de `AppShell`. Um clique no
ícone do rail precisa mostrar/ocultar um painel que vive em outro branch da árvore,
então o estado não pode ser local a nenhum dos dois. Solução: um contexto React
compartilhado.

- `components/workspace/WorkspacePanelsContext.tsx` (novo) — `WorkspacePanelsProvider`
  guarda `{ "onde-os-cards": boolean, "fila-follow-up": boolean }`, persistido em
  `localStorage` (`csystem-workspace-panels`), começando com os dois abertos até o
  efeito ler a preferência salva. Exporta também `useWorkspacePanels()` e a lista
  `WORKSPACE_PANELS` (id + rótulo, usada tanto pelo rail quanto pela página).
- `components/shell/AppShell.tsx` — o provider agora envolve `<Rail />` e o
  `<main>`, o nível mais alto que os dois compartilham.
- `components/shell/Rail.tsx` — quando `pathname === "/"`, renderiza (com
  `mt-auto`, empurrando pro final da coluna) dois botões circulares de 48px, no
  mesmo padrão visual dos itens de navegação existentes (`IconChart` para "Onde os
  cards estão", `IconClock` para "Fila de follow-up"; preenchido/preto quando
  aberto, como o item de navegação ativo). Cada um chama `toggle(id)` do contexto.
- `components/workspace/PanelSlot.tsx` (novo) — envelope client mínimo:
  `<PanelSlot id="...">{children}</PanelSlot>` só renderiza `children` (já montado
  no servidor) se o painel estiver marcado como aberto. Existe para `app/page.tsx`
  continuar Server Component — só este envelope precisa ser client. Cada uma das
  duas seções da `WorkspaceAside` (o cartão branco e o cartão preto) ficou
  envolvida por um `PanelSlot`.

**Verificado:** ícones aparecem só no Workspace (confirmado que em `/funil` o rail
tem zero botões extras); clicar oculta o painel correspondente sem deixar vão (é
renderização condicional normal, não posição fixa); clicar de novo mostra; estado
inicial dos dois é aberto; testado nos dois temas. `npx tsc --noEmit` (0 erros) e
`npm test` (41 testes) depois da mudança.

### Ajuste de posição e tamanho: do rail para o canto inferior direito da tela — 18/09/2026

Alex viu os dois ícones no rodapé do rail (canto inferior **esquerdo** da tela,
porque o rail fica à esquerda) e pediu para ficarem no canto inferior **direito**
da tela — soltos, não mais dentro do rail — só ícone (sem texto, como já estavam),
e pelo menos 30% menores.

- Removida a seção de ícones de `components/shell/Rail.tsx` (o rail voltou a ser
  só navegação, sem saber nada do Workspace).
- Novo `components/workspace/WorkspacePanelToggles.tsx`: `fixed bottom-5 right-5`,
  dois botões `size-8` (32px — 33% menor que os 48px do rail, satisfaz "pelo menos
  30%"), ícone reduzido de 19px para 13px na mesma proporção. Estado aberto usa o
  mesmo padrão visual do item de navegação ativo (`bg-ink`/`shadow-raised`);
  estado fechado usa `bg-surface`/`shadow-chip` (em vez de fundo transparente como
  no rail) porque aqui o botão flutua sobre conteúdo variado da página, não sobre
  o fundo constante do rail — sem uma superfície própria ficaria ilegível
  dependendo do que estiver embaixo.
- Renderizado direto em `app/page.tsx` (`<WorkspacePanelToggles />`), então só
  existe na árvore da página do Workspace — nas outras telas nem é montado.
- `WorkspacePanelsContext` não mudou; só mudou quem consome o `toggle()`.

Verificado: os dois botões aparecem no canto inferior direito (medido via
`getBoundingClientRect`, ~20px das bordas), 32×32px; ocultar/mostrar cada um
isoladamente sem afetar o outro (testado clicando só um por vez, com
`localStorage` limpo antes de cada teste — uma vez o teste anterior tinha deixado
os dois marcados como fechados de uma rodada de verificação anterior, o que
pareceu um bug de "os dois fecham juntos" até eu limpar o estado e reproduzir
isolado: não é bug, é preciso sempre partir de um estado limpo ao testar
manualmente esta função). Sumiu do rail e do Funil (0 botões extras fora do
Workspace). Testado nos dois temas. `npx tsc --noEmit` (0 erros) e `npm test`
(41 testes) depois da mudança.

### Painel fixo ao rolar, realinhado com a fileira de filtros, ícones sem fundo — 18/09/2026

Três ajustes finos no mesmo conjunto, pedidos juntos:

1. **Fixo ao rolar.** O painel da direita (`<aside>`) rolava junto com a página e
   desaparecia de vista. Trocado `pt-3` por `sticky top-6 pt-[59px]` em
   `app/page.tsx`. `pt-[59px]` é o mesmo cálculo de antes (repetido porque a
   rodada de "voltar como estava" tinha revertido para `pt-3`, alinhado com o
   título): mede a fileira de busca+chips do Novos Leads via
   `getBoundingClientRect` (topo em y≈245) contra o topo do `<aside>` sem
   padding (y≈186) — diferença de 59px. `sticky top-6` faz o painel colar a 24px
   do topo da tela assim que a rolagem normal o levaria além desse ponto; até lá,
   ele se comporta como posição normal (por isso o alinhamento inicial com a
   fileira de filtros continua valendo sem nenhuma mudança extra). Funciona
   porque o item de grid tem como *containing block* a área inteira da grade (a
   altura da coluna principal, mais alta), não só a altura do próprio conteúdo do
   `<aside>` — por isso há "espaço" para ele grudar em vez de já estar esticado.
   Confirmado via `getBoundingClientRect` antes/depois de rolar 300px: o topo
   travou em 24px em vez de continuar subindo.
2. **Ícones sem fundo até clicar.** `WorkspacePanelToggles.tsx`: removido o
   `bg-surface text-muted shadow-[var(--shadow-chip)]` do estado fechado (que eu
   tinha adicionado para eles não sumirem sobre fundo variado) e substituído por
   `text-muted hover:bg-surface hover:text-text` — exatamente a mesma classe do
   item de navegação inativo do rail. Fundo preto (`bg-ink`) continua aparecendo
   só quando o painel está aberto, igual ao item de navegação ativo. Confirmado
   via `getComputedStyle` que o fundo fica `rgba(0,0,0,0)` (transparente de
   verdade) quando fechado, batendo com o mesmo teste num item real do rail.
3. Nenhuma mudança de posição/tamanho além dessas — os 32px e o canto inferior
   direito da rodada anterior continuam.

`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da mudança. Uma
referência visual foi prometida pelo Alex para uma rodada futura, mas ainda não
chegou anexada nesta sessão — se as medidas acima não baterem com o que ele tem em
mente, é questão de reajustar os valores (`top-6`, `pt-[59px]`), não a abordagem.

### Widescreen: fim da coluna reservada, painéis viraram overlay flutuante — 18/09/2026

Alex aprovou o alinhamento/fixo da rodada anterior ("ficou muito bom") e pediu o
próximo passo: as fileiras de Novos Leads e Minhas Tarefas deveriam ir até a borda
direita de verdade — hoje reservavam 300px fixos para a coluna do
`<aside>`, mesmo com "Onde os cards estão"/"Fila de follow-up" já flutuando por
cima delas. Junto, pediu um fundo discreto atrás dos dois pop-ups (um cinza um
pouco mais claro que o fundo da página, com leve sombra 3D), porque agora eles
ficam sobre conteúdo de verdade (os cards de lead), não mais sobre uma coluna
vazia — sem separação visual, ia ficar tudo misturado.

**Arquitetura nova:**

- `app/page.tsx` — removida a grade `xl:grid-cols-[minmax(0,1fr)_300px]`. A
  agenda e o cabeçalho continuam dentro do `max-w-[1320px]` de leitura (não foi
  pedido mexer neles); Novos Leads e Minhas Tarefas passaram para um `<div
  className="w-full">` fora desse limite, ocupando toda a largura disponível
  dentro do padding do `<main>` do `AppShell`.
- `components/workspace/WorkspacePanels.tsx` (novo, substitui a função
  `WorkspaceAside` inline e o `PanelSlot.tsx`, removido): recebe `counts`, `max`
  e `followups` já calculados no servidor (a mesma lógica de antes, só que
  computada uma vez em `app/page.tsx` e passada como prop) e renderiza os dois
  cartões como *overlay* `fixed`, não mais como coluna de grade. Some por
  completo (`return null`) quando os dois painéis estão fechados — nada de caixa
  vazia sobrando.
- O grupo dos dois cartões ganhou uma bandeja de fundo:
  `bg-surface-sunken` (o cinza um degrau mais claro que `--bg`, já existia como
  token — não é cor nova) com `p-3` de respiro e `shadow-[var(--shadow-raised)]`
  (a sombra mais forte, a mesma dos itens "ativos" do rail) em vez da sombra
  padrão de cartão — dá a separação e a impressão de profundidade pedidas, sem
  inventar uma cor fora da paleta.
- **Posicionamento:** trocado de `sticky` (dentro da grade) para `fixed`
  (`top-[233px] right-8`) puro, porque sem a coluna de grade não há mais uma
  "área de contenção" alta o bastante para o `sticky` ter onde grudar. `fixed`
  simplifica e ainda cumpre as duas exigências: sempre visível ao rolar (mais
  literal que `sticky`, que só prende depois de passar do ponto) e alinhado com
  a fileira de busca+chips desde o início (233px = 245px medidos da fileira de
  filtro menos os 12px do padding da bandeja nova). Medido via
  `getBoundingClientRect` antes/depois de rolar 300px: o topo do cartão interno
  ficou fixo em 233px nos dois casos.
- `WorkspacePanelToggles.tsx` não mudou — continua no canto inferior direito,
  ícone sem fundo até clicar.

**Verificado:** todas as quatro fileiras roláveis (chips e cards de Novos Leads e
Minhas Tarefas) agora terminam no mesmo x (~1273px numa janela de 1320px, batendo
com a borda direita do `<main>` menos o padding e a barra de rolagem) — antes
paravam ~300px antes disso. Fechar os dois painéis remove a bandeja
inteira, sem sobra. Testado nos dois temas (no escuro, a bandeja fica bem
próxima da cor do cartão preto de "Fila de follow-up" — separação sutil, do jeito
que "leve sombreamento" sugere). `npx tsc --noEmit` (0 erros) e `npm test`
(41 testes) depois da mudança.

### Realinhamento fino e alça de arrastar no topo da bandeja — 18/09/2026

Alex aprovou o widescreen ("ficou muito bom") e pediu dois ajustes finos na
bandeja de fundo:

1. **Alinhar a borda da bandeja com a fileira de filtros**, não só o cartão de
   dentro. Antes (`top-[233px]`), o topo da BANDEJA ficava 12px acima da
   fileira de busca+chips (só o cartão branco de dentro, depois do padding,
   batia com ela); agora (`top-[245px]`) é o topo da bandeja em si que bate,
   então nada dela aparece acima da linha dos filtros.
2. **Uma alça de arrastar no topo**, como as de bottom sheet (barrinha
   arredondada, `h-1 w-10`, cor `--border-strong`): arrastar para baixo (mais de
   24px) recolhe as janelas; arrastar para cima reabre; um clique simples (sem
   arrastar) alterna do mesmo jeito. A alça em si NUNCA desaparece enquanto
   pelo menos um painel estiver marcado como aberto nos ícones do rail — ela é
   o "recolher tudo", não um terceiro painel; quem decide QUAIS painéis existem
   continua sendo só os ícones do canto inferior direito.

**Implementação:** `components/workspace/WorkspacePanels.tsx` ganhou
`useState<boolean>` local (`collapsed`) e um `useRef` para a coordenada Y do
início do arrasto — mesmo padrão do `DraggableWindow.tsx` de uma rodada anterior
(`onPointerDown` chama `setPointerCapture`; `onPointerUp` calcula o delta e
decide recolher/abrir/alternar). Acessível: `role="button"`, `tabIndex={0}`,
`aria-expanded`, e `Enter`/`Espaço` alternam via teclado.

**Verificado:**

- Alinhamento: `getBoundingClientRect` do topo da bandeja bate com o topo da
  fileira de busca+chips (245px nos dois, numa aba nova e limpa).
- Lógica de arrasto: simulada via `dispatchEvent` de `PointerEvent`
  (`pointerdown` na alça, depois `pointerup` a diferentes distâncias) — recolhe
  com >24px para baixo, reabre com >24px para cima, alterna com deslocamento
  pequeno (efeito de clique). Teclado (`Enter`) também alterna.
- Fechar os dois painéis pelos ícones do rail remove a alça inteira (nenhuma
  bandeja vazia sobrando), independente do estado de recolhido/expandido.
- **Limite da verificação:** a ferramenta de automação usada nesta sessão
  (`left_click_drag`, um arrasto de mouse "de verdade" simulado por fora da
  página) não conseguiu acionar o gesto — o clique parece não gerar a mesma
  sequência de eventos de ponteiro que um arrasto real do usuário dispara. A
  lógica em si foi confirmada correta via simulação de eventos DENTRO da
  página (o mesmo caminho de código que um arrasto de mouse real percorre), e
  o padrão é idêntico ao já usado e comprovado em `DraggableWindow.tsx`. Ainda
  assim, **o Alex deveria confirmar com um arrasto de mouse de verdade** antes
  de considerar isto fechado — se não responder ao toque, é aqui que
  investigar primeiro.

`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da mudança.

### Bandeja presa embaixo, laterais rentes — inspirada num widget de chamada, 18/09/2026

Alex mandou uma referência (mockup do Dribbble original, o mesmo da rodada de
auditoria visual do começo do projeto) mostrando um widget de chamada de vídeo
com um painel "Summary" embaixo dele, os dois no canto inferior direito, com uma
alcinha arredondada no topo do widget. Pediu para misturar essa ideia com o que
já existe: duas mudanças pontuais, não uma reconstrução.

1. **Laterais da bandeja rentes com as laterais dos cartões** — antes a bandeja
   tinha `px-3` (12px de cada lado) entre sua borda e o cartão de dentro; virou
   `w-[300px]` sem padding horizontal nenhum, então os cartões (que preenchem
   100% da largura do pai) ficam exatamente do mesmo tamanho que a bandeja.
2. **Abre de baixo para cima, fixo embaixo** — trocado `top-[245px]` (alinhado
   com a fileira de filtros, do jeito que tinha ficado numa rodada anterior) por
   `bottom-28` (112px do rodapé da tela). Como a bandeja é uma coluna flexível
   com altura automática, prender pela base faz ela crescer para CIMA conforme
   mais painéis abrem (ou encolher para baixo conforme fecham/recolhem) — a
   base nunca se move. `112px` foi escolhido para não encostar no cluster dos
   dois ícones de mostrar/ocultar (`bottom-5` + 2×32px + 8px de gap = 92px de
   altura a partir do rodapé); sobra ~20px de respiro entre os dois.

**O que isso substitui:** o alinhamento com a fileira de filtros da rodada
anterior não faz mais sentido com posicionamento pelo rodapé (são
mutuamente exclusivos — não dá pra estar preso no topo alinhado com uma coisa e
preso na base ao mesmo tempo). É uma correção de rumo, não um bug: o Alex viu o
resultado anterior e decidiu por outra direção, baseado numa referência nova.

**Verificado** (`getBoundingClientRect`, aba nova e limpa): o `left`/`right` da
bandeja bate exatamente com o `left`/`right` do cartão de dentro (nenhum gap
lateral); a base da bandeja fica fixa em `viewportHeight - 112px` com 1 painel
aberto ou com os 2 — só o topo sobe/desce; fechar um painel encolhe a bandeja
pra baixo sem mover a base; a alça continua recolhendo/reabrindo do mesmo jeito
de antes (arrasto ou clique), e nesse estado recolhido a base também não se
move (só o topo sobe até a altura da própria alça). Testado nos dois temas.
`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da mudança.

### Zero respiro embaixo, vidro fosco, ícones foram para o lado — 18/09/2026

Alex pediu, em duas mensagens seguidas: "fixe igual a referência, zero respiro
embaixo" e "aplique uma leve transparência no fundo e um efeito blur, como na
referência".

- `bottom-28` → `bottom-0`: a bandeja agora encosta rente no rodapé da tela,
  sem nenhum respiro. Cantos de baixo deixaram de ser arredondados
  (`rounded-[...]` → `rounded-t-[...]`) porque uma borda rente à tela não tem
  como mostrar arredondamento embaixo mesmo.
- Fundo sólido (`bg-surface-sunken`) virou translúcido com desfoque:
  `bg-[color-mix(in_srgb,var(--surface-sunken)_70%,transparent)]` (70% de
  opacidade) + `backdrop-blur-md` (desfoca o que passar atrás, efeito vidro
  fosco). Confirmado via `getComputedStyle`: `backgroundColor` com alpha 0.7 e
  `backdropFilter: blur(12px)`.
- **Ícones de mostrar/ocultar mudaram de lugar** — consequência direta do
  `bottom-0`: não sobra mais espaço abaixo da bandeja para eles (que estavam em
  `bottom-5`, ficariam embaixo da própria bandeja agora que ela desce até o
  fim). Movidos para o **lado esquerdo** da bandeja (`WorkspacePanelToggles.tsx`:
  `right-[340px]`, mesma altura aproximada) — de propósito ao lado, não acima
  dela, porque a altura da bandeja varia com quantos painéis estão abertos; um
  espaço fixo "acima" exigiria medir a altura toda vez, enquanto "ao lado"
  nunca colide, seja qual for a altura.

**Verificado:** `getBoundingClientRect` da bandeja tem `bottom` exatamente igual
à altura da viewport (zero gap) com qualquer combinação de painéis abertos; os
dois ícones ficam ao lado, sem sobrepor a bandeja em nenhuma altura testada (1
painel, 2 painéis, recolhido). Testado nos dois temas. `npx tsc --noEmit`
(0 erros) e `npm test` (41 testes) depois da mudança.

### Bug real corrigido: clique na temperatura não avançava — 18/09/2026

Alex reportou dois problemas de funcionalidade (não visuais) no Funil. Um era
bug de verdade, o outro é esclarecimento de comportamento existente.

**Bug real:** clicar nas bolinhas de temperatura não mudava nada visualmente.
Causa: `ClientMiniCard.tsx` passava para `TemperatureControl` o valor JÁ
CONVERTIDO da confiança do SDR (`temperatureFromSdrConfidence`) como se fosse o
dado real — então o primeiro clique calculava o próximo passo a partir de
"Quente" (a conversão exibida), pulando para `null` em vez de avançar para
"Frio"; e como a interface volta a mostrar a mesma conversão enquanto o campo
real (`client.temperature`) continua `null`, o clique parecia não fazer nada.
O mesmo padrão existia em `ClientPageHeader.tsx` e no diálogo Editar cliente
(`ClientDetails.tsx`) — este último com uma consequência mais séria: salvar o
diálogo sem tocar na temperatura gravava a conversão do SDR como se fosse
escolha manual.

Corrigido separando os dois conceitos em `TemperatureControl.tsx`: `value`
(o dado real, que orienta o próximo clique) e `displayValue` (o que aparece
quando `value` é `null`). Verificado clicando de fato e recarregando: o ciclo
Classificar→Frio→Morno→Quente→Classificar avança e persiste corretamente a
cada passo, testado no Funil.

**Não é bug:** "Fila de follow-up" vazia mesmo com um card na lista
"Follow-up" do Kanban. O widget lê só `clients.nextFollowupAt` (uma data),
gravada apenas pelo fluxo de comentário `FOLLOW-UP` com data — nunca por
posição no Kanban. Nenhum código alterado; se o Alex quiser ligar os dois,
é decisão de produto nova a conversar antes.

`npx tsc --noEmit` (0 erros) e `npm test` (41 testes) depois da correção.

**Pendência para a próxima rodada:** o botão "+" (agora ao lado esquerdo da
bandeja, não mais no rail), que abre um pop-up para
criar uma janela personalizada. Alex já indicou três tipos de conteúdo que quer
poder criar (agenda estilo Google, resumo de dados de um cliente, gráfico de uma
métrica específica) — cada um é essencialmente uma feature própria, então a
sugestão registrada é construir um tipo de cada vez, começando pelo que o Alex
escolher primeiro. Regra já combinada para quando isso for construído: no máximo
duas janelas abertas ao mesmo tempo (as duas atuais já contam para esse limite);
abrir uma terceira exige fechar uma antes.
