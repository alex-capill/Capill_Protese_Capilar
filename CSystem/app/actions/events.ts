"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, clients, events } from "@/db/schema";
import {
  findExtraKeywords,
  formatFollowup,
  isKeyword,
  KEYWORD_INFO,
  MOTIVO_NAO_IDENTIFICADO,
  type Keyword,
} from "@/lib/keywords";
import { attachEventToTransition } from "@/lib/transitions";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Registra um comentário no card, no padrão do
 * PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md.
 *
 * O que este action GARANTE, e por isso ele existe em vez de um campo de texto solto:
 *  - a palavra-chave é escolhida numa lista fechada, então não surgem variações
 *    inventadas ("AGENDADO" quando o padrão é "AGENDOU");
 *  - um comentário = um evento: dois eventos no mesmo texto são recusados;
 *  - PENSANDO e PERDIDO sem evidência ficam com "motivo não identificado",
 *    nunca com um motivo chutado pelo sistema.
 */
export async function addEventAction(input: {
  clientId: string;
  keyword: string | null;
  body: string;
  reason?: string | null;
  /** Quando vem de um arrasto, amarra o comentário àquela transição. */
  transitionId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const body = input.body.trim();
  const keyword =
    input.keyword && isKeyword(input.keyword) ? (input.keyword as Keyword) : null;

  if (input.keyword && !keyword) {
    return { ok: false, error: `"${input.keyword}" não é uma palavra-chave do padrão.` };
  }
  if (!keyword && !body) {
    return { ok: false, error: "Escreva alguma coisa ou escolha uma palavra-chave." };
  }

  // Regra: um comentário = um evento.
  const extras = findExtraKeywords(body, keyword);
  if (extras.length > 0) {
    return {
      ok: false,
      error: `Um comentário = um evento. Este texto também contém ${extras.join(", ")}. Registre em comentários separados.`,
    };
  }

  // Motivo só é registrado para as palavras-chave que o preveem.
  let reason: string | null = null;
  if (keyword && KEYWORD_INFO[keyword].pedeMotivo) {
    reason = input.reason?.trim() || MOTIVO_NAO_IDENTIFICADO;
  }

  if (input.transitionId) {
    const id = attachEventToTransition({
      transitionId: input.transitionId,
      clientId: input.clientId,
      keyword,
      body,
      reason,
    });
    refresh();
    return { ok: true, data: { id } };
  }

  const id = randomUUID();
  db.insert(events)
    .values({ id, clientId: input.clientId, keyword, body, reason, author: "alex" })
    .run();

  refresh();
  return { ok: true, data: { id } };
}

/**
 * Registra o follow-up no formato exato da seção 5 do documento:
 *   FOLLOW-UP: motivo=[...] | evento=[...] | data=[...]
 * e alimenta `nextFollowupAt` para o card aparecer na fila da agenda.
 */
export async function addFollowupAction(input: {
  clientId: string;
  motivo: string;
  evento: string;
  data: string;
  /** Data normalizada para a fila; opcional porque o cliente pode dizer "depois do carnaval". */
  dataISO?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const motivo = input.motivo.trim();
  const evento = input.evento.trim();
  const data = input.data.trim();

  if (!motivo || !evento || !data) {
    return {
      ok: false,
      error: "Follow-up precisa dos três campos: motivo, evento e data.",
    };
  }

  const id = randomUUID();
  db.transaction((tx) => {
    tx.insert(events)
      .values({
        id,
        clientId: input.clientId,
        keyword: null,
        body: formatFollowup(motivo, evento, data),
        followupMotivo: motivo,
        followupEvento: evento,
        followupData: data,
        author: "alex",
      })
      .run();

    if (input.dataISO) {
      tx.update(clients)
        .set({ nextFollowupAt: new Date(input.dataISO), updatedAt: new Date() })
        .where(eq(clients.id, input.clientId))
        .run();
    }
  });

  refresh();
  return { ok: true, data: { id } };
}

/**
 * Confirma o balão que aparece depois do arrasto.
 *
 * Importante: a métrica JÁ foi gravada quando o card foi solto. Isto aqui só
 * acrescenta o registro qualitativo. Ignorar o balão não perde nenhum número.
 */
export async function confirmTransitionEventAction(input: {
  transitionId: string;
  clientId: string;
  keyword: string;
  body?: string;
  reason?: string | null;
  /** Para AVALIAÇÃO AGENDADA: cria o compromisso na agenda. */
  scheduledAtISO?: string | null;
}): Promise<ActionResult> {
  if (!isKeyword(input.keyword)) {
    return { ok: false, error: `"${input.keyword}" não é uma palavra-chave do padrão.` };
  }
  const keyword = input.keyword as Keyword;

  const reason = KEYWORD_INFO[keyword].pedeMotivo
    ? input.reason?.trim() || MOTIVO_NAO_IDENTIFICADO
    : null;

  attachEventToTransition({
    transitionId: input.transitionId,
    clientId: input.clientId,
    keyword,
    body: input.body?.trim() || "",
    reason,
  });

  if (input.scheduledAtISO) {
    const client = db
      .select({ name: clients.name, modality: clients.modality })
      .from(clients)
      .where(eq(clients.id, input.clientId))
      .get();

    const startsAt = new Date(input.scheduledAtISO);
    db.insert(appointments)
      .values({
        id: randomUUID(),
        clientId: input.clientId,
        title: `Avaliação — ${client?.name ?? "cliente"}`,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60_000),
        kind: "avaliacao",
        modality: client?.modality ?? null,
        status: "agendada",
      })
      .run();

    db.update(clients)
      .set({ evaluationAt: startsAt, updatedAt: new Date() })
      .where(eq(clients.id, input.clientId))
      .run();
  }

  refresh();
  return { ok: true, data: undefined };
}

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  db.delete(events).where(eq(events.id, eventId)).run();
  refresh();
  return { ok: true, data: undefined };
}
