"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { labels } from "@/db/schema";
import { parseHex } from "@/lib/colors";
import { positionBetween } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * CRUD de etiquetas.
 *
 * Os 4 grupos da Regra 2 do Manual (ORIGEM, MODALIDADE, PAGAMENTO,
 * SITUACAO_ESPECIAL) vêm no seed, mas o grupo é texto livre: o Alex pode criar
 * um grupo novo só digitando o nome. Os grupos são independentes entre si — um
 * card pode ter etiqueta de vários grupos ao mesmo tempo.
 */

export async function createLabelAction(input: {
  name: string;
  group: string;
  colorHex: string;
  scope?: "client" | "task" | "both";
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "A etiqueta precisa de um nome." };

  const colorHex = parseHex(input.colorHex);
  if (!colorHex) {
    return { ok: false, error: `"${input.colorHex}" não é uma cor válida. Use #RRGGBB.` };
  }

  const group = input.group.trim().toUpperCase() || "CUSTOM";

  const existing = db.select({ name: labels.name, position: labels.position }).from(labels).all();
  if (existing.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Já existe uma etiqueta chamada "${name}".` };
  }

  const position =
    existing.length === 0 ? 1000 : Math.max(...existing.map((l) => l.position)) + 1000;

  const id = randomUUID();
  db.insert(labels)
    .values({ id, name, group, colorHex, position, scope: input.scope ?? "both" })
    .run();

  refresh();
  return { ok: true, data: { id } };
}

export async function updateLabelAction(
  id: string,
  patch: { name?: string; group?: string; colorHex?: string; scope?: string },
): Promise<ActionResult> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "O nome da etiqueta não pode ficar vazio." };
    updates.name = name;
  }
  if (patch.group !== undefined) {
    updates.group = patch.group.trim().toUpperCase() || "CUSTOM";
  }
  if (patch.colorHex !== undefined) {
    const colorHex = parseHex(patch.colorHex);
    if (!colorHex) {
      return { ok: false, error: `"${patch.colorHex}" não é uma cor válida. Use #RRGGBB.` };
    }
    updates.colorHex = colorHex;
  }
  if (patch.scope !== undefined) updates.scope = patch.scope;

  db.update(labels).set(updates).where(eq(labels.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

export async function reorderLabelAction(input: {
  labelId: string;
  beforeId?: string | null;
  afterId?: string | null;
}): Promise<ActionResult> {
  const all = db.select({ id: labels.id, position: labels.position }).from(labels).all();
  const positionOf = (id: string | null | undefined) =>
    id ? (all.find((l) => l.id === id)?.position ?? null) : null;

  db.update(labels)
    .set({
      position: positionBetween(positionOf(input.beforeId), positionOf(input.afterId)),
      updatedAt: new Date(),
    })
    .where(eq(labels.id, input.labelId))
    .run();

  refresh();
  return { ok: true, data: undefined };
}

export async function archiveLabelAction(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  db.update(labels).set({ archived, updatedAt: new Date() }).where(eq(labels.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}

/** Excluir tira a etiqueta de todos os cards (cascade). Arquivar preserva. */
export async function deleteLabelAction(id: string): Promise<ActionResult> {
  db.delete(labels).where(eq(labels.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}
