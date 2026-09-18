"use client";

import { useMemo, useState } from "react";
import { SectionHeader, EmptyState } from "@/components/ui/primitives";
import { FadeScroller } from "@/components/ui/FadeScroller";
import { IconSearch } from "@/components/ui/icons";
import { TaskCard, dueState } from "@/components/tarefas/TaskCard";
import { TaskDialog } from "@/components/tarefas/TaskDialog";
import { cx } from "@/lib/utils";
import type { ClientView, LabelView, TaskColumnView, TaskView } from "@/lib/view-types";

/** A linha "Your Days Tasks" da referência, com os mesmos chips de filtro. */
export function TodayTasksRow({
  tasks,
  columns,
  specialLabels,
  clients,
}: {
  tasks: TaskView[];
  columns: TaskColumnView[];
  specialLabels: LabelView[];
  clients: ClientView[];
}) {
  const [filter, setFilter] = useState("todas");
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<TaskView | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (term.trim() && !task.title.toLowerCase().includes(term.trim().toLowerCase())) return false;
      const state = dueState(task);
      switch (filter) {
        case "hoje":
          return !task.doneAt && (state === "today" || state === "due-soon");
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
  }, [tasks, filter, term]);

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
      <SectionHeader title="Minhas Tarefas" count={openCount} countLabel="abertas" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative flex min-w-[220px] flex-1 sm:max-w-[300px]">
          <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Buscar tarefas" aria-label="Buscar tarefas" className="field rounded-full bg-surface py-2 pl-9 text-sm" />
        </label>
        <FadeScroller fadeWidth={48} className="min-w-0 flex-1 items-center">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={cx("chip", filter === item.id ? "chip-on" : "chip-off")}>
              {item.label}
            </button>
          ))}
        </FadeScroller>
      </div>

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
        <FadeScroller>
          {filtered.slice(0, 20).map((task) => (
            <div key={task.id} className="w-[288px] shrink-0 snap-start">
              <TaskCard task={task} onEdit={setEditing} />
            </div>
          ))}
        </FadeScroller>
      )}

      {editing && (
        <TaskDialog
          task={editing}
          columnId={editing.columnId}
          columns={columns}
          specialLabels={specialLabels}
          clients={clients}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
