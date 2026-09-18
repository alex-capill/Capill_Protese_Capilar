"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toggleTaskDoneAction } from "@/app/actions/tasks";
import { IconCheck, IconClock } from "@/components/ui/icons";
import { LabelChip } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import type { TaskColumnView, TaskView } from "@/lib/view-types";
import { dueState } from "./TaskCard";

/**
 * Visão em lista das tarefas: tudo de uma vez, agrupado pela coluna, ordenado
 * por prazo. É a visão de varredura — quem precisa reorganizar usa o Kanban.
 */
export function TasksList({
  columns,
  tasks,
  onEdit,
}: {
  columns: TaskColumnView[];
  tasks: TaskView[];
  onEdit: (task: TaskView) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-muted">
        Nenhuma tarefa com este filtro.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {columns.map((column) => {
        const rows = tasks
          .filter((task) => task.columnId === column.id)
          .sort((a, b) => {
            if (!!a.doneAt !== !!b.doneAt) return a.doneAt ? 1 : -1;
            if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
            if (a.dueAt) return -1;
            if (b.dueAt) return 1;
            return a.position - b.position;
          });

        if (rows.length === 0) return null;

        return (
          <section key={column.id}>
            <h3 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: column.accent ?? "var(--muted)" }}
              />
              {column.name}
              <span className="text-muted">{rows.length}</span>
            </h3>

            <div className="card divide-y divide-[var(--border)] overflow-hidden">
              {rows.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={onEdit} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ task, onEdit }: { task: TaskView; onEdit: (task: TaskView) => void }) {
  const [pending, startTransition] = useTransition();
  const state = dueState(task);
  const done = task.doneAt != null;

  return (
    <div className={cx("flex items-center gap-3 px-4 py-3", done && "opacity-55")}>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void toggleTaskDoneAction(task.id))}
        aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
          done
            ? "border-transparent bg-positive text-white"
            : "border-[var(--border-strong)] hover:border-[var(--text)]",
        )}
      >
        {done && <IconCheck size={12} />}
      </button>

      <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <p className={cx("truncate text-sm font-semibold", done && "line-through")}>
          {task.title}
        </p>
        {task.notes && <p className="truncate text-xs text-muted">{task.notes}</p>}
      </button>

      {task.labels.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 max-sm:hidden">
          {task.labels.map((label) => (
            <LabelChip key={label.id} name={label.name} colorHex={label.colorHex} size="sm" />
          ))}
        </div>
      )}

      {task.clientId && task.clientName && (
        <Link
          href={`/clientes/${task.clientId}`}
          className="max-w-[140px] shrink-0 truncate text-xs font-medium text-text-soft hover:underline max-md:hidden"
        >
          {task.clientName}
        </Link>
      )}

      {task.dueAt && (
        <span
          className={cx(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            state === "overdue" && !done
              ? "bg-[color-mix(in_srgb,var(--negative)_16%,transparent)] text-negative"
              : state === "due-soon" && !done
                ? "bg-warning/20 text-text"
                : state === "today" && !done
                ? "bg-accent-soft text-text"
                : "bg-surface-sunken text-text-soft",
          )}
        >
          <IconClock size={11} />
          {new Date(task.dueAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
