"use server";

import { revalidatePath } from "next/cache";
import { ingestRepasse } from "@/lib/sdr-ingest";
import { parseRepasse } from "@/lib/sdr-parser";
import type { ActionResult } from "@/lib/action-result";

/**
 * Colagem manual de um bloco ===REPASSE===.
 *
 * Existe por dois motivos: testar o parse sem depender do n8n, e receber o
 * repasse enquanto o app roda local (onde o n8n da nuvem não alcança o webhook).
 */
export async function ingestRepasseAction(
  raw: string,
): Promise<ActionResult<{ clientId: string | null; warnings: string[]; created: boolean }>> {
  if (!raw.trim()) return { ok: false, error: "Cole o bloco do repasse." };

  try {
    const result = ingestRepasse({ raw, source: "manual" });
    revalidatePath("/", "layout");
    return {
      ok: true,
      data: {
        clientId: result.clientId,
        warnings: result.warnings,
        created: result.created,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao processar o repasse.",
    };
  }
}

/** Parse sem gravar — a prévia da tela de colagem. */
export async function previewRepasseAction(raw: string) {
  return parseRepasse(raw);
}
