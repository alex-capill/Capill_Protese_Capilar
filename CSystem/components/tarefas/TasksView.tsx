"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createTaskColumnAction, moveTaskAction } from "@/app/actions/tasks";
import { IconPlus } from "@/components/ui/icons";
import { ViewToggle, useViewMode } from "@/components/ui/ViewToggle";
import { cx } from "@/lib/utils";
import type { ClientView, LabelView, TaskColumnView, TaskView } from "@/lib/view-types";
import { SortableTaskCard, TaskCard, dueState } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { TasksList } from "./TasksList";

/**
 * Minhas Tarefas: Kanban e Lista, alternáveis, com arrasto entre colunas.
 *
 * Diferente do funil, mover tarefa NÃO grava transição — tarefa é organização
 * pessoal do Alex, não etapa de cliente, e não alimenta métrica de funil.
 */
export function TasksView({
  columns,
  tasks,
  labels,
  clients,
}: {
  columns: TaskColumnView[];
  tasks: TaskView[];
  labels: LabelView[];
  clients: ClientView[];
}) {
  const [mode, setMode] = useViewMode("csystem-tarefas-view", "kanban");
  const [filter, setFilter] = useState<"todas" | "hoje" | "atrasadas" | "abertas" | "concluidas">(
    "todas",
  );
  const [editing, setEditing] = useState<TaskView | null>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const state = dueState(task);
      switch (filter) {
        case "hoje":
          return !task.doneAt && state === "today";
        case "atrasadas":
          return !task.doneAt && state === "overdue";
        case "abertas":
          return !task.doneAt;
        case "concluidas":
          return task.doneAt != null;
        default:
          return true;
      }
    });
  }, [tasks, filter]);

  const counts = useMemo(
    () => ({
      hoje: tasks.filter((t) => !t.doneAt && dueState(t) === "today").length,
      atrasadas: tasks.filter((t) => !t.doneAt && dueState(t) === "overdue").length,
      abertas: tasks.filter((t) => !t.doneAt).length,
    }),
    [tasks],
  );

  const FILTERS = [
    { id: "todas", label: "Todas" },
    { id: "hoje", label: `Hoje${counts.hoje ? ` · ${counts.hoje}` : ""}` },
    { id: "atrasadas", label: `Atrasadas${counts.atrasadas ? ` · ${counts.atrasadas}` : ""}` },
    { id: "abertas", label: "Abertas" },
    { id: "concluidas", label: "Concluídas" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="scroll-row flex-1 items-center">
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
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      {mode === "kanban" ? (
        <TasksBoard
          columns={columns}
          tasks={filtered}
          onEdit={setEditing}
          onCreate={setCreatingIn}
        />
      ) : (
        <TasksList columns={columns} tasks={filtered} onEdit={setEditing} />
      )}

      {(editing || creatingIn) && (
        <TaskDialog
          task={editing}
          columnId={creatingIn ?? editing?.columnId ?? columns[0]?.id ?? ""}
          columns={columns}
          labels={labels}
          clients={clients}
          onClose={() => {
            setEditing(null);
            setCreatingIn(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ board */

function TasksBoard({
  columns,
  tasks,
  onEdit,
  onCreate,
}: {
  columns: TaskColumnView[];
  tasks: TaskView[];
  onEdit: (task: TaskView) => void;
  onCreate: (columnId: string) => void;
}) {
  const [items, setItems] = useState<Record<string, string[]>>(() => group(columns, tasks));
  const [byId, setById] = useState<Record<string, TaskView>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task])),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const signature = tasks.map((t) => `${t.id}:${t.columnId}:${t.position}:${t.doneAt}`).join("|");
  const [synced, setSynced] = useState(signature);
  if (synced !== signature) {
    setSynced(signature);
    setItems(group(columns, tasks));
    setById(Object.fromEntries(tasks.map((task) => [task.id, task])));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumn(id: string): string | null {
    if (items[id]) return id;
    return Object.keys(items).find((columnId) => items[columnId].includes(id)) ?? null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;

    setItems((current) => {
      const source = current[from].filter((id) => id !== active.id);
      const target = [...current[to]];
      const overIndex = target.indexOf(String(over.id));
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, String(active.id));
      return { ...current, [from]: source, [to]: target };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const toColumnId = findColumn(String(over.id));
    if (!toColumnId) return;

    let ordered = items[toColumnId] ?? [];
    const fromIndex = ordered.indexOf(taskId);
    const overIndex = ordered.indexOf(String(over.id));
    if (fromIndex >= 0 && overIndex >= 0 && fromIndex !== overIndex) {
      ordered = [...ordered];
      ordered.splice(fromIndex, 1);
      ordered.splice(overIndex, 0, taskId);
      setItems((current) => ({ ...current, [toColumnId]: ordered }));
    }

    const index = ordered.indexOf(taskId);
    startTransition(() => {
      void moveTaskAction({
        taskId,
        toColumnId,
        beforeId: index > 0 ? ordered[index - 1] : null,
        afterId: index < ordered.length - 1 ? ordered[index + 1] : null,
      });
    });
  }

  const activeTask = activeId ? byId[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="thin-scroll flex items-start gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const ids = items[column.id] ?? [];
          return (
            <SortableContext
              key={column.id}
              id={column.id}
              items={ids}
              strategy={verticalListSortingStrategy}
            >
              <TaskColumn
                column={column}
                tasks={ids.map((id) => byId[id]).filter(Boolean)}
                onEdit={onEdit}
                onCreate={onCreate}
              />
            </SortableContext>
          );
        })}
        <AddColumnButton />
      </div>

      <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
    </DndContext>
  );
}

function TaskColumn({
  column,
  tasks,
  onEdit,
  onCreate,
}: {
  column: TaskColumnView;
  tasks: TaskView[];
  onEdit: (task: TaskView) => void;
  onCreate: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      className={cx(
        "flex w-[300px] shrink-0 flex-col rounded-[var(--radius-card)] bg-surface-sunken p-2.5 transition",
        isOver && "ring-2 ring-accent",
      )}
    >
      <header className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: column.accent ?? "var(--muted)" }}
        />
        <h3 className="flex-1 truncate text-[13px] font-bold uppercase tracking-wide">
          {column.name}
        </h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-text-soft">
          {tasks.length}
        </span>
      </header>

      <div ref={setNodeRef} className="flex min-h-[72px] flex-col gap-2">
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-[var(--radius-inner)] border border-dashed border-[var(--border-strong)] px-3 py-5 text-center text-xs text-muted">
            Solte uma tarefa aqui
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onCreate(column.id)}
        className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-inner)] px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface hover:text-text"
      >
        <IconPlus size={14} />
        Nova tarefa
      </button>
    </section>
  );
}

function AddColumnButton() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-[240px] shrink-0 items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] py-5 text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
      >
        <IconPlus size={16} />
        Nova coluna
      </button>
    );
  }

  return (
    <div className="w-[240px] shrink-0 rounded-[var(--radius-card)] bg-surface-sunken p-3">
      <input
        autoFocus
        value={name}
        placeholder="Nome da coluna"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && name.trim()) {
            startTransition(async () => {
              await createTaskColumnAction({ name });
              setName("");
              setOpen(false);
            });
          }
        }}
        className="field bg-surface text-sm"
      />
      <p className="mt-1.5 text-[11px] text-muted">Enter para criar, Esc para cancelar.</p>
      {pending && <p className="mt-1 text-[11px] text-muted">Criando…</p>}
    </div>
  );
}

function group(columns: TaskColumnView[], tasks: TaskView[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const column of columns) grouped[column.id] = [];
  for (const task of [...tasks].sort((a, b) => a.position - b.position)) {
    if (!grouped[task.columnId]) grouped[task.columnId] = [];
    grouped[task.columnId].push(task.id);
  }
  return grouped;
}
