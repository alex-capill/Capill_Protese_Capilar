"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Status derivado do valor pago — não é campo digitado.
 *
 * Deixar o status como escolha manual criaria a possibilidade de "Pagamento Ok"
 * com saldo devedor, que é justamente o erro que a etiqueta de PAGAMENTO deveria
 * evitar. Aqui o status é consequência aritmética do que foi pago.
 */
function statusFor(totalCents: number, paidCents: number): "aguardando" | "parcial" | "ok" {
  if (paidCents <= 0) return "aguardando";
  if (paidCents >= totalCents) return "ok";
  return "parcial";
}

export async function upsertPaymentAction(input: {
  id?: string | null;
  clientId: string;
  totalCents: number;
  paidCents: number;
  method?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  if (input.totalCents < 0 || input.paidCents < 0) {
    return { ok: false, error: "Valores não podem ser negativos." };
  }
  if (input.paidCents > input.totalCents) {
    return {
      ok: false,
      error: "O valor pago é maior que o total. Confira antes de salvar.",
    };
  }

  const values = {
    clientId: input.clientId,
    totalCents: input.totalCents,
    paidCents: input.paidCents,
    method: input.method?.trim() || null,
    status: statusFor(input.totalCents, input.paidCents),
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    notes: input.notes?.trim() || null,
    updatedAt: new Date(),
  };

  if (input.id) {
    db.update(payments).set(values).where(eq(payments.id, input.id)).run();
    refresh();
    return { ok: true, data: { id: input.id } };
  }

  const id = randomUUID();
  db.insert(payments).values({ id, ...values }).run();
  refresh();
  return { ok: true, data: { id } };
}

export async function deletePaymentAction(id: string): Promise<ActionResult> {
  db.delete(payments).where(eq(payments.id, id)).run();
  refresh();
  return { ok: true, data: undefined };
}
