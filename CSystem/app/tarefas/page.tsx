import { PageHeader } from "@/components/shell/PageHeader";
import { TasksView } from "@/components/tarefas/TasksView";
import { getClients, getSpecialTaskLabels, getTaskColumns, getTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function TarefasPage() {
  const columns = getTaskColumns();
  const tasks = getTasks();
  const specialTaskLabels = getSpecialTaskLabels();
  const clients = getClients();

  return (
    <>
      <PageHeader title="Minhas Tarefas" />
      <TasksView columns={columns} tasks={tasks} specialLabels={specialTaskLabels} clients={clients} />
    </>
  );
}
