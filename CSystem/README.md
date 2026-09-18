# CSystem

CRM operacional da Capill: funil de clientes, tarefas, agenda e métricas — em um app
que roda no seu computador, com o banco num arquivo só.

Substitui o board `Clientes Capill` do Trello e recebe os leads do Agente SDR pelo n8n.

---

## A ideia central

**Arrastar o card entre listas é o que gera o número.**

Toda vez que um card muda de lista, o sistema grava uma linha na tabela
`list_transitions` — sempre, sem perguntar nada. O dashboard soma dali. Depois do
arrasto aparece um balão sugerindo o comentário (`AGENDOU`, `COMPARECEU`, `FECHOU`…),
mas **ignorar o balão não perde nenhum número**: o comentário serve para o *porquê*
(motivo da perda, data de retorno), nunca para o *quanto*.

Consequência prática: a métrica deixa de depender de disciplina de registro.

---

## Instalar e rodar

Precisa do **Node.js LTS** instalado uma vez:

```bash
winget install OpenJS.NodeJS.LTS
```

Depois, dentro da pasta `CSystem`:

```bash
npm install
```

```bash
cp .env.example .env.local
```

Abra `.env.local` e troque `CSYSTEM_WEBHOOK_TOKEN` por um valor longo e aleatório.
Então crie o banco e a estrutura inicial:

```bash
npm run db:push
```

```bash
npm run db:seed
```

E rode:

```bash
npm run dev
```

Abra <http://localhost:3000>.

O seed cria **12 listas, 15 etiquetas e 4 colunas de tarefa — e nenhum cliente**. A base
começa vazia, por decisão. Tudo que o seed cria é editável e apagável em Configurações.

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o app em modo de desenvolvimento |
| `npm run build` | Compila para produção (checa tipos) |
| `npm run start` | Roda a versão compilada |
| `npm run typecheck` | Só a checagem de tipos |
| `npm test` | Testes de telefone, parser do repasse e palavras-chave |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:seed` | Cria a estrutura inicial (idempotente) |
| `npm run db:studio` | Abre o navegador de banco do Drizzle |
| `npm run db:reset` | **Apaga o banco.** Pede confirmação digitada |

---

## Telas

| Rota | O que tem |
|---|---|
| `/` | Workspace: agenda do dia, números do mês, leads e tarefas |
| `/funil` | Kanban com arrasto + visão em lista; criar e editar listas e cards |
| `/clientes/[id]` | O card único: cadastro, etiquetas, linha do tempo, comentários |
| `/tarefas` | Minhas tarefas em Kanban ou Lista, alternável |
| `/agenda` | Próximos 30 dias e a fila de follow-up |
| `/metricas` | Funil do período, comparecimento, tempo por etapa, motivos, origem |
| `/entrada-sdr` | Repasses recebidos e colagem manual de `===REPASSE===` |
| `/configuracoes` | Listas, etiquetas com seletor de cor, webhook, backup |

Tema claro/escuro no botão ☀/☾ no topo direito de qualquer tela.

---

## As regras da Capill dentro do código

O sistema não é um CRM genérico: as regras dos documentos-fonte estão implementadas.

**Regra 1 — card único por cliente** (`MANUAL_OPERACIONAL_CAPILL_V1.md`)
O telefone normalizado é chave única. Criar cliente com telefone repetido é bloqueado e
o app oferece abrir o card existente. O webhook do SDR atualiza em vez de duplicar.
→ `lib/phone.ts`, `app/actions/clients.ts`

**Regra 2 — etiquetas em 4 grupos independentes**
Um card pode ter etiqueta de vários grupos ao mesmo tempo. Grupos são texto livre: dá
para criar grupo novo.
→ `components/config/LabelsManager.tsx`

**As 11 palavras-chave** (`PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md`)
Escolhidas em chips, nunca digitadas — isso elimina variações inventadas como
"AGENDADO" no lugar de "AGENDOU". A grafia `NAO COMPARECEU` e `PECA CHEGOU` está **sem
acento** de propósito: é assim no documento.
→ `lib/keywords.ts`

**Um comentário = um evento**
O compositor recusa dois eventos no mesmo texto.

**Motivo nunca é adivinhado**
`PENSANDO` e `PERDIDO` abrem as 14 categorias do documento, com
`motivo não identificado` como padrão.

**O SDR nunca registra AGENDOU**
Repasse que tente `AGENDOU` é convertido para `OUTRO`, com aviso.
→ `lib/keywords.ts:sanitizeSdrKeyword`

**Ausência de dado não é dado negativo** (Protocolo de Verdade §13A)
Etapa sem base mostra "sem dados", nunca 0%. Amostra abaixo de 10 vem marcada como tal.
→ `lib/metrics.ts`

---

## Integração com o SDR

`POST /api/sdr/repasse`, autenticado pelo header `x-csystem-token`.

A configuração exata do nó do n8n está em [`docs/INTEGRACAO_N8N.md`](docs/INTEGRACAO_N8N.md).
O histórico de como o sistema foi decidido — alternativas descartadas, Teste do
Engenheiro e checklist de verificação — está em
[`docs/PLANEJAMENTO.md`](docs/PLANEJAMENTO.md).

## Continuidade do projeto

Antes de retomar desenvolvimento em outro chat ou agente, leia o
[`docs/CONTEXTO_DE_CONTINUIDADE.md`](docs/CONTEXTO_DE_CONTINUIDADE.md). Ele registra o
estado do Git, decisões de interface, comportamento validado, dados que não podem ser
apagados, limitações do ambiente local e pendências. As regras de operação da Capill
continuam em [`../AGENTS.md`](../AGENTS.md) e o histórico geral append-only está em
[`../DOCUMENTACAO.md`](../DOCUMENTACAO.md).

**Nada foi aplicado no n8n** — a mudança no fluxo que atende cliente real depende de
autorização.

Enquanto o app roda local, o n8n da nuvem não alcança `localhost`: use um túnel
temporário para testar, ou cole o bloco em **Entrada SDR** no dia a dia.

---

## Backup

Todo o sistema vive em `data/csystem.db`. Backup é copiar esse arquivo. Com o app
rodando, copie também `-wal` e `-shm`, se existirem.

O banco está no `.gitignore`: é dado real de cliente e não vai para o repositório.

---

## Arquitetura

```
app/          telas (Server Components) e server actions
  api/        webhook do SDR e health check
components/   UI, agrupada por área
db/           schema Drizzle, seed e conexão
lib/          regras de domínio — é onde mora a lógica que importa
  keywords.ts     as 11 palavras-chave e os estágios de métrica
  transitions.ts  o motor que grava a métrica a cada arrasto
  metrics.ts      as agregações do funil
  phone.ts        normalização = Regra 1
  sdr-parser.ts   parse do bloco ===REPASSE===
  sdr-ingest.ts   recepção de um repasse
```

Stack: Next.js 15 · React 19 · TypeScript · Tailwind v4 · SQLite (better-sqlite3) ·
Drizzle ORM · @dnd-kit.

**Duas decisões que valem entender antes de mexer:**

1. **`list_transitions` guarda um snapshot** do nome e do estágio das listas envolvidas.
   Por isso renomear ou excluir uma lista não corrompe os números de meses anteriores.
2. **O mapa "lista → palavra-chave" e "lista → estágio" vive no banco**, não no código
   (`lists.default_keyword`, `lists.counts_as_stage`). O Alex pode criar listas; um mapa
   fixo em código quebraria na primeira lista nova.

---

## Para subir na nuvem depois

O código já está pronto para isso. Trocar o driver do Drizzle de `better-sqlite3` para
`postgres-js`, apontar `CSYSTEM_DB_PATH` para a URL do Postgres e publicar. O endpoint
do webhook e todas as telas continuam iguais.
