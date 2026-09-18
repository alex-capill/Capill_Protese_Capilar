import { PageHeader } from "@/components/shell/PageHeader";
import { ScheduleBar } from "@/components/shell/ScheduleBar";
import { LeadsRow } from "@/components/workspace/LeadsRow";
import { NewTaskButton } from "@/components/workspace/NewTaskButton";
import { TodayTasksRow } from "@/components/workspace/TodayTasksRow";
import { WorkspacePanels } from "@/components/workspace/WorkspacePanels";
import { WorkspacePanelToggles } from "@/components/workspace/WorkspacePanelToggles";
import { headlineMetrics, monthPeriod } from "@/lib/metrics";
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
 *
 * Novos Leads e Minhas Tarefas ocupam a largura inteira disponível (pedido
 * "widescreen" do Alex) — só a agenda e o cabeçalho continuam na largura de
 * leitura de 1320px. "Onde os cards estão" e "Fila de follow-up" flutuam por
 * cima (`WorkspacePanels`), não ocupam mais coluna própria na grade.
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

  const counts = lists
    .map((list) => ({ ...list, total: clients.filter((client) => client.listId === list.id).length }))
    .filter((list) => list.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const max = Math.max(...counts.map((item) => item.total), 1);

  return (
    <div className="w-full">
      <div className="fixed bottom-0 right-8 z-30 hidden flex-col items-end gap-2 xl:flex">
        <WorkspacePanelToggles />
        <WorkspacePanels counts={counts} max={max} followups={followups} />
      </div>

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
      </div>

      <div className="w-full">
        <LeadsRow clients={clients} lists={lists} />
        <TodayTasksRow tasks={tasks} columns={columns} specialLabels={specialTaskLabels} clients={clients} />
      </div>
    </div>
  );
}
