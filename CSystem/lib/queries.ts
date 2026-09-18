import "server-only";

import { and, asc, desc, eq, gte, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  clientLabels,
  clients,
  events,
  labels,
  listTransitions,
  lists,
  payments,
  sdrInbox,
  taskColumns,
  taskLabels,
  tasks,
} from "@/db/schema";
import { isKeyword, isStage, type Keyword, type Stage } from "./keywords";
import type {
  AppointmentView,
  ClientView,
  EventView,
  LabelView,
  ListView,
  TaskColumnView,
  TaskView,
  TransitionView,
} from "./view-types";

/**
 * Leituras do banco, já no formato que as telas consomem.
 *
 * Tudo síncrono: better-sqlite3 é síncrono e o banco é local, então não há
 * ganho em envolver isto em Promises.
 */

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

function parseChoices(raw: string | null): Keyword[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is Keyword => typeof v === "string" && isKeyword(v)) : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ listas */

export function getLists(includeArchived = false): ListView[] {
  const rows = db
    .select()
    .from(lists)
    .where(includeArchived ? undefined : eq(lists.archived, false))
    .orderBy(asc(lists.position))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    kind: row.kind,
    position: row.position,
    defaultKeyword:
      row.defaultKeyword && isKeyword(row.defaultKeyword)
        ? (row.defaultKeyword as Keyword)
        : null,
    keywordChoices: parseChoices(row.keywordChoices),
    countsAsStage: isStage(row.countsAsStage) ? (row.countsAsStage as Stage) : null,
  }));
}

/* --------------------------------------------------------------- etiquetas */

export function getLabels(includeArchived = false): LabelView[] {
  return db
    .select({
      id: labels.id,
      name: labels.name,
      group: labels.group,
      colorHex: labels.colorHex,
    })
    .from(labels)
    .where(includeArchived ? undefined : eq(labels.archived, false))
    .orderBy(asc(labels.group), asc(labels.position))
    .all();
}

/* ---------------------------------------------------------------- clientes */

function labelsByClient(): Map<string, LabelView[]> {
  const rows = db
    .select({
      clientId: clientLabels.clientId,
      id: labels.id,
      name: labels.name,
      group: labels.group,
      colorHex: labels.colorHex,
    })
    .from(clientLabels)
    .innerJoin(labels, eq(labels.id, clientLabels.labelId))
    .orderBy(asc(labels.group), asc(labels.position))
    .all();

  const map = new Map<string, LabelView[]>();
  for (const row of rows) {
    const list = map.get(row.clientId) ?? [];
    list.push({ id: row.id, name: row.name, group: row.group, colorHex: row.colorHex });
    map.set(row.clientId, list);
  }
  return map;
}

/** Último comentário de cada cliente — o rodapé do card no Kanban. */
function lastEventByClient(): Map<string, ClientView["lastEvent"]> {
  const rows = db
    .select({
      clientId: events.clientId,
      keyword: events.keyword,
      body: events.body,
      createdAt: events.createdAt,
    })
    .from(events)
    .orderBy(asc(events.createdAt))
    .all();

  const map = new Map<string, ClientView["lastEvent"]>();
  for (const row of rows) {
    map.set(row.clientId, {
      keyword: row.keyword,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    });
  }
  return map;
}

export function getClients(options?: { includeInactive?: boolean }): ClientView[] {
  const labelMap = labelsByClient();
  const eventMap = lastEventByClient();

  const rows = db
    .select()
    .from(clients)
    .where(
      options?.includeInactive
        ? undefined
        : and(ne(clients.status, "archived"), ne(clients.status, "lost")),
    )
    .orderBy(asc(clients.position))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    listId: row.listId,
    position: row.position,
    phoneNormalized: row.phoneNormalized,
    city: row.city,
    modality: row.modality,
    status: row.status,
    sdrClassification: row.sdrClassification,
    sdrConfidence: row.sdrConfidence,
    valueCents: row.valueCents,
    evaluationAt: iso(row.evaluationAt),
    nextFollowupAt: iso(row.nextFollowupAt),
    createdAt: row.createdAt.toISOString(),
    labels: labelMap.get(row.id) ?? [],
    lastEvent: eventMap.get(row.id) ?? null,
  }));
}

export function getClient(id: string) {
  const row = db.select().from(clients).where(eq(clients.id, id)).get();
  if (!row) return null;

  const clientLabelRows = db
    .select({
      id: labels.id,
      name: labels.name,
      group: labels.group,
      colorHex: labels.colorHex,
    })
    .from(clientLabels)
    .innerJoin(labels, eq(labels.id, clientLabels.labelId))
    .where(eq(clientLabels.clientId, id))
    .all();

  return {
    ...row,
    evaluationAt: iso(row.evaluationAt),
    nextFollowupAt: iso(row.nextFollowupAt),
    lostAt: iso(row.lostAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    labels: clientLabelRows,
  };
}

/**
 * Linha do tempo do cliente: comentários e movimentos de lista no mesmo fio,
 * em ordem cronológica. É o "histórico do card" da Regra 1.
 */
export function getClientTimeline(clientId: string): {
  events: EventView[];
  transitions: TransitionView[];
} {
  const eventRows = db
    .select()
    .from(events)
    .where(eq(events.clientId, clientId))
    .orderBy(desc(events.createdAt))
    .all();

  const transitionRows = db
    .select()
    .from(listTransitions)
    .where(eq(listTransitions.clientId, clientId))
    .orderBy(desc(listTransitions.movedAt))
    .all();

  return {
    events: eventRows.map((row) => ({
      id: row.id,
      transitionId: row.transitionId,
      keyword: row.keyword,
      body: row.body,
      reason: row.reason,
      followupMotivo: row.followupMotivo,
      followupEvento: row.followupEvento,
      followupData: row.followupData,
      author: row.author,
      createdAt: row.createdAt.toISOString(),
    })),
    transitions: transitionRows.map((row) => ({
      id: row.id,
      fromListName: row.fromListName,
      toListName: row.toListName,
      keyword: row.keyword,
      source: row.source,
      movedAt: row.movedAt.toISOString(),
    })),
  };
}

export function getClientPayments(clientId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.clientId, clientId))
    .orderBy(desc(payments.createdAt))
    .all()
    .map((row) => ({
      ...row,
      dueAt: iso(row.dueAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
}

/* ----------------------------------------------------------------- tarefas */

export function getTaskColumns(): TaskColumnView[] {
  return db
    .select({
      id: taskColumns.id,
      name: taskColumns.name,
      accent: taskColumns.accent,
      position: taskColumns.position,
    })
    .from(taskColumns)
    .where(eq(taskColumns.archived, false))
    .orderBy(asc(taskColumns.position))
    .all();
}

export function getTasks(): TaskView[] {
  const labelRows = db
    .select({
      taskId: taskLabels.taskId,
      id: labels.id,
      name: labels.name,
      group: labels.group,
      colorHex: labels.colorHex,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(labels.id, taskLabels.labelId))
    .all();

  const labelMap = new Map<string, LabelView[]>();
  for (const row of labelRows) {
    const list = labelMap.get(row.taskId) ?? [];
    list.push({ id: row.id, name: row.name, group: row.group, colorHex: row.colorHex });
    labelMap.set(row.taskId, list);
  }

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      notes: tasks.notes,
      columnId: tasks.columnId,
      position: tasks.position,
      dueAt: tasks.dueAt,
      priority: tasks.priority,
      doneAt: tasks.doneAt,
      clientId: tasks.clientId,
      clientName: clients.name,
    })
    .from(tasks)
    .leftJoin(clients, eq(clients.id, tasks.clientId))
    .orderBy(asc(tasks.position))
    .all()
    .map((row) => ({
      ...row,
      dueAt: iso(row.dueAt),
      doneAt: iso(row.doneAt),
      labels: labelMap.get(row.id) ?? [],
    }));
}

/* ------------------------------------------------------------------ agenda */

export function getAppointments(range?: { start: Date; end: Date }): AppointmentView[] {
  const rows = db
    .select({
      id: appointments.id,
      title: appointments.title,
      clientId: appointments.clientId,
      clientName: clients.name,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      kind: appointments.kind,
      modality: appointments.modality,
      status: appointments.status,
    })
    .from(appointments)
    .leftJoin(clients, eq(clients.id, appointments.clientId))
    .where(
      range
        ? and(gte(appointments.startsAt, range.start), lt(appointments.startsAt, range.end))
        : undefined,
    )
    .orderBy(asc(appointments.startsAt))
    .all();

  return rows.map((row) => ({
    ...row,
    startsAt: row.startsAt.toISOString(),
    endsAt: iso(row.endsAt),
  }));
}

export function getTodayAppointments(): AppointmentView[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return getAppointments({ start, end });
}

/** Fila de follow-up: quem tem data de retorno marcada, do mais atrasado ao futuro. */
export function getFollowupQueue(limit = 50) {
  return db
    .select({
      id: clients.id,
      name: clients.name,
      listId: clients.listId,
      listName: lists.name,
      nextFollowupAt: clients.nextFollowupAt,
      phoneNormalized: clients.phoneNormalized,
    })
    .from(clients)
    .innerJoin(lists, eq(lists.id, clients.listId))
    .where(and(isNotNull(clients.nextFollowupAt), eq(clients.status, "active")))
    .orderBy(asc(clients.nextFollowupAt))
    .limit(limit)
    .all()
    .map((row) => ({ ...row, nextFollowupAt: iso(row.nextFollowupAt) }));
}

/* ------------------------------------------------------------- entrada SDR */

export function getSdrInbox(limit = 100) {
  return db
    .select()
    .from(sdrInbox)
    .orderBy(desc(sdrInbox.receivedAt))
    .limit(limit)
    .all()
    .map((row) => ({ ...row, receivedAt: row.receivedAt.toISOString() }));
}

/* ------------------------------------------------------------------ busca */

export function searchClients(term: string, limit = 20) {
  const like = `%${term.trim().toLowerCase()}%`;
  if (!term.trim()) return [];

  return db
    .select({
      id: clients.id,
      name: clients.name,
      listName: lists.name,
      phoneNormalized: clients.phoneNormalized,
    })
    .from(clients)
    .innerJoin(lists, eq(lists.id, clients.listId))
    .where(
      or(
        sql`lower(${clients.name}) like ${like}`,
        sql`${clients.phoneNormalized} like ${like}`,
        sql`lower(coalesce(${clients.city}, '')) like ${like}`,
      ),
    )
    .limit(limit)
    .all();
}
