# CSystem — contexto de continuidade

> Atualizado em 18/09/2026. Este é o ponto de partida para outro chat, Claude ou
> agente técnico retomar o projeto. Ele descreve fatos observados nesta sessão; não
> substitui os documentos-fonte da Capill.

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
  app/globals.css                       components/shell/AppShell.tsx
  app/layout.tsx                        components/shell/PageHeader.tsx
  app/metricas/page.tsx                 components/shell/Rail.tsx
  app/page.tsx                          components/shell/ScheduleBar.tsx
  components/cliente/ClientDetails.tsx  components/shell/ThemeToggle.tsx
  components/cliente/ClientTimeline.tsx components/tarefas/TaskCard.tsx
  components/config/LabelsManager.tsx   components/tarefas/TaskDialog.tsx
  components/config/ListsManager.tsx    components/tarefas/TasksView.tsx
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
demais telas, interações de card, tema, etiquetas, timeline e a documentação deste
handoff. Sugestão de mensagem: `feat(csystem): refina workspace, cards e histórico de eventos`.

Antes de commitar, mostrar ao Alex o `git diff --stat` e o diff dos arquivos alterados,
confirmar que `data/csystem.db` não entrou no staging, e informar os comandos de
validação acima. O commit continua dependendo da autorização explícita dele.
