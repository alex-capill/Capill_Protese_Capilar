"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clientLabels, clients, events, lists } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { moveClient, undoMove, type MoveResult } from "@/lib/transitions";
import { positionBetween } from "@/lib/utils";
import type { Keyword } from "@/lib/keywords";
import { MOTIVO_NAO_IDENTIFICADO } from "@/lib/keywords";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- criação */

/**
 * Cria um cliente.
 *
 * REGRA 1 (card único por cliente): se o telefone já existir, NÃO criamos um
 * segundo registro. Devolvemos o conflito para a interface oferecer abrir o
 * cliente que já existe.
 */
export async function createClientAction(input: {
  name: string;
  listId: string;
  phone?: string | null;
  city?: string | null;
  description?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "O nome do cliente é obrigatório." };

  const phoneNormalized = normalizePhone(input.phone);

  if (phoneNormalized) {
    const existing = db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.phoneNormalized, phoneNormalized))
      .get();
    if (existing) {
      return {
        ok: false,
        error: `Já existe um card para este telefone: ${existing.name}. A Regra 1 diz que cada cliente tem um único card.`,
        conflictClientId: existing.id,
      };
    }
  }

  const list = db.select().from(lists).where(eq(lists.id, input.listId)).get();
  if (!list) return { ok: false, error: "Lista não encontrada." };

  const siblings = db
    .select({ position: clients.position })
    .from(clients)
    .where(eq(clients.listId, input.listId))
    .all();
  const position =
    siblings.length === 0 ? 1000 : Math.max(...siblings.map((s) => s.position)) + 1000;

  const id = randomUUID();
  db.insert(clients)
    .values({
      id,
      name,
      listId: input.listId,
      position,
      phoneNormalized,
      phoneRaw: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      description: input.description?.trim() || null,
    })
    .run();

  refresh();
  return { ok: true, data: { id } };
}

/* ---------------------------------------------------------------- edição */

export async function updateClientAction(
  id: string,
  patch: {
    name?: string;
    phone?: string | null;
    city?: string | null;
    description?: string | null;
    modality?: string | null;
    valueCents?: number | null;
    evaluationAt?: string | null;
    nextFollowupAt?: string | null;
  },
): Promise<ActionResult> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "O nome não pode ficar vazio." };
    updates.name = name;
  }

  if (patch.phone !== undefined) {
    const phoneNormalized = normalizePhone(patch.phone);
    if (phoneNormalized) {
      const clash = db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(and(eq(clients.phoneNormalized, phoneNormalized), ne(clients.id, id)))
        .get();
      if (clash) {
        return {
          ok: false,
          error: `Este telefone já pertence ao card de ${clash.name}.`,
          conflictClientId: clash.id,
        };
      }
    }
    updates.phoneNormalized = phoneNormalized;
    updates.phoneRaw = patch.phone?.trim() || null;
  }

  if (patch.city !== undefined) updates.city = patch.city?.trim() || null;
  if (patch.description !== undefined) {
    updates.description = patch.description?.trim() || null;
  }
  if (patch.modality !== undefined) updates.modality = patch.modality || null;
  if (patch.valueCents !== undefined) updates.valueCents = patch.valueCents;
  if (patch.evaluationAt !== undefined) {
    updates.evaluationAt = patch.evaluationAt ? new Date(patch.evaluationAt) : null;
  }
  if (patch.nextFollowupAt !== undefined) {
    updates.nextFollowupAt = patch.nextFollowupAt ? new Date(patch.nextFollowupAt) : null;
  }

  db.update(clients).set(updates).where(eq(clients.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

/* ------------------------------------------------------------- movimento */

/**
 * Move um card. É AQUI que a métrica nasce.
 *
 * A interface manda os vizinhos do ponto onde soltou (`beforeId`/`afterId`) e o
 * servidor calcula a posição fracionária, para não reescrever a coluna inteira.
 */
export async function moveClientAction(input: {
  clientId: string;
  toListId: string;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult<MoveResult>> {
  const neighbours = db
    .select({ id: clients.id, position: clients.position })
    .from(clients)
    .where(eq(clients.listId, input.toListId))
    .all();

  const positionOf = (id: string | null | undefined) =>
    id ? (neighbours.find((n) => n.id === id)?.position ?? null) : null;

  const position = positionBetween(positionOf(input.beforeId), positionOf(input.afterId));

  try {
    const result = moveClient({
      clientId: input.clientId,
      toListId: input.toListId,
      position,
      source: "drag",
    });
    refresh();
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível mover o card.",
    };
  }
}

/** Desfazer o último arrasto: volta o card e apaga a transição e o comentário. */
export async function undoMoveAction(transitionId: string): Promise<ActionResult> {
  const done = undoMove(transitionId);
  refresh();
  return done
    ? { ok: true, data: undefined }
    : { ok: false, error: "Não foi possível desfazer: a lista de origem não existe mais." };
}

/* -------------------------------------------------------------- etiquetas */

export async function toggleClientLabelAction(
  clientId: string,
  labelId: string,
): Promise<ActionResult<{ applied: boolean }>> {
  const existing = db
    .select()
    .from(clientLabels)
    .where(and(eq(clientLabels.clientId, clientId), eq(clientLabels.labelId, labelId)))
    .get();

  if (existing) {
    db.delete(clientLabels)
      .where(and(eq(clientLabels.clientId, clientId), eq(clientLabels.labelId, labelId)))
      .run();
    refresh();
    return { ok: true, data: { applied: false } };
  }

  db.insert(clientLabels).values({ clientId, labelId }).run();
  refresh();
  return { ok: true, data: { applied: true } };
}

/* ----------------------------------------------------------------- perda */

/**
 * Marca o cliente como perdido.
 *
 * Ação explícita e separada do arrasto: PERDIDO "sai do funil ativo", não é um
 * destino de lista. O motivo é obrigatório na estrutura, mas o padrão é
 * "motivo não identificado" — o sistema NUNCA adivinha o motivo real.
 */
export async function markClientLostAction(input: {
  clientId: string;
  reason?: string | null;
  note?: string | null;
}): Promise<ActionResult> {
  const reason = input.reason?.trim() || MOTIVO_NAO_IDENTIFICADO;
  const now = new Date();

  db.transaction((tx) => {
    tx.update(clients)
      .set({ status: "lost", lostReason: reason, lostAt: now, updatedAt: now })
      .where(eq(clients.id, input.clientId))
      .run();

    tx.insert(events)
      .values({
        id: randomUUID(),
        clientId: input.clientId,
        keyword: "PERDIDO" satisfies Keyword,
        body: input.note?.trim() || `PERDIDO: ${reason}`,
        reason,
        author: "alex",
      })
      .run();
  });

  refresh();
  return { ok: true, data: undefined };
}

export async function reactivateClientAction(clientId: string): Promise<ActionResult> {
  db.update(clients)
    .set({ status: "active", lostReason: null, lostAt: null, updatedAt: new Date() })
    .where(eq(clients.id, clientId))
    .run();
  refresh();
  return { ok: true, data: undefined };
}

export async function archiveClientAction(clientId: string): Promise<ActionResult> {
  db.update(clients)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(clients.id, clientId))
    .run();
  refresh();
  return { ok: true, data: undefined };
}

/**
 * Exclusão definitiva. Leva junto eventos e transições (cascade), então apaga
 * histórico de métrica — por isso a interface pede confirmação digitada.
 */
export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  db.delete(clients).where(eq(clients.id, clientId)).run();
  refresh();
  return { ok: true, data: undefined };
}
