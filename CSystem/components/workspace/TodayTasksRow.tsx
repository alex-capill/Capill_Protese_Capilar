"use client";

import { useMemo, useState } from "react";
import { SectionHeader, EmptyState } from "@/components/ui/primitives";
import { TaskCard, dueState } from "@/components/tarefas/TaskCard";
import { TaskDialog } from "@/components/tarefas/TaskDialog";
import { cx } from "@/lib/utils";
import type { ClientView, LabelView, TaskColumnView, TaskView } from "@/lib/view-types";

/** A linha "Your Days Tasks" da referência, com os mesmos chips de filtro. */
export function TodayTasksRow({
  tasks,
  columns,
  labels,
  clients,
}: {
  tasks: TaskView[];
  columns: TaskColumnView[];
  labels: LabelView[];
  clients: ClientView[];
}) {
  const [filter, setFilter] = useState("todas");
  const [editing, setEditing] = useState<TaskView | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const state = dueState(task);
      switch (filter) {
        case "hoje":
          return !task.doneAt && state === "today";
        case "atrasadas":
          return !task.doneAt && state === "overdue";
        case "alta":
          return !task.doneAt && task.priority === "alta";
        case "concluidas":
          return task.doneAt != null;
        default:
          return !task.doneAt;
      }
    });
  }, [tasks, filter]);

  const FILTERS = [
    { id: "todas", label: "Todas" },
    { id: "hoje", label: "Hoje" },
    { id: "atrasadas", label: "Atrasadas" },
    { id: "alta", label: "Prioridade alta" },
    { id: "concluidas", label: "Concluídas" },
  ];

  const openCount = tasks.filter((task) => !task.doneAt).length;

  return (
    <section className="mb-8">
      <SectionHeader title="Minhas Tarefas" count={openCount} countLabel="abertas">
        <div className="scroll-row">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cx("chip", filter === item.id ? "chip-on" : "chip-off")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionHeader>

      {filtered.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? "Nenhuma tarefa criada" : "Nada com este filtro"}
          description={
            tasks.length === 0
              ? "Use o botão Nova Tarefa aí em cima para criar a primeira."
              : undefined
          }
        />
      ) : (
        <div className="scroll-row">
          {filtered.slice(0, 20).map((task) => (
            <div key={task.id} className="w-[320px] shrink-0 snap-start">
              <TaskCard task={task} onEdit={setEditing} />
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TaskDialog
          task={editing}
          columnId={editing.columnId}
          columns={columns}
          labels={labels}
          clients={clients}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
