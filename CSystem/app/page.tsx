import { PageHeader } from "@/components/shell/PageHeader";
import Link from "next/link";
import { ScheduleBar } from "@/components/shell/ScheduleBar";
import { LeadsRow } from "@/components/workspace/LeadsRow";
import { NewTaskButton } from "@/components/workspace/NewTaskButton";
import { TodayTasksRow } from "@/components/workspace/TodayTasksRow";
import { headlineMetrics, monthPeriod } from "@/lib/metrics";
import { cx } from "@/lib/utils";
import {
  getClients,
  getSpecialTaskLabels,
  getLists,
  getTaskColumns,
  getTasks,
  getTodayAppointments,
  getFollowupQueue,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Workspace — a tela da referência.
 *
 * Ordem de leitura pensada para o começo do dia: a agenda de hoje primeiro,
 * depois os números do mês, depois quem chegou, depois o que fazer.
 */
export default function WorkspacePage() {
  const lists = getLists();
  const clients = getClients();
  const specialTaskLabels = getSpecialTaskLabels();
  const tasks = getTasks();
  const columns = getTaskColumns();
  const appointments = getTodayAppointments();
  const followups = getFollowupQueue(3);
  const metrics = headlineMetrics(monthPeriod());

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <div className="mb-8">
        <ScheduleBar
          items={appointments.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            clientName: appointment.clientName,
            startsAt: appointment.startsAt,
            endsAt: appointment.endsAt,
            kind: appointment.kind,
          }))}
        />
      </div>

      <div className="mb-8">
        <PageHeader
          title="Workspace"
          metrics={metrics}
          action={<NewTaskButton columns={columns} specialLabels={specialTaskLabels} clients={clients} />}
          controls={false}
          metricExamples={{ Fechadas: 1, Perdidas: -1 }}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <LeadsRow clients={clients} lists={lists} />
          <TodayTasksRow tasks={tasks} columns={columns} specialLabels={specialTaskLabels} clients={clients} />
        </div>
        <WorkspaceAside clients={clients} lists={lists} followups={followups} />
      </div>
    </div>
  );
}

function WorkspaceAside({
  clients,
  lists,
  followups,
}: {
  clients: ReturnType<typeof getClients>;
  lists: ReturnType<typeof getLists>;
  followups: ReturnType<typeof getFollowupQueue>;
}) {
  const counts = lists
    .map((list) => ({ ...list, total: clients.filter((client) => client.listId === list.id).length }))
    .filter((list) => list.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const max = Math.max(...counts.map((item) => item.total), 1);

  return (
    <aside className="hidden flex-col gap-4 xl:flex">
      <section className="card p-5">
        <p className="mb-4 text-sm text-muted">Onde os cards estão</p>
        <div className="space-y-3">
          {counts.length === 0 ? <p className="text-sm text-muted">Nenhum card ativo.</p> : counts.map((item) => (
            <div key={item.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm"><span className="truncate">{item.name}</span><span className="font-semibold tabular-nums">{item.total}</span></div>
              <span className="block h-2 overflow-hidden rounded-full bg-surface-sunken"><span className="block h-full rounded-full" style={{ width: `${(item.total / max) * 100}%`, backgroundColor: item.color ?? "var(--muted)" }} /></span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[var(--radius-card)] bg-[#111111] p-5 text-white shadow-[var(--shadow-card)]">
        <p className="mb-4 text-sm text-white/55">Fila de follow-up</p>
        {followups.length === 0 ? <p className="text-sm text-white/55">Nenhum retorno marcado.</p> : <div className="space-y-3">{followups.map((item) => {
          const date = item.nextFollowupAt ? new Date(item.nextFollowupAt) : null;
          const overdue = date != null && date < new Date();
          return <Link key={item.id} href={`/clientes/${item.id}`} className="flex items-center gap-2.5 rounded-xl transition hover:bg-white/10">
            <span className={cx("flex size-9 shrink-0 flex-col items-center justify-center rounded-full text-[11px] leading-none", overdue ? "bg-negative text-white" : "bg-white/10")}><span>{date?.getDate() ?? "—"}</span><small className="mt-0.5 opacity-70">{date?.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") ?? ""}</small></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm">{item.name}</span><span className="block truncate text-xs text-white/55">{item.listName}</span></span>
          </Link>;
        })}</div>}
      </section>
    </aside>
  );
}
