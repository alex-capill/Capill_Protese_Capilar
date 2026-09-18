import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, events, listTransitions, lists } from "@/db/schema";
import type { Keyword } from "./keywords";
import { isKeyword } from "./keywords";

/**
 * Motor de transição — o coração da métrica.
 *
 * REGRA CENTRAL: toda mudança de lista grava uma linha em `list_transitions`,
 * SEMPRE, sem perguntar nada e sem depender de o Alex escrever comentário.
 * A métrica sai daí. O comentário (tabela `events`) é opcional e serve para o
 * PORQUÊ — motivo, data de retorno, contexto — nunca para o QUANTO.
 *
 * A linha guarda um snapshot do nome e do estágio das listas envolvidas, então
 * renomear ou excluir uma lista depois não corrompe o histórico já registrado.
 */

export type MoveSource = "drag" | "comment" | "sdr" | "api" | "seed";

/** O objeto de transação que o Drizzle entrega ao callback de `db.transaction`. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type MoveResult = {
  transitionId: string;
  fromListName: string | null;
  toListName: string;
  /** Palavra-chave sugerida para o balão de confirmação, se a lista tiver uma. */
  suggestedKeyword: Keyword | null;
  /** Quando o destino é ambíguo (ex: FOLLOW-UP), as opções a oferecer. */
  keywordChoices: Keyword[];
  /** true quando o destino cria/atualiza um agendamento (AVALIAÇÃO AGENDADA). */
  asksForDate: boolean;
};

function parseChoices(raw: string | null): Keyword[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is Keyword => typeof value === "string" && isKeyword(value));
  } catch {
    return [];
  }
}

/**
 * Move um cliente para outra lista e registra a transição.
 *
 * Roda tudo numa transação: ou o card move e a métrica é gravada, ou nada acontece.
 * Card movido sem transição correspondente seria um furo silencioso na contagem.
 */
export function moveClient(params: {
  clientId: string;
  toListId: string;
  position?: number;
  source?: MoveSource;
  keyword?: Keyword | null;
  at?: Date;
  /**
   * Primeira entrada do cliente no funil (ex: lead novo vindo do SDR).
   * Sem isto, o cliente recém-criado já nasce na lista de destino e a transição
   * sairia como "LEAD QUALIFICADO → LEAD QUALIFICADO" em vez de "Entrou em".
   */
  entry?: boolean;
}): MoveResult {
  const {
    clientId,
    toListId,
    source = "drag",
    keyword = null,
    at = new Date(),
    entry = false,
  } = params;

  return db.transaction((tx) => {
    const client = tx.select().from(clients).where(eq(clients.id, clientId)).get();
    if (!client) throw new Error(`Cliente não encontrado: ${clientId}`);

    const toList = tx.select().from(lists).where(eq(lists.id, toListId)).get();
    if (!toList) throw new Error(`Lista não encontrada: ${toListId}`);

    const fromList = entry
      ? null
      : client.listId === toListId
        ? toList
        : tx.select().from(lists).where(eq(lists.id, client.listId)).get() ?? null;

    const position = params.position ?? nextPositionIn(tx, toListId);

    tx.update(clients)
      .set({ listId: toListId, position, updatedAt: new Date() })
      .where(eq(clients.id, clientId))
      .run();

    const transitionId = randomUUID();
    tx.insert(listTransitions)
      .values({
        id: transitionId,
        clientId,
        fromListId: fromList?.id ?? null,
        toListId: toList.id,
        fromListName: fromList?.name ?? null,
        toListName: toList.name,
        fromStage: fromList?.countsAsStage ?? null,
        toStage: toList.countsAsStage ?? null,
        keyword,
        source,
        movedAt: at,
      })
      .run();

    return {
      transitionId,
      fromListName: fromList?.name ?? null,
      toListName: toList.name,
      suggestedKeyword: (toList.defaultKeyword as Keyword | null) ?? null,
      keywordChoices: parseChoices(toList.keywordChoices),
      asksForDate: toList.countsAsStage === "agendado",
    };
  });
}

/** Próxima posição no fim da lista, deixando espaço para inserções futuras. */
function nextPositionIn(tx: Tx, listId: string): number {
  const rows = tx
    .select({ position: clients.position })
    .from(clients)
    .where(eq(clients.listId, listId))
    .all();
  if (rows.length === 0) return 1000;
  return Math.max(...rows.map((r) => r.position)) + 1000;
}

/**
 * Desfazer: devolve o card à lista anterior e apaga a transição e o comentário
 * que ela gerou. Chamado pelo botão "Desfazer" que aparece por alguns segundos
 * depois do arrasto.
 *
 * Note que NÃO gravamos uma transição de volta: o arrasto foi um engano, não um
 * movimento real do cliente no funil. Gravar as duas inflaria a contagem.
 */
export function undoMove(transitionId: string): boolean {
  return db.transaction((tx) => {
    const transition = tx
      .select()
      .from(listTransitions)
      .where(eq(listTransitions.id, transitionId))
      .get();
    if (!transition || !transition.fromListId) return false;

    const listStillExists = tx
      .select({ id: lists.id })
      .from(lists)
      .where(eq(lists.id, transition.fromListId))
      .get();
    if (!listStillExists) return false;

    tx.update(clients)
      .set({ listId: transition.fromListId, updatedAt: new Date() })
      .where(eq(clients.id, transition.clientId))
      .run();

    tx.delete(events).where(eq(events.transitionId, transitionId)).run();
    tx.delete(listTransitions).where(eq(listTransitions.id, transitionId)).run();

    return true;
  });
}

/** Anexa (ou substitui) o comentário ligado a uma transição. */
export function attachEventToTransition(params: {
  transitionId: string;
  clientId: string;
  keyword: Keyword | null;
  body: string;
  reason?: string | null;
  author?: "alex" | "sdr" | "system";
}): string {
  const { transitionId, clientId, keyword, body, reason = null, author = "alex" } = params;

  return db.transaction((tx) => {
    tx.delete(events).where(eq(events.transitionId, transitionId)).run();

    const id = randomUUID();
    tx.insert(events)
      .values({ id, clientId, keyword, body, reason, transitionId, author })
      .run();

    tx.update(listTransitions)
      .set({ keyword })
      .where(eq(listTransitions.id, transitionId))
      .run();

    return id;
  });
}
