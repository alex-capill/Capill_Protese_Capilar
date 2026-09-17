import { and, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientLabels, clients, events, labels, listTransitions, lists } from "@/db/schema";
import {
  FUNNEL_STAGES,
  STAGE_LABEL,
  type FunnelStage,
  type Stage,
} from "./keywords";

/**
 * Agregações de funil.
 *
 * Tudo sai de `list_transitions` — o registro que o arrasto grava sozinho. Por
 * isso o número não depende de o Alex lembrar de comentar.
 *
 * Duas regras de honestidade, do PROTOCOLO_DE_VERDADE_E_EXTREMA_SINCERIDADE:
 *  - §13A: ausência de dado NÃO é dado negativo. Etapa sem nenhum evento devolve
 *    `null`, nunca 0%, e a interface mostra "sem dados".
 *  - §13: amostra pequena exige cautela. Abaixo de SMALL_SAMPLE a taxa vem
 *    marcada como `smallSample`, para a interface avisar em vez de concluir.
 */

export const SMALL_SAMPLE = 10;

export type Period = { start: Date; end: Date; label: string };

export function monthPeriod(reference = new Date()): Period {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return {
    start,
    end,
    label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  };
}

export function previousPeriod(period: Period): Period {
  const start = new Date(period.start);
  start.setMonth(start.getMonth() - 1);
  return { start, end: period.start, label: "período anterior" };
}

/**
 * Quantos CLIENTES DISTINTOS entraram em cada estágio no período.
 *
 * Distintos, e não número de transições: um cliente que vai e volta de
 * AVALIAÇÃO AGENDADA duas vezes é uma avaliação agendada, não duas.
 */
export function stageCounts(period: Period): Record<Stage, number> {
  const rows = db
    .select({
      stage: listTransitions.toStage,
      total: sql<number>`count(distinct ${listTransitions.clientId})`,
    })
    .from(listTransitions)
    .where(
      and(
        isNotNull(listTransitions.toStage),
        gte(listTransitions.movedAt, period.start),
        lt(listTransitions.movedAt, period.end),
      ),
    )
    .groupBy(listTransitions.toStage)
    .all();

  const counts = {} as Record<Stage, number>;
  for (const row of rows) {
    if (row.stage) counts[row.stage as Stage] = row.total;
  }
  return counts;
}

/**
 * "Fechou" tem duas origens legítimas: o card entrou numa lista marcada como
 * estágio `fechou`, OU existe um evento FECHOU no período (caso o Alex tenha
 * registrado o fechamento sem mover o card, ou movido para FOLLOW-UP, que é
 * ambígua por natureza). Contamos a UNIÃO de clientes distintos.
 */
export function closedClientCount(period: Period): number {
  const byStage = db
    .select({ clientId: listTransitions.clientId })
    .from(listTransitions)
    .where(
      and(
        eq(listTransitions.toStage, "fechou"),
        gte(listTransitions.movedAt, period.start),
        lt(listTransitions.movedAt, period.end),
      ),
    )
    .all();

  const byEvent = db
    .select({ clientId: events.clientId })
    .from(events)
    .where(
      and(
        eq(events.keyword, "FECHOU"),
        gte(events.createdAt, period.start),
        lt(events.createdAt, period.end),
      ),
    )
    .all();

  return new Set([...byStage, ...byEvent].map((r) => r.clientId)).size;
}

/** Perdidos: quem foi marcado como perdido no período (ação explícita do Alex). */
export function lostClientCount(period: Period): number {
  const rows = db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.status, "lost"),
        isNotNull(clients.lostAt),
        gte(clients.lostAt, period.start),
        lt(clients.lostAt, period.end),
      ),
    )
    .all();
  return rows.length;
}

export type FunnelStep = {
  stage: FunnelStage;
  label: string;
  count: number;
  /** Conversão a partir da etapa anterior. null = não há base para calcular. */
  rate: number | null;
  smallSample: boolean;
};

/**
 * A cadeia do PROTOCOLO_DE_TRABALHO item 7:
 * "Lead não é lead qualificado. Lead qualificado não é avaliação.
 *  Avaliação não é venda."
 *
 * A taxa de cada etapa é sempre relativa à etapa anterior que TEM base — pular
 * uma etapa vazia evita dividir por zero e evita inventar 0%.
 */
export function funnelSteps(period: Period): FunnelStep[] {
  const counts = stageCounts(period);
  const closed = closedClientCount(period);

  const steps: FunnelStep[] = [];
  let previousCount: number | null = null;

  for (const stage of FUNNEL_STAGES) {
    const count = stage === "fechou" ? closed : (counts[stage] ?? 0);

    let rate: number | null = null;
    if (previousCount != null && previousCount > 0) {
      rate = count / previousCount;
    }

    steps.push({
      stage,
      label: STAGE_LABEL[stage],
      count,
      rate,
      smallSample: (previousCount ?? 0) > 0 && (previousCount as number) < SMALL_SAMPLE,
    });

    // Etapa vazia não vira base: a próxima taxa compara com a última etapa que
    // realmente teve gente, em vez de dividir por zero.
    if (count > 0) previousCount = count;
  }

  return steps;
}

/** Agendados × compareceram × não compareceram, no período. */
export function attendance(period: Period) {
  const counts = stageCounts(period);
  const agendado = counts.agendado ?? 0;
  const compareceu = counts.compareceu ?? 0;

  const noShows = db
    .select({ clientId: events.clientId })
    .from(events)
    .where(
      and(
        eq(events.keyword, "NAO COMPARECEU"),
        gte(events.createdAt, period.start),
        lt(events.createdAt, period.end),
      ),
    )
    .all();

  return {
    agendado,
    compareceu,
    naoCompareceu: new Set(noShows.map((r) => r.clientId)).size,
    rate: agendado > 0 ? compareceu / agendado : null,
    smallSample: agendado > 0 && agendado < SMALL_SAMPLE,
  };
}

/**
 * Tempo médio, em dias, entre entrar num estágio e entrar no seguinte.
 * Sai de graça das transições — nenhum registro extra foi pedido ao Alex.
 */
export function averageStageDurations(period: Period) {
  const rows = db
    .select({
      clientId: listTransitions.clientId,
      stage: listTransitions.toStage,
      movedAt: listTransitions.movedAt,
    })
    .from(listTransitions)
    .where(
      and(
        isNotNull(listTransitions.toStage),
        gte(listTransitions.movedAt, period.start),
        lt(listTransitions.movedAt, period.end),
      ),
    )
    .orderBy(listTransitions.movedAt)
    .all();

  const firstEntry = new Map<string, Map<Stage, Date>>();
  for (const row of rows) {
    if (!row.stage) continue;
    const perClient = firstEntry.get(row.clientId) ?? new Map<Stage, Date>();
    if (!perClient.has(row.stage as Stage)) perClient.set(row.stage as Stage, row.movedAt);
    firstEntry.set(row.clientId, perClient);
  }

  const durations: Array<{ from: FunnelStage; to: FunnelStage; days: number[] }> = [];
  for (let i = 0; i < FUNNEL_STAGES.length - 1; i += 1) {
    durations.push({ from: FUNNEL_STAGES[i], to: FUNNEL_STAGES[i + 1], days: [] });
  }

  for (const perClient of firstEntry.values()) {
    for (const entry of durations) {
      const from = perClient.get(entry.from);
      const to = perClient.get(entry.to);
      if (from && to && to > from) {
        entry.days.push((to.getTime() - from.getTime()) / 86_400_000);
      }
    }
  }

  return durations.map((entry) => ({
    from: entry.from,
    to: entry.to,
    fromLabel: STAGE_LABEL[entry.from],
    toLabel: STAGE_LABEL[entry.to],
    sample: entry.days.length,
    // null, e não 0: sem amostra não há média (§13A).
    averageDays:
      entry.days.length > 0
        ? entry.days.reduce((a, b) => a + b, 0) / entry.days.length
        : null,
  }));
}

/** Motivos registrados em PENSANDO e PERDIDO. Nunca inferidos pelo sistema. */
export function reasonBreakdown(period: Period) {
  const rows = db
    .select({
      reason: events.reason,
      keyword: events.keyword,
      total: sql<number>`count(*)`,
    })
    .from(events)
    .where(
      and(
        isNotNull(events.reason),
        gte(events.createdAt, period.start),
        lt(events.createdAt, period.end),
      ),
    )
    .groupBy(events.reason, events.keyword)
    .all();

  const merged = new Map<string, { reason: string; pensando: number; perdido: number }>();
  for (const row of rows) {
    if (!row.reason) continue;
    const entry = merged.get(row.reason) ?? { reason: row.reason, pensando: 0, perdido: 0 };
    if (row.keyword === "PERDIDO") entry.perdido += row.total;
    else entry.pensando += row.total;
    merged.set(row.reason, entry);
  }

  return [...merged.values()].sort(
    (a, b) => b.pensando + b.perdido - (a.pensando + a.perdido),
  );
}

/** Origem dos leads que entraram no funil no período, pelas etiquetas do grupo ORIGEM. */
export function originBreakdown(period: Period) {
  return db
    .select({
      name: labels.name,
      colorHex: labels.colorHex,
      total: sql<number>`count(distinct ${clients.id})`,
    })
    .from(clientLabels)
    .innerJoin(labels, eq(labels.id, clientLabels.labelId))
    .innerJoin(clients, eq(clients.id, clientLabels.clientId))
    .where(
      and(
        eq(labels.group, "ORIGEM"),
        gte(clients.createdAt, period.start),
        lt(clients.createdAt, period.end),
      ),
    )
    .groupBy(labels.id)
    .orderBy(sql`count(distinct ${clients.id}) desc`)
    .all();
}

/** Onde os cards estão agora — foto do presente, não do período. */
export function currentDistribution() {
  return db
    .select({
      listId: lists.id,
      name: lists.name,
      color: lists.color,
      stage: lists.countsAsStage,
      total: sql<number>`count(${clients.id})`,
    })
    .from(lists)
    .leftJoin(
      clients,
      and(eq(clients.listId, lists.id), eq(clients.status, "active")),
    )
    .where(eq(lists.archived, false))
    .groupBy(lists.id)
    .orderBy(lists.position)
    .all();
}

export type HeadlineMetric = {
  label: string;
  value: number;
  delta: number | null;
};

/** Os três contadores grandes do topo do Workspace, com o delta do mês anterior. */
export function headlineMetrics(period: Period): HeadlineMetric[] {
  const previous = previousPeriod(period);
  const now = stageCounts(period);
  const before = stageCounts(previous);

  const build = (label: string, current: number, past: number): HeadlineMetric => ({
    label,
    value: current,
    // Sem histórico no período anterior não existe delta — não é "zero de variação".
    delta: past === 0 && current === 0 ? null : current - past,
  });

  return [
    build("Avaliações", now.agendado ?? 0, before.agendado ?? 0),
    build("Fechadas", closedClientCount(period), closedClientCount(previous)),
    build("Perdidas", lostClientCount(period), lostClientCount(previous)),
  ];
}

export function formatRate(rate: number | null): string {
  if (rate == null) return "sem dados";
  return `${Math.round(rate * 100)}%`;
}
