"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { labels, taskColumns, taskLabels, tasks } from "@/db/schema";
import { positionBetween } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

function validSpecialLabelIds(ids: string[] | undefined): string[] | null {
  const unique = [...new Set(ids ?? [])];
  if (unique.length === 0) return unique;
  const valid = db
    .select({ id: labels.id })
    .from(labels)
    .where(and(eq(labels.group, "SITUACAO_ESPECIAL"), inArray(labels.id, unique)))
    .all();
  return valid.length === unique.length ? unique : null;
}

/* ---------------------------------------------------------------- tarefas */

export async function createTaskAction(input: {
  title: string;
  columnId: string;
  notes?: string | null;
  dueAt?: string | null;
  priority?: "baixa" | "media" | "alta";
  clientId?: string | null;
  specialLabelIds?: string[];
}): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "A tarefa precisa de um título." };
  const specialLabelIds = validSpecialLabelIds(input.specialLabelIds);
  if (!specialLabelIds) return { ok: false, error: "A tarefa aceita apenas etiquetas de Situação especial." };

  const siblings = db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.columnId, input.columnId))
    .all();
  const position =
    siblings.length === 0 ? 1000 : Math.max(...siblings.map((s) => s.position)) + 1000;

  const id = randomUUID();
  db.transaction((tx) => {
    tx.insert(tasks)
      .values({
        id,
        title,
        columnId: input.columnId,
        position,
        notes: input.notes?.trim() || null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        priority: input.priority ?? "media",
        clientId: input.clientId || null,
      })
      .run();
    if (specialLabelIds.length > 0) {
      tx.insert(taskLabels)
        .values(specialLabelIds.map((labelId) => ({ taskId: id, labelId })))
        .run();
    }
  });

  refresh();
  return { ok: true, data: { id } };
}

export async function updateTaskAction(
  id: string,
  patch: {
    title?: string;
    notes?: string | null;
    dueAt?: string | null;
    priority?: "baixa" | "media" | "alta";
    clientId?: string | null;
    specialLabelIds?: string[];
  },
): Promise<ActionResult> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { ok: false, error: "O título não pode ficar vazio." };
    updates.title = title;
  }
  if (patch.notes !== undefined) updates.notes = patch.notes?.trim() || null;
  if (patch.dueAt !== undefined) updates.dueAt = patch.dueAt ? new Date(patch.dueAt) : null;
  if (patch.priority !== undefined) updates.priority = patch.priority;
  if (patch.clientId !== undefined) updates.clientId = patch.clientId || null;
  const specialLabelIds = validSpecialLabelIds(patch.specialLabelIds);
  if (!specialLabelIds) return { ok: false, error: "A tarefa aceita apenas etiquetas de Situação especial." };

  db.transaction((tx) => {
    tx.update(tasks).set(updates).where(eq(tasks.id, id)).run();
    if (patch.specialLabelIds !== undefined) {
      tx.delete(taskLabels).where(eq(taskLabels.taskId, id)).run();
      if (specialLabelIds.length > 0) {
        tx.insert(taskLabels)
          .values(specialLabelIds.map((labelId) => ({ taskId: id, labelId })))
          .run();
      }
    }
  });
  refresh();
  return { ok: true, data: undefined };
}

/**
 * Move a tarefa entre colunas.
 *
 * Diferente do funil de clientes, aqui NÃO gravamos transição: tarefa é
 * organização pessoal do Alex, não etapa de cliente, e não alimenta métrica
 * de funil. Medir produtividade pessoal não foi pedido e não passaria no
 * Teste do Engenheiro sem um problema declarado.
 */
export async function moveTaskAction(input: {
  taskId: string;
  toColumnId: string;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult> {
  const neighbours = db
    .select({ id: tasks.id, position: tasks.position })
    .from(tasks)
    .where(eq(tasks.columnId, input.toColumnId))
    .all();

  const positionOf = (id: string | null | undefined) =>
    id ? (neighbours.find((n) => n.id === id)?.position ?? null) : null;

  db.update(tasks)
    .set({
      columnId: input.toColumnId,
      position: positionBetween(positionOf(input.beforeId), positionOf(input.afterId)),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, input.taskId))
    .run();

  refresh();
  return { ok: true, data: undefined };
}

export async function toggleTaskDoneAction(id: string): Promise<ActionResult<{ done: boolean }>> {
  const task = db.select({ doneAt: tasks.doneAt }).from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const doneAt = task.doneAt ? null : new Date();
  db.update(tasks).set({ doneAt, updatedAt: new Date() }).where(eq(tasks.id, id)).run();

  refresh();
  return { ok: true, data: { done: doneAt != null } };
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  db.delete(tasks).where(eq(tasks.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

/* --------------------------------------------------- colunas das tarefas */

export async function createTaskColumnAction(input: {
  name: string;
  accent?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "A coluna precisa de um nome." };

  const all = db.select({ position: taskColumns.position }).from(taskColumns).all();
  const position = all.length === 0 ? 1000 : Math.max(...all.map((c) => c.position)) + 1000;

  const id = randomUUID();
  db.insert(taskColumns)
    .values({ id, name, position, accent: input.accent ?? "#64748B" })
    .run();

  refresh();
  return { ok: true, data: { id } };
}

export async function updateTaskColumnAction(
  id: string,
  patch: { name?: string; accent?: string | null },
): Promise<ActionResult> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "O nome da coluna não pode ficar vazio." };
    updates.name = name;
  }
  if (patch.accent !== undefined) updates.accent = patch.accent;

  db.update(taskColumns).set(updates).where(eq(taskColumns.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

export async function reorderTaskColumnAction(input: {
  columnId: string;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult> {
  const all = db
    .select({ id: taskColumns.id, position: taskColumns.position })
    .from(taskColumns)
    .all();
  const positionOf = (id: string | null | undefined) =>
    id ? (all.find((c) => c.id === id)?.position ?? null) : null;

  db.update(taskColumns)
    .set({
      position: positionBetween(positionOf(input.beforeId), positionOf(input.afterId)),
      updatedAt: new Date(),
    })
    .where(eq(taskColumns.id, input.columnId))
    .run();

  refresh();
  return { ok: true, data: undefined };
}

export async function deleteTaskColumnAction(input: {
  columnId: string;
  moveTasksToColumnId?: string | null;
}): Promise<ActionResult<{ movedTasks: number }>> {
  const remaining = db
    .select({ id: taskColumns.id })
    .from(taskColumns)
    .where(ne(taskColumns.id, input.columnId))
    .all();
  if (remaining.length === 0) {
    return { ok: false, error: "Não dá para excluir a única coluna." };
  }

  const affected = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.columnId, input.columnId))
    .all();

  if (affected.length > 0 && !input.moveTasksToColumnId) {
    return {
      ok: false,
      error: `Esta coluna tem ${affected.length} tarefa(s). Escolha para onde elas vão.`,
    };
  }

  db.transaction((tx) => {
    if (input.moveTasksToColumnId) {
      tx.update(tasks)
        .set({ columnId: input.moveTasksToColumnId, updatedAt: new Date() })
        .where(eq(tasks.columnId, input.columnId))
        .run();
    }
    tx.delete(taskColumns).where(eq(taskColumns.id, input.columnId)).run();
  });

  refresh();
  return { ok: true, data: { movedTasks: affected.length } };
}
