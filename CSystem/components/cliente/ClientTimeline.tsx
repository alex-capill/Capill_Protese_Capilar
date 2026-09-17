import { IconArrowUpRight, IconClock } from "@/components/ui/icons";
import type { EventView, TransitionView } from "@/lib/view-types";

/**
 * Linha do tempo do card: comentários e movimentos de lista no mesmo fio.
 *
 * Os dois aparecem juntos de propósito — é assim que se lê a história do
 * cliente. O movimento mostra o QUE aconteceu no funil; o comentário, o PORQUÊ.
 */

type Entry =
  | { kind: "event"; at: string; data: EventView }
  | { kind: "transition"; at: string; data: TransitionView };

export function ClientTimeline({
  events,
  transitions,
}: {
  events: EventView[];
  transitions: TransitionView[];
}) {
  const entries: Entry[] = [
    ...events.map((data) => ({ kind: "event" as const, at: data.createdAt, data })),
    // A transição que gerou um comentário já aparece como comentário: evita eco duplo.
    ...transitions
      .filter((transition) => !events.some((event) => event.body && event.keyword === transition.keyword && sameMinute(event.createdAt, transition.movedAt)))
      .map((data) => ({ kind: "transition" as const, at: data.movedAt, data })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (entries.length === 0) {
    return (
      <div className="card px-5 py-10 text-center">
        <p className="text-sm font-semibold">Nenhum histórico ainda</p>
        <p className="mt-1 text-sm text-muted">
          Mover o card entre listas e registrar comentários alimenta esta linha do tempo.
        </p>
      </div>
    );
  }

  return (
    <ol className="card divide-y divide-[var(--border)] overflow-hidden">
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.data.id}`} className="flex gap-3 px-5 py-3.5">
          <span className="mt-0.5 shrink-0 text-muted">
            {entry.kind === "transition" ? (
              <IconArrowUpRight size={15} />
            ) : (
              <IconClock size={15} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            {entry.kind === "transition" ? (
              <p className="text-sm">
                <span className="text-muted">
                  {entry.data.fromListName ? `${entry.data.fromListName} → ` : "Entrou em "}
                </span>
                <strong className="font-semibold">{entry.data.toListName}</strong>
                {entry.data.source === "sdr" && (
                  <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold">
                    SDR
                  </span>
                )}
              </p>
            ) : (
              <div>
                <p className="text-sm">
                  {entry.data.keyword && (
                    <span className="mr-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold tracking-wide">
                      {entry.data.keyword}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap">{entry.data.body}</span>
                </p>
                {entry.data.reason && (
                  <p className="mt-1 text-xs text-muted">Motivo: {entry.data.reason}</p>
                )}
                {entry.data.author === "sdr" && (
                  <p className="mt-1 text-[11px] font-semibold text-muted">
                    registrado pelo Agente SDR
                  </p>
                )}
              </div>
            )}

            <time
              dateTime={entry.at}
              className="mt-1 block text-[11px] text-muted"
              title={new Date(entry.at).toLocaleString("pt-BR")}
            >
              {formatWhen(entry.at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}

function sameMinute(a: string, b: string): boolean {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 60_000;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Hoje, ${time}`;
  if (diffDays === 1) return `Ontem, ${time}`;
  if (diffDays < 7) return `${diffDays} dias atrás, ${time}`;
  return `${date.toLocaleDateString("pt-BR")}, ${time}`;
}
