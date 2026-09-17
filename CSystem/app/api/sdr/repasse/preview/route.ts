import { NextResponse } from "next/server";
import { parseRepasse } from "@/lib/sdr-parser";

export const dynamic = "force-dynamic";

/**
 * Faz o parse do bloco sem gravar nada.
 *
 * Serve para o n8n (ou o Alex) conferir como o repasse será interpretado antes
 * de mandar de verdade. Não exige token porque não toca no banco e não expõe
 * nenhum dado que já não estivesse no corpo da requisição.
 */
export async function POST(request: Request) {
  let raw: string;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { raw?: string };
      raw = body.raw ?? "";
    } else {
      raw = await request.text();
    }
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: 'Envie o bloco em "raw".' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, parsed: parseRepasse(raw) });
}
