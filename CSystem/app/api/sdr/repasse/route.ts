import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestRepasse } from "@/lib/sdr-ingest";

export const dynamic = "force-dynamic";

/**
 * Webhook do Agente SDR.
 *
 * O n8n chama este endpoint no lugar do nó que criava o card no Trello.
 * Autenticação por segredo compartilhado no header `x-csystem-token`.
 *
 *   POST /api/sdr/repasse
 *   x-csystem-token: <CSYSTEM_WEBHOOK_TOKEN>
 *   { "raw": "===REPASSE===\nLEAD: João\nTELEFONE: 84999998888\n..." }
 *
 * Responde com o id do cliente e o link direto, para o n8n incluir na mensagem
 * que já manda no WhatsApp do Alex.
 */

function unauthorized() {
  return NextResponse.json({ error: "Token inválido." }, { status: 401 });
}

export async function POST(request: Request) {
  const expected = process.env.CSYSTEM_WEBHOOK_TOKEN;

  if (!expected || expected === "troque-este-valor-por-um-segredo-longo") {
    return NextResponse.json(
      { error: "CSYSTEM_WEBHOOK_TOKEN não configurado no servidor." },
      { status: 500 },
    );
  }

  const provided =
    request.headers.get("x-csystem-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (provided !== expected) return unauthorized();

  let raw: string | null = null;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      // Aceita { raw }, { text }, { message } ou o bloco na raiz como string.
      raw =
        typeof body.raw === "string"
          ? body.raw
          : typeof body.text === "string"
            ? body.text
            : typeof body.message === "string"
              ? body.message
              : null;
    } else {
      raw = await request.text();
    }
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!raw || !raw.trim()) {
    return NextResponse.json(
      { error: 'Envie o bloco do repasse em "raw".' },
      { status: 400 },
    );
  }

  try {
    const result = ingestRepasse({ raw, source: "webhook" });
    revalidatePath("/", "layout");

    const base = process.env.CSYSTEM_PUBLIC_URL ?? "http://localhost:3000";

    return NextResponse.json({
      ok: true,
      clientId: result.clientId,
      url: result.clientId ? `${base}/clientes/${result.clientId}` : null,
      created: result.created,
      classification: result.classification,
      enteredFunnel: result.moved,
      agendouRejeitado: result.agendouRejeitado,
      camposAusentes: result.camposAusentes,
      warnings: result.warnings,
    });
  } catch (error) {
    // O repasse bruto já foi salvo em sdr_inbox antes de qualquer falha de
    // processamento, então nenhum lead se perde por causa de um erro aqui.
    console.error("[csystem] falha ao processar repasse:", error);
    return NextResponse.json(
      {
        error: "Falha ao processar o repasse.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
