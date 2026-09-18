import { IconArrowUpRight, IconClock } from "@/components/ui/icons";
import type { EventView, TransitionView } from "@/lib/view-types";

/**
 * Linha do tempo do card: comentários e movimentos de lista no mesmo fio.
 *
 * Quando um comentário nasceu de um arrasto, os dois viram UMA entrada — o
 * movimento mostra o QUE aconteceu no funil, o comentário mostra o PORQUÊ, e
 * separá-los faria a leitura pular entre duas linhas que contam a mesma coisa.
 *
 * O pareamento é por `transitionId`, e não por proximidade de horário: dois
 * eventos no mesmo minuto são perfeitamente possíveis num dia corrido.
 */

type Entry = {
  id: string;
  at: string;
  transition: TransitionView | null;
  event: EventView | null;
};

export function ClientTimeline({
  events,
  transitions,
}: {
  events: EventView[];
  transitions: TransitionView[];
}) {
  const eventByTransition = new Map(
    events.filter((event) => event.transitionId).map((event) => [event.transitionId!, event]),
  );

  const entries: Entry[] = [
    ...transitions.map((transition) => ({
      id: `t-${transition.id}`,
      at: transition.movedAt,
      transition,
      event: eventByTransition.get(transition.id) ?? null,
    })),
    ...events
      .filter((event) => !event.transitionId)
      .map((event) => ({ id: `e-${event.id}`, at: event.createdAt, transition: null, event })),
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
        <li key={entry.id} className="flex gap-3 px-5 py-3.5">
          <span className="mt-0.5 shrink-0 text-muted">
            {entry.transition ? <IconArrowUpRight size={15} /> : <IconClock size={15} />}
          </span>

          <div className="min-w-0 flex-1">
            {entry.transition && (
              <p className="text-sm">
                <span className="text-muted">
                  {entry.transition.fromListName
                    ? `${entry.transition.fromListName} → `
                    : "Entrou em "}
                </span>
                <strong className="font-semibold">{entry.transition.toListName}</strong>
                {entry.transition.source === "sdr" && (
                  <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold">
                    SDR
                  </span>
                )}
              </p>
            )}

            {entry.event && (
              <div className={entry.transition ? "mt-1.5" : undefined}>
                <p className="text-sm">
                  {entry.event.keyword && (
                    <span className="mr-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold tracking-wide">
                      {entry.event.keyword}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap">{entry.event.body}</span>
                </p>
                {entry.event.reason && (
                  <p className="mt-1 text-xs text-muted">Motivo: {entry.event.reason}</p>
                )}
                {entry.event.author === "sdr" && (
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

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Hoje, ${time}`;
  if (diffDays === 1) return `Ontem, ${time}`;
  if (diffDays < 7) return `${diffDays} dias atrás, ${time}`;
  return `${date.toLocaleDateString("pt-BR")}, ${time}`;
}
