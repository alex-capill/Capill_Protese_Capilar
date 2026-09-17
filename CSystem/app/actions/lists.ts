"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clients, lists } from "@/db/schema";
import { isKeyword, isStage } from "@/lib/keywords";
import { positionBetween, slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

/* ----------------------------------------------------------------- criar */

export async function createListAction(input: {
  name: string;
  color?: string | null;
  kind?: "funnel" | "support";
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "A lista precisa de um nome." };

  const all = db.select({ position: lists.position }).from(lists).all();
  const position = all.length === 0 ? 1000 : Math.max(...all.map((l) => l.position)) + 1000;

  const id = randomUUID();
  db.insert(lists)
    .values({
      id,
      name,
      slug: slugify(name),
      position,
      kind: input.kind ?? "funnel",
      color: input.color ?? "#64748B",
    })
    .run();

  refresh();
  return { ok: true, data: { id } };
}

/* ---------------------------------------------------------------- editar */

/**
 * Edita uma lista.
 *
 * `defaultKeyword` e `countsAsStage` são configuração e não código de propósito:
 * o Alex pode criar listas novas, e um mapa fixo no código quebraria na primeira.
 */
export async function updateListAction(
  id: string,
  patch: {
    name?: string;
    color?: string | null;
    kind?: "funnel" | "support";
    defaultKeyword?: string | null;
    countsAsStage?: string | null;
    keywordChoices?: string[] | null;
  },
): Promise<ActionResult> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "O nome da lista não pode ficar vazio." };
    updates.name = name;
    updates.slug = slugify(name);
  }
  if (patch.color !== undefined) updates.color = patch.color;
  if (patch.kind !== undefined) updates.kind = patch.kind;

  if (patch.defaultKeyword !== undefined) {
    if (patch.defaultKeyword && !isKeyword(patch.defaultKeyword)) {
      return { ok: false, error: `"${patch.defaultKeyword}" não é uma palavra-chave do padrão.` };
    }
    updates.defaultKeyword = patch.defaultKeyword || null;
  }

  if (patch.countsAsStage !== undefined) {
    if (patch.countsAsStage && !isStage(patch.countsAsStage)) {
      return { ok: false, error: `"${patch.countsAsStage}" não é um estágio válido.` };
    }
    updates.countsAsStage = patch.countsAsStage || null;
  }

  if (patch.keywordChoices !== undefined) {
    const valid = (patch.keywordChoices ?? []).filter(isKeyword);
    updates.keywordChoices = valid.length >= 2 ? JSON.stringify(valid) : null;
  }

  db.update(lists).set(updates).where(eq(lists.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

/* -------------------------------------------------------------- reordenar */

export async function reorderListAction(input: {
  listId: string;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult> {
  const all = db.select({ id: lists.id, position: lists.position }).from(lists).all();
  const positionOf = (id: string | null | undefined) =>
    id ? (all.find((l) => l.id === id)?.position ?? null) : null;

  const position = positionBetween(positionOf(input.beforeId), positionOf(input.afterId));

  db.update(lists)
    .set({ position, updatedAt: new Date() })
    .where(eq(lists.id, input.listId))
    .run();

  refresh();
  return { ok: true, data: undefined };
}

/* ---------------------------------------------------------------- remover */

export async function archiveListAction(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  db.update(lists).set({ archived, updatedAt: new Date() }).where(eq(lists.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

/**
 * Exclui uma lista.
 *
 * Duas garantias:
 *  1. Os cards não somem — vão para `moveCardsToListId`, informado pela interface.
 *  2. O histórico de métrica NÃO é apagado. `list_transitions` guarda um snapshot
 *     do nome e do estágio, então os números de meses anteriores continuam certos
 *     mesmo depois que a lista deixa de existir.
 */
export async function deleteListAction(input: {
  listId: string;
  moveCardsToListId?: string | null;
}): Promise<ActionResult<{ movedCards: number }>> {
  const list = db.select().from(lists).where(eq(lists.id, input.listId)).get();
  if (!list) return { ok: false, error: "Lista não encontrada." };

  const remaining = db.select({ id: lists.id }).from(lists).where(ne(lists.id, input.listId)).all();
  if (remaining.length === 0) {
    return { ok: false, error: "Não dá para excluir a única lista do funil." };
  }

  const cards = db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.listId, input.listId))
    .all();

  if (cards.length > 0 && !input.moveCardsToListId) {
    return {
      ok: false,
      error: `Esta lista tem ${cards.length} card(s). Escolha para qual lista eles devem ir.`,
    };
  }

  const destination = input.moveCardsToListId
    ? db.select().from(lists).where(eq(lists.id, input.moveCardsToListId)).get()
    : null;

  if (cards.length > 0 && !destination) {
    return { ok: false, error: "Lista de destino não encontrada." };
  }

  db.transaction((tx) => {
    if (destination) {
      tx.update(clients)
        .set({ listId: destination.id, updatedAt: new Date() })
        .where(eq(clients.listId, input.listId))
        .run();
    }
    // As transições NÃO são apagadas: `from_list_id`/`to_list_id` viram ponteiros
    // órfãos de propósito, e os snapshots de nome e estágio seguram a métrica.
    tx.delete(lists).where(eq(lists.id, input.listId)).run();
  });

  refresh();
  return { ok: true, data: { movedCards: cards.length } };
}
