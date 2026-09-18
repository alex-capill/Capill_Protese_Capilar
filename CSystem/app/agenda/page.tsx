import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconClock, IconWhatsapp } from "@/components/ui/icons";
import { Avatar, EmptyState } from "@/components/ui/primitives";
import { formatPhone, whatsappUrl } from "@/lib/phone";
import { getAppointments, getFollowupQueue } from "@/lib/queries";
import { cx } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  avaliacao: "Avaliação",
  aplicacao: "Aplicação",
  manutencao: "Manutenção",
  outro: "Outro",
};

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  compareceu: "Compareceu",
  nao_compareceu: "Não compareceu",
  cancelada: "Cancelada",
};

/**
 * Agenda: os próximos compromissos e a fila de follow-up.
 *
 * A fila de follow-up vem do campo `data=` dos comentários de FOLLOW-UP, então
 * responde exatamente à pergunta da seção 13 do Checklist: quem eu preciso
 * retomar, e quando.
 */
export default function AgendaPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const appointments = getAppointments({ start, end });
  const followups = getFollowupQueue();

  const byDay = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    const key = new Date(appointment.startsAt).toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), appointment]);
  }

  const now = new Date();
  const overdue = followups.filter(
    (item) => item.nextFollowupAt && new Date(item.nextFollowupAt) < now,
  );

  return (
    <>
      <PageHeader title="Agenda" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Próximos 30 dias</h2>

          {appointments.length === 0 ? (
            <EmptyState
              title="Nenhum compromisso marcado"
              description="Avaliações entram aqui sozinhas quando você move um card para AVALIAÇÃO AGENDADA e informa a data."
            />
          ) : (
            <div className="space-y-7">
              {[...byDay.entries()].map(([day, items]) => (
                <div key={day}>
                  <h3 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide">
                    {formatDayHeading(items[0].startsAt)}
                  </h3>
                  <div className="card divide-y divide-[var(--border)] overflow-hidden">
                    {items.map((appointment) => (
                      <div key={appointment.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-14 shrink-0 text-sm font-bold tabular-nums">
                          {new Date(appointment.startsAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {appointment.clientName && (
                          <Avatar name={appointment.clientName} size={32} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {appointment.clientName ?? appointment.title}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {KIND_LABEL[appointment.kind] ?? appointment.kind}
                            {appointment.modality === "online" && " · Online"}
                            {appointment.modality === "studio" && " · Studio"}
                          </p>
                        </div>
                        <span
                          className={cx(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            appointment.status === "compareceu"
                              ? "bg-[color-mix(in_srgb,var(--positive)_16%,transparent)] text-positive"
                              : appointment.status === "nao_compareceu"
                                ? "bg-[color-mix(in_srgb,var(--negative)_16%,transparent)] text-negative"
                                : "bg-surface-sunken text-text-soft",
                          )}
                        >
                          {STATUS_LABEL[appointment.status] ?? appointment.status}
                        </span>
                        {appointment.clientId && (
                          <Link
                            href={`/clientes/${appointment.clientId}`}
                            className="chip chip-off shrink-0 px-3 py-1 text-[11px] max-sm:hidden"
                          >
                            Abrir
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-bold tracking-tight">Fila de follow-up</h2>
          <p className="mb-3 text-xs text-muted">
            Quem tem data de retorno registrada.
            {overdue.length > 0 && (
              <strong className="text-negative"> {overdue.length} já passou da data.</strong>
            )}
          </p>

          {followups.length === 0 ? (
            <EmptyState
              title="Fila vazia"
              description="Registre um follow-up na página do cliente para ele aparecer aqui."
            />
          ) : (
            <ul className="card divide-y divide-[var(--border)] overflow-hidden">
              {followups.map((item) => {
                const date = item.nextFollowupAt ? new Date(item.nextFollowupAt) : null;
                const late = date != null && date < now;
                const wa = whatsappUrl(item.phoneNormalized);

                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cx(
                        "flex size-9 shrink-0 flex-col items-center justify-center rounded-full text-[10px] font-bold leading-none",
                        late ? "bg-negative text-white" : "bg-surface-sunken text-text-soft",
                      )}
                      title={date?.toLocaleDateString("pt-BR")}
                    >
                      {date ? (
                        <>
                          <span>{date.getDate()}</span>
                          <span className="font-medium opacity-75">
                            {date.toLocaleDateString("pt-BR", { month: "short" }).slice(0, 3)}
                          </span>
                        </>
                      ) : (
                        <IconClock size={14} />
                      )}
                    </span>

                    <Link href={`/clientes/${item.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-xs text-muted">
                        {item.listName}
                        {item.phoneNormalized && ` · ${formatPhone(item.phoneNormalized)}`}
                      </p>
                    </Link>

                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-btn size-8 shrink-0"
                        aria-label={`Abrir WhatsApp de ${item.name}`}
                      >
                        <IconWhatsapp size={14} />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function formatDayHeading(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
