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
 * A tela inteira ocupa a largura disponível (pedido "widescreen" do Alex) —
 * inclusive a agenda e o cabeçalho, para os controles de tema/notificações/
 * perfil baterem na mesma margem direita dos ícones de mostrar/ocultar dos
 * painéis flutuantes. As outras páginas continuam com `max-w-[1320px]`
 * (cada uma define isso internamente agora — ver `AppShell.tsx`); só o
 * Workspace abre mão disso. "Onde os cards estão" e "Fila de follow-up"
 * flutuam por cima (`WorkspacePanels`), não ocupam coluna própria na grade.
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
      <WorkspacePanelToggles />
      <div className="fixed bottom-0 right-[76px] z-30 hidden xl:block">
        <WorkspacePanels counts={counts} max={max} followups={followups} />
      </div>

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

      <LeadsRow clients={clients} lists={lists} />
      <TodayTasksRow tasks={tasks} columns={columns} specialLabels={specialTaskLabels} clients={clients} />
    </div>
  );
}
