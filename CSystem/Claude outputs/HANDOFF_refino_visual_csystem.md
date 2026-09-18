# Handoff — Refino visual do CSystem (18/09/2026)

Contexto para quem for continuar isto em outro chat/agente (Claude Code, Cursor, etc.).

## O que foi pedido

Aproximar o Workspace, Funil, Tarefas, Agenda, Métricas e Configurações do
CSystem da referência do Dribbble ("HubSpot CRM — Sales Management Dashboard",
Jack R./RonDesignLab), melhorando distribuição, alinhamento, respiro,
hierarquia, proporções, cards, botões, barra de agenda, rail e responsividade —
sem alterar regra de negócio, métrica, banco, webhook, palavra-chave, lista,
transição ou dado, e sem commitar nada.

## Leitura obrigatória antes de mexer (nessa ordem)

1. `CSystem/AGENTS.md`
2. `CSystem/docs/CONTEXTO_DE_CONTINUIDADE.md` — já atualizado com o registro
   completo desta rodada (seção "Rodada de refino visual — 18/09/2026")
3. `CSystem/README.md`
4. `CSystem/docs/PLANEJAMENTO.md` — seção 10 já tem o adendo desta rodada
5. `DOCUMENTACAO.md` na raiz do repositório (Capill-CHIA)

## Estado atual

**As mudanças abaixo já estão escritas nos arquivos da sua pasta local** — não
foi feito commit, mas o código já está no disco. Este pacote existe para você
revisar o que mudou, ou para entregar a outro agente que vá ajustar/continuar
o trabalho sem precisar reconstruir o raciocínio do zero.

Dois arquivos anexos:

- `csystem-refino-visual.patch` — diff unificado (`git apply` funciona) de tudo
  que mudou, arquivo por arquivo.
- Este documento, com o resumo de cada decisão.

## O que mudou, e por quê

### 1. Fade nas rolagens horizontais (`components/ui/FadeScroller.tsx`, novo)

O Funil já tinha um mascaramento de borda (fade) no filtro de etiquetas, para
indicar que há mais conteúdo fora da área visível sem precisar de uma barra de
rolagem visível. Esse comportamento foi extraído para um componente
reutilizável e passou a valer também para:

- `components/workspace/LeadsRow.tsx` — fileira "Novos Leads" (filtros e cards)
- `components/workspace/TodayTasksRow.tsx` — fileira "Minhas Tarefas" (filtros e cards)
- `components/tarefas/TasksView.tsx` — filtro de tarefas
- `components/funil/FunilView.tsx` — refatorado para usar o componente novo em vez de duplicar a lógica

Mesma lógica de sempre: `ResizeObserver` recalcula os limites, a máscara CSS
apaga o próprio conteúdo (não é uma faixa por cima), fade de 88px nas fileiras
de cards e 48px nas fileiras de chips (mais estreitas).

### 2. Hierarquia tipográfica

Títulos de cartão/seção que estavam em `text-lg` (18px) subiram para `text-xl`
(20px): Cadastro, Etiquetas, Situação, Pagamentos, Eventos, Registros do
sistema, os painéis de Métricas, Listas do funil, Próximos 30 dias, Fila de
follow-up, etc.

Títulos de fileira do Workspace (`SectionHeader`, usado em "Novos Leads" e
"Minhas Tarefas") subiram de `text-xl` para `text-2xl` (24px), para ficarem
claramente acima dos títulos de cartão na escala.

Títulos de diálogo (`components/ui/Dialog.tsx`) ficaram de propósito em
`text-lg` — um modal não deveria competir em peso visual com a página atrás
dele.

Escala resultante: título de página (42–56px) → título de fileira (24px) →
título de cartão (20px) → corpo (14px).

### 3. Rail (`components/shell/Rail.tsx`)

Botões (logo e ícones de navegação) de 44px para 48px (`size-11` → `size-12`),
gap entre eles de `gap-2` para `gap-2.5`, coluna do rail de 76px para 84px
para caber a folga sem apertar.

### 4. Barra de agenda (`components/shell/ScheduleBar.tsx`)

Preenchimento interno de `p-1.5` para `p-2`, altura da trilha de compromissos
de `h-10` para `h-11` (mais próxima da barra preta "encorpada" da referência),
blocos de compromisso recentralizados nessa trilha mais alta (`top-1` → `top-1.5`).

## O que NÃO mudou (de propósito)

- Nenhuma regra de negócio, cálculo de métrica, schema de banco, payload de
  webhook, palavra-chave, nome/comportamento de lista.
- Os deltas de exemplo de Fechadas/Perdidas continuam exemplo visual
  documentado, não dado real.
- `data/csystem.db` não foi tocado; nenhum `db:reset`; n8n não foi tocado.
- Urbanist, a paleta (`#000000`, `#B9FF66`, `#D2D2D2`, `#66FFED`, `#FFFFFF`,
  `#F04949`), tema claro/escuro, duplo clique para abrir cliente/tarefa,
  etiquetas sem contorno preto, separação Eventos/Registros do sistema.

## Validação feita — e o limite dela

`npx tsc --noEmit` (0 erros) e `npm test` (38 testes, mesma contagem de antes)
passaram, rodados numa cópia isolada do código. **A aparência real no
navegador não foi conferida nesta rodada** — quem continuar isto deveria
rodar `npm run dev` (com o dev server parado antes de qualquer `build`) e
olhar as seis telas antes de aprovar ou commitar. Pontos com mais chance de
precisar de retoque fino ao ver rodando: o rail maior (84px pode folgar demais
em telas menores) e o fade de 48px nas fileiras de chips (pode cortar texto
se algum label for muito longo).

## Arquivos alterados (19 no total, 1 novo)

```
app/agenda/page.tsx
app/configuracoes/page.tsx
app/entrada-sdr/page.tsx
components/cliente/ClientDetails.tsx
components/cliente/ClientTimeline.tsx
components/cliente/PaymentsPanel.tsx
components/config/LabelsManager.tsx
components/config/ListsManager.tsx
components/funil/FunilView.tsx
components/metricas/FunnelChart.tsx
components/metricas/MetricPanels.tsx
components/sdr/RepassePaste.tsx
components/shell/Rail.tsx
components/shell/ScheduleBar.tsx
components/tarefas/TasksView.tsx
components/ui/FadeScroller.tsx      (novo)
components/ui/primitives.tsx
components/workspace/LeadsRow.tsx
components/workspace/TodayTasksRow.tsx
```

## Como aplicar o patch (se for começar de um checkout limpo)

```bash
cd CSystem
git apply --check csystem-refino-visual.patch   # confere sem aplicar
git apply csystem-refino-visual.patch           # aplica de verdade
```

Se o `git apply` reclamar de contexto (porque os arquivos já têm as mudanças
aplicadas na sua máquina), é porque o patch já foi aplicado — não precisa
fazer nada, é só usar os arquivos como estão.
