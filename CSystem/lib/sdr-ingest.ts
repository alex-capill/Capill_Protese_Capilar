import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clientLabels, clients, events, labels, lists, sdrInbox } from "@/db/schema";
import { CIDADES_PRESENCIAIS } from "@/db/seed-data";
import { moveClient } from "./transitions";
import { parseRepasse, repasseToDescription, type ParsedRepasse } from "./sdr-parser";
import { temperatureFromSdrConfidence } from "./temperature";

/**
 * Recepção de um repasse do Agente SDR.
 *
 * Espelha o que a automação do n8n faz hoje no Trello, com as mesmas regras:
 *
 *  - Deduplicação POR TELEFONE, para respeitar a Regra 1 (card único por cliente).
 *    Cliente que já existe é atualizado e movido, nunca duplicado.
 *  - Só QUALIFICADO entra no funil. NÃO QUALIFICADO e INDEFINIDO ficam só no
 *    registro de entrada — é exatamente o comportamento documentado em
 *    SDR/AGENTS.md, e não inventamos triagem nova para o Alex fazer.
 *  - AGENDOU vindo do SDR é recusado e vira OUTRO: o SDR não agenda.
 */

export type IngestResult = {
  inboxId: string;
  clientId: string | null;
  created: boolean;
  moved: boolean;
  classification: string | null;
  agendouRejeitado: boolean;
  camposAusentes: string[];
  warnings: string[];
};

function deaccent(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Modalidade a partir da cidade, pela lista literal do SDR/AGENTS.md.
 *
 * Isto fecha uma lacuna real: hoje o SDR decide presencial vs. online na
 * conversa, mas a modalidade não viaja no bloco ===REPASSE=== e nunca chega
 * ao card. Aqui ela é derivada e registrada.
 */
export function modalityFromCity(city: string | null): "studio" | "online" | null {
  if (!city) return null;
  const normalized = deaccent(city).toLowerCase().trim();
  const presencial = CIDADES_PRESENCIAIS.some((candidate) =>
    normalized.includes(deaccent(candidate).toLowerCase()),
  );
  return presencial ? "studio" : "online";
}

/** Mapeia o texto de ORIGEM do repasse para uma etiqueta existente. */
function originLabelName(origin: string | null): string | null {
  if (!origin) return null;
  const value = deaccent(origin).toLowerCase();
  if (value.includes("anuncio") || value.includes("ads") || value.includes("trafego")) {
    if (value.includes("google")) return "Google Anúncio";
    return "Instagram Anúncio";
  }
  if (value.includes("organico") || value.includes("instagram")) return "Instagram Orgânico";
  if (value.includes("google")) return "Google Pesquisa";
  if (value.includes("indicac")) return "Indicação";
  if (value.includes("antigo") || value.includes("cliente")) return "Cliente Antigo";
  if (value.includes("nao identificada") || value.includes("nao identificado")) return null;
  return "Outros";
}

function applyLabelByName(clientId: string, name: string | null) {
  if (!name) return;
  const label = db.select({ id: labels.id }).from(labels).where(eq(labels.name, name)).get();
  if (!label) return;

  const already = db
    .select()
    .from(clientLabels)
    .where(and(eq(clientLabels.clientId, clientId), eq(clientLabels.labelId, label.id)))
    .get();
  if (!already) db.insert(clientLabels).values({ clientId, labelId: label.id }).run();
}

/** A lista que recebe leads qualificados. Segue o estágio, não o nome — a lista pode ser renomeada. */
function qualifiedList() {
  return (
    db.select().from(lists).where(eq(lists.countsAsStage, "qualificado")).get() ??
    db.select().from(lists).where(eq(lists.name, "LEAD QUALIFICADO")).get() ??
    null
  );
}

export function ingestRepasse(input: {
  raw: string;
  source?: "webhook" | "manual";
}): IngestResult {
  const parsed = parseRepasse(input.raw);
  const warnings: string[] = [];

  const inboxId = randomUUID();
  db.insert(sdrInbox)
    .values({
      id: inboxId,
      rawText: input.raw,
      parsedJson: JSON.stringify(parsed),
      phone: parsed.phoneNormalized,
      name: parsed.name,
      classification: parsed.classification,
      confidence: parsed.confidence,
      source: input.source ?? "webhook",
    })
    .run();

  if (parsed.agendouRejeitado) {
    warnings.push(
      "O repasse trazia AGENDOU. O SDR não agenda — o evento foi convertido para OUTRO.",
    );
  }
  if (!parsed.classification) {
    warnings.push("CLASSIFICAÇÃO ausente ou não reconhecida: o repasse não entrou no funil.");
  }

  // Só QUALIFICADO entra no funil — igual à automação atual do n8n.
  if (parsed.classification !== "QUALIFICADO") {
    return {
      inboxId,
      clientId: null,
      created: false,
      moved: false,
      classification: parsed.classification,
      agendouRejeitado: parsed.agendouRejeitado,
      camposAusentes: parsed.camposAusentes,
      warnings,
    };
  }

  const target = qualifiedList();
  if (!target) {
    warnings.push(
      "Nenhuma lista marcada como estágio 'qualificado'. Configure isso em Configurações.",
    );
    return {
      inboxId,
      clientId: null,
      created: false,
      moved: false,
      classification: parsed.classification,
      agendouRejeitado: parsed.agendouRejeitado,
      camposAusentes: parsed.camposAusentes,
      warnings,
    };
  }

  const existing = parsed.phoneNormalized
    ? db
        .select()
        .from(clients)
        .where(eq(clients.phoneNormalized, parsed.phoneNormalized))
        .get()
    : undefined;

  if (!parsed.phoneNormalized) {
    warnings.push(
      "Repasse sem telefone reconhecível: não foi possível verificar duplicidade pela Regra 1.",
    );
  }

  const clientId = existing ? existing.id : randomUUID();
  const created = !existing;
  const modality = modalityFromCity(parsed.city);
  const sdrTemperature = temperatureFromSdrConfidence(parsed.confidence);
  const description = repasseToDescription(parsed);
  const now = new Date();

  if (created) {
    const siblings = db
      .select({ position: clients.position })
      .from(clients)
      .where(eq(clients.listId, target.id))
      .all();

    db.insert(clients)
      .values({
        id: clientId,
        name: parsed.name ?? "Lead sem nome",
        listId: target.id,
        position:
          siblings.length === 0 ? 1000 : Math.max(...siblings.map((s) => s.position)) + 1000,
        phoneNormalized: parsed.phoneNormalized,
        phoneRaw: parsed.phoneRaw,
        city: parsed.city,
        description,
        modality,
        sdrClassification: parsed.classification,
        sdrConfidence: parsed.confidence,
        temperature: sdrTemperature,
      })
      .run();

    // Transição de entrada: o lead qualificado já conta na métrica do período.
    moveClient({
      clientId,
      toListId: target.id,
      source: "sdr",
      at: now,
      entry: true,
    });
  } else {
    db.update(clients)
      .set({
        name: parsed.name ?? existing.name,
        city: parsed.city ?? existing.city,
        modality: modality ?? existing.modality,
        // A primeira classificação do SDR preenche o campo apenas enquanto o Alex
        // ainda não fez uma classificação manual.
        temperature: existing.temperature ?? sdrTemperature,
        // A descrição anterior é preservada: o repasse novo entra depois dela,
        // porque jogar fora contexto de um atendimento anterior seria perda de dado.
        description: existing.description
          ? `${existing.description}\n\n———\n\nNOVO REPASSE DO SDR\n\n${description}`
          : description,
        sdrClassification: parsed.classification,
        sdrConfidence: parsed.confidence,
        status: existing.status === "lost" ? "active" : existing.status,
        updatedAt: now,
      })
      .where(eq(clients.id, clientId))
      .run();

    if (existing.listId !== target.id) {
      moveClient({ clientId, toListId: target.id, source: "sdr", at: now });
    } else {
      warnings.push("O cliente já estava em LEAD QUALIFICADO: card atualizado, sem mover.");
    }
  }

  applyLabelByName(clientId, originLabelName(parsed.origin));
  applyLabelByName(clientId, modality === "online" ? "Avaliação Online" : "Avaliação Studio");

  if (parsed.comentarioKeyword || parsed.comentarioTexto) {
    db.insert(events)
      .values({
        id: randomUUID(),
        clientId,
        keyword: parsed.comentarioKeyword,
        body:
          parsed.comentarioTexto ??
          `${parsed.comentarioKeyword ?? "OUTRO"}: repasse recebido do SDR`,
        author: "sdr",
      })
      .run();
  }

  db.update(sdrInbox).set({ clientId }).where(eq(sdrInbox.id, inboxId)).run();

  return {
    inboxId,
    clientId,
    created,
    moved: true,
    classification: parsed.classification,
    agendouRejeitado: parsed.agendouRejeitado,
    camposAusentes: parsed.camposAusentes,
    warnings,
  };
}

export type { ParsedRepasse };
