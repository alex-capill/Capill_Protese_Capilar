import {
  IconArrowUpRight,
  IconChevronDown,
  IconClock,
  IconInbox,
} from "@/components/ui/icons";
import type { EventView, TransitionView } from "@/lib/view-types";

type SystemRecord =
  | { id: string; at: string; type: "transition"; transition: TransitionView }
  | { id: string; at: string; type: "sdr-event" | "system-event"; event: EventView };

/**
 * Mantém duas leituras diferentes do histórico, sem apagar nada:
 *
 * - Eventos: observações registradas pelo Alex, recolhíveis para não
 *   ocupar a tela durante a operação.
 * - Registros do sistema: rastreabilidade automática de movimentos de lista,
 *   entradas do SDR e integrações. Esses fatos não são comentários manuais.
 *
 * Eventos vinculados a uma transição aparecem em Eventos; a transição
 * correspondente permanece em Registros do sistema. Assim o porquê e o que
 * aconteceu continuam completos, mas deixam de disputar a mesma lista.
 */
export function ClientTimeline({
  events,
  transitions,
}: {
  events: EventView[];
  transitions: TransitionView[];
}) {
  const comments = events.filter((event) => event.author === "alex");
  const records: SystemRecord[] = [
    ...transitions.map((transition) => ({
      id: `t-${transition.id}`,
      at: transition.movedAt,
      type: "transition" as const,
      transition,
    })),
    ...events
      .filter((event) => event.author !== "alex")
      .map((event) => ({
        id: `e-${event.id}`,
        at: event.createdAt,
        type: event.author === "sdr" ? ("sdr-event" as const) : ("system-event" as const),
        event,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (comments.length === 0 && records.length === 0) {
    return (
      <div className="card px-5 py-10 text-center">
        <p className="text-sm font-semibold">Nenhum histórico ainda</p>
        <p className="mt-1 text-sm text-muted">
          Mover o card entre listas e registrar comentários alimenta este histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <details open className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Eventos</h2>
            <p className="text-xs text-muted">
              {comments.length === 1 ? "1 evento registrado" : `${comments.length} eventos registrados`}
            </p>
          </div>
          <span className="icon-btn size-8 transition group-open:rotate-180" aria-hidden="true">
            <IconChevronDown size={15} />
          </span>
        </summary>

        <div className="border-t border-[var(--border)]">
          {comments.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted">Nenhum evento manual ainda.</p>
          ) : (
            <ol className="divide-y divide-[var(--border)]">
              {comments.map((event) => (
                <li key={event.id} className="flex gap-3 px-5 py-3.5">
                  <span className="mt-0.5 shrink-0 text-muted">
                    <IconClock size={15} />
                  </span>
                  <EventContent event={event} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </details>

      <details open className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Registros do sistema</h2>
            <p className="text-xs text-muted">
              Movimentações, entradas do SDR e informações automáticas.
            </p>
          </div>
          <span className="icon-btn size-8 transition group-open:rotate-180" aria-hidden="true">
            <IconChevronDown size={15} />
          </span>
        </summary>

        <div className="border-t border-[var(--border)]">
          {records.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted">Nenhum registro automático ainda.</p>
          ) : (
            <ol className="divide-y divide-[var(--border)]">
              {records.map((record) => (
                <li key={record.id} className="flex gap-3 px-5 py-3.5">
                  <span className="mt-0.5 shrink-0 text-muted">
                    {record.type === "transition" ? (
                      <IconArrowUpRight size={15} />
                    ) : record.type === "sdr-event" ? (
                      <IconInbox size={15} />
                    ) : (
                      <IconClock size={15} />
                    )}
                  </span>

                  {record.type === "transition" ? (
                    <TransitionContent transition={record.transition} at={record.at} />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {record.type === "sdr-event" ? "Informação do SDR" : "Registro automático"}
                      </p>
                      <EventContent event={record.event} showTime={false} />
                      <Time at={record.at} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </details>
    </div>
  );
}

function TransitionContent({ transition, at }: { transition: TransitionView; at: string }) {
  const isSdrEntry = transition.source === "sdr" && !transition.fromListName;

  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm">
        <span className="text-muted">
          {isSdrEntry
            ? "Adicionado pelo SDR em "
            : transition.fromListName
              ? `${transition.fromListName} → `
              : "Adicionado em "}
        </span>
        <strong className="font-semibold">{transition.toListName}</strong>
        {transition.source === "sdr" && !isSdrEntry && (
          <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold">
            SDR
          </span>
        )}
      </p>
      <Time at={at} />
    </div>
  );
}

function EventContent({ event, showTime = true }: { event: EventView; showTime?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm">
        {event.keyword && (
          <span className="mr-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold tracking-wide">
            {event.keyword}
          </span>
        )}
        <span className="whitespace-pre-wrap">{event.body || "Sem observação adicional."}</span>
      </p>
      {event.reason && <p className="mt-1 text-xs text-muted">Motivo: {event.reason}</p>}
      {showTime && <Time at={event.createdAt} />}
    </div>
  );
}

function Time({ at }: { at: string }) {
  return (
    <time
      dateTime={at}
      className="mt-1 block text-[11px] text-muted"
      title={new Date(at).toLocaleString("pt-BR")}
    >
      {formatWhen(at)}
    </time>
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
