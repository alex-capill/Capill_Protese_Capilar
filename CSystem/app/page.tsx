import { PageHeader } from "@/components/shell/PageHeader";
import { ScheduleBar } from "@/components/shell/ScheduleBar";
import { LeadsRow } from "@/components/workspace/LeadsRow";
import { NewTaskButton } from "@/components/workspace/NewTaskButton";
import { TodayTasksRow } from "@/components/workspace/TodayTasksRow";
import { headlineMetrics, monthPeriod } from "@/lib/metrics";
import {
  getClients,
  getLabels,
  getLists,
  getTaskColumns,
  getTasks,
  getTodayAppointments,
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
  const labels = getLabels();
  const tasks = getTasks();
  const columns = getTaskColumns();
  const appointments = getTodayAppointments();
  const metrics = headlineMetrics(monthPeriod());

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <div className="mb-10">
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

      <div className="mb-10">
        <PageHeader
          title="Workspace"
          metrics={metrics}
          action={<NewTaskButton columns={columns} labels={labels} clients={clients} />}
          controls={false}
          metricExamples={{ Fechadas: 1, Perdidas: -1 }}
        />
      </div>

      <LeadsRow clients={clients} lists={lists} />
      <TodayTasksRow tasks={tasks} columns={columns} labels={labels} clients={clients} />
    </div>
  );
}
