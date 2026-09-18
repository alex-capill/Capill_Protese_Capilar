import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Schema do CSystem.
 *
 * Duas decisões estruturais que sustentam o resto do sistema:
 *
 * 1. `listTransitions` é a FONTE DA MÉTRICA. Toda vez que um card muda de lista,
 *    grava-se uma linha aqui — sempre, sem depender de o Alex escrever comentário.
 *    A linha guarda um SNAPSHOT do nome e do estágio das listas envolvidas, então
 *    renomear ou excluir uma lista depois não corrompe o histórico.
 *
 * 2. O mapa "lista -> palavra-chave" e "lista -> estágio de métrica" vive no BANCO
 *    (`lists.defaultKeyword` / `lists.countsAsStage`), não no código. O Alex pode
 *    criar e renomear listas; um mapa fixo em código quebraria na primeira lista nova.
 */

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

/* ------------------------------------------------------------------ listas */

export const lists = sqliteTable(
  "lists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: real("position").notNull(),
    /** 'funnel' aparece no Kanban do funil; 'support' é apoio (ex: MATERIAIS DE APOIO). */
    kind: text("kind").notNull().default("funnel"),
    color: text("color"),
    /** Palavra-chave sugerida ao soltar um card aqui. Ver lib/keywords.ts */
    defaultKeyword: text("default_keyword"),
    /**
     * JSON com 2+ palavras-chave quando o destino é ambíguo (ex: FOLLOW-UP pode ser
     * FECHOU com pendência ou PENSANDO). O app pergunta em vez de carimbar.
     */
    keywordChoices: text("keyword_choices"),
    /** Estágio do funil para fins de métrica. Ver lib/keywords.ts (FUNNEL_STAGES). */
    countsAsStage: text("counts_as_stage"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("lists_position_idx").on(t.position)],
);

/* ---------------------------------------------------------------- clientes */

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Só dígitos. É a chave da Regra 1 (card único por cliente). */
    phoneNormalized: text("phone_normalized"),
    phoneRaw: text("phone_raw"),
    city: text("city"),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id),
    position: real("position").notNull(),
    /** Cadastro + contexto comercial (Regra 1 do Manual Operacional). */
    description: text("description"),
    /** 'studio' | 'online' */
    modality: text("modality"),
    /** 'active' | 'lost' | 'archived' */
    status: text("status").notNull().default("active"),
    valueCents: integer("value_cents"),
    evaluationAt: integer("evaluation_at", { mode: "timestamp" }),
    nextFollowupAt: integer("next_followup_at", { mode: "timestamp" }),
    /** Campos vindos do bloco ===REPASSE=== do SDR. */
    sdrClassification: text("sdr_classification"),
    sdrConfidence: text("sdr_confidence"),
    /** Classificação inicial do SDR, ajustável manualmente pelo Alex: frio | morno | quente. */
    temperature: text("temperature"),
    lostReason: text("lost_reason"),
    lostAt: integer("lost_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    // SQLite permite múltiplos NULL num índice único: clientes sem telefone convivem.
    uniqueIndex("clients_phone_unique").on(t.phoneNormalized),
    index("clients_list_idx").on(t.listId, t.position),
    index("clients_status_idx").on(t.status),
    index("clients_followup_idx").on(t.nextFollowupAt),
  ],
);

/* --------------------------------------------------------------- etiquetas */

export const labels = sqliteTable(
  "labels",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** 'ORIGEM' | 'MODALIDADE' | 'PAGAMENTO' | 'SITUACAO_ESPECIAL' | qualquer grupo criado pelo Alex */
    group: text("group").notNull().default("CUSTOM"),
    /** Cor livre em hex, escolhida no seletor. */
    colorHex: text("color_hex").notNull(),
    position: real("position").notNull(),
    /** Etiquetas de tarefa e de cliente moram na mesma tabela. */
    scope: text("scope").notNull().default("both"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("labels_group_idx").on(t.group, t.position)],
);

export const clientLabels = sqliteTable(
  "client_labels",
  {
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.labelId] })],
);

/* ------------------------------------------------- transições (a métrica) */

export const listTransitions = sqliteTable(
  "list_transitions",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    fromListId: text("from_list_id"),
    toListId: text("to_list_id").notNull(),
    /** Snapshots: o histórico sobrevive a renomear/excluir lista. */
    fromListName: text("from_list_name"),
    toListName: text("to_list_name").notNull(),
    fromStage: text("from_stage"),
    toStage: text("to_stage"),
    keyword: text("keyword"),
    /** 'drag' | 'comment' | 'sdr' | 'api' | 'seed' */
    source: text("source").notNull().default("drag"),
    movedAt: integer("moved_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("transitions_moved_idx").on(t.movedAt),
    index("transitions_client_idx").on(t.clientId, t.movedAt),
    index("transitions_stage_idx").on(t.toStage, t.movedAt),
  ],
);

/* ------------------------------------------------- eventos (o qualitativo) */

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    /** Uma das 11 palavras-chave do PADRAO_DE_COMENTARIOS, ou null para nota livre. */
    keyword: text("keyword"),
    body: text("body").notNull().default(""),
    /** Categoria de motivo (PENSANDO/PERDIDO). Nunca inferida pelo sistema. */
    reason: text("reason"),
    followupMotivo: text("followup_motivo"),
    followupEvento: text("followup_evento"),
    followupData: text("followup_data"),
    /** Liga o comentário à transição que o originou, quando houver. */
    transitionId: text("transition_id"),
    /** 'alex' | 'sdr' | 'system' */
    author: text("author").notNull().default("alex"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("events_client_idx").on(t.clientId, t.createdAt),
    index("events_keyword_idx").on(t.keyword, t.createdAt),
  ],
);

/* ----------------------------------------------------------------- tarefas */

export const taskColumns = sqliteTable(
  "task_columns",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    position: real("position").notNull(),
    accent: text("accent"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("task_columns_position_idx").on(t.position)],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    notes: text("notes"),
    columnId: text("column_id")
      .notNull()
      .references(() => taskColumns.id),
    position: real("position").notNull(),
    dueAt: integer("due_at", { mode: "timestamp" }),
    /** 'baixa' | 'media' | 'alta' */
    priority: text("priority").notNull().default("media"),
    doneAt: integer("done_at", { mode: "timestamp" }),
    /** Tarefa opcionalmente ligada a um cliente. */
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("tasks_column_idx").on(t.columnId, t.position),
    index("tasks_due_idx").on(t.dueAt),
  ],
);

export const taskLabels = sqliteTable(
  "task_labels",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.labelId] })],
);

/* ------------------------------------------------------------------ agenda */

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }),
    /** 'avaliacao' | 'aplicacao' | 'manutencao' | 'outro' */
    kind: text("kind").notNull().default("avaliacao"),
    modality: text("modality"),
    /** 'agendada' | 'compareceu' | 'nao_compareceu' | 'cancelada' */
    status: text("status").notNull().default("agendada"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("appointments_start_idx").on(t.startsAt)],
);

/* -------------------------------------------------------------- pagamentos */

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    totalCents: integer("total_cents").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    method: text("method"),
    /** 'aguardando' | 'parcial' | 'ok' */
    status: text("status").notNull().default("aguardando"),
    dueAt: integer("due_at", { mode: "timestamp" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("payments_client_idx").on(t.clientId)],
);

/* ------------------------------------------------------------- entrada SDR */

export const sdrInbox = sqliteTable(
  "sdr_inbox",
  {
    id: text("id").primaryKey(),
    rawText: text("raw_text").notNull(),
    parsedJson: text("parsed_json"),
    phone: text("phone"),
    name: text("name"),
    classification: text("classification"),
    confidence: text("confidence"),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    /** 'webhook' | 'manual' */
    source: text("source").notNull().default("webhook"),
    receivedAt: integer("received_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("sdr_inbox_received_idx").on(t.receivedAt)],
);

/* ----------------------------------------------------------- configurações */

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/* ------------------------------------------------------------------- tipos */

export type List = typeof lists.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Label = typeof labels.$inferSelect;
export type ListTransition = typeof listTransitions.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskColumn = typeof taskColumns.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type SdrInboxRow = typeof sdrInbox.$inferSelect;
