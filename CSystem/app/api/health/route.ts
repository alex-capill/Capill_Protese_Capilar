import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, lists } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Verificação rápida de que o app subiu e o banco responde. */
export async function GET() {
  try {
    const listCount = db.select({ total: sql<number>`count(*)` }).from(lists).get();
    const clientCount = db.select({ total: sql<number>`count(*)` }).from(clients).get();

    return NextResponse.json({
      ok: true,
      lists: listCount?.total ?? 0,
      clients: clientCount?.total ?? 0,
      webhookConfigured:
        !!process.env.CSYSTEM_WEBHOOK_TOKEN &&
        process.env.CSYSTEM_WEBHOOK_TOKEN !== "troque-este-valor-por-um-segredo-longo",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
