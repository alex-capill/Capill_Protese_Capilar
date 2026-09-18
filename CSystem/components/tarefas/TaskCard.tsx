"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toggleTaskDoneAction } from "@/app/actions/tasks";
import { IconArrowUpRight, IconCheck, IconClock, IconUser } from "@/components/ui/icons";
import { LabelChip } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import type { TaskView } from "@/lib/view-types";

/**
 * Card de tarefa.
 *
 * Como na referência, o card "em destaque" é verde-limão inteiro: aqui isso
 * significa "vence hoje ou está atrasada" — o que o Alex precisa ver primeiro.
 * Os demais são brancos.
 */

const PRIORITY_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function dueState(task: TaskView): "overdue" | "today" | "future" | "none" {
  if (!task.dueAt) return "none";
  const due = new Date(task.dueAt);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (due < new Date()) return "overdue";
  if (due <= endOfToday) return "today";
  return "future";
}

export function TaskCard({
  task,
  dragging,
  onEdit,
}: {
  task: TaskView;
  dragging?: boolean;
  onEdit?: (task: TaskView) => void;
}) {
  const [pending, startTransition] = useTransition();
  const state = dueState(task);
  const done = task.doneAt != null;
  const highlighted = !done && (state === "today" || state === "overdue");

  return (
    <article
      onDoubleClick={() => onEdit?.(task)}
      className={cx(
        "group relative flex min-h-[200px] cursor-pointer flex-col rounded-[26px] rounded-tr-[8px] p-5 shadow-[var(--shadow-card)] transition",
        highlighted ? "bg-accent text-accent-ink" : "bg-surface",
        done && "opacity-55",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void toggleTaskDoneAction(task.id))}
          onDoubleClick={(event) => event.stopPropagation()}
          aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
          className={cx(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
            done
              ? "border-transparent bg-positive text-white"
              : highlighted
                ? "border-accent-ink/35 hover:border-accent-ink"
                : "border-[var(--border-strong)] hover:border-[var(--text)]",
          )}
        >
          {done && <IconCheck size={12} />}
        </button>

        <div className="min-w-0 flex-1 pr-7">
          <p className={cx("text-sm font-bold leading-snug", done && "line-through")}>
            {task.title}
          </p>
          {task.notes && (
            <p
              className={cx(
                "mt-1 line-clamp-2 text-xs",
                highlighted ? "text-accent-ink/70" : "text-muted",
              )}
            >
              {task.notes}
            </p>
          )}
        </div>
      </div>

      {onEdit && (
        <div className="absolute -right-2 -top-2 z-10 flex size-12 items-center justify-center rounded-full bg-bg">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
            aria-label={`Abrir ${task.title}`}
            className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-text shadow-[var(--shadow-chip)] transition hover:bg-ink hover:text-ink-invert"
          >
            <IconArrowUpRight size={15} />
          </button>
        </div>
      )}

      {task.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1 pl-7">
          {task.labels.map((label) => (
            <LabelChip key={label.id} name={label.name} colorHex={label.colorHex} size="sm" />
          ))}
        </div>
      )}

      <div
        className={cx(
          "mt-auto flex flex-wrap items-center gap-2 border-t pt-3 text-[11px] font-semibold",
          highlighted ? "border-accent-ink/15" : "border-[var(--border)]",
        )}
      >
        {task.dueAt && (
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
              highlighted
                ? "bg-black/10"
                : state === "overdue"
                  ? "bg-[color-mix(in_srgb,var(--negative)_16%,transparent)] text-negative"
                  : "bg-surface-sunken text-text-soft",
            )}
          >
            <IconClock size={11} />
            {formatDue(task.dueAt, state)}
          </span>
        )}

        <span
          className={cx(
            "rounded-full px-2 py-0.5",
            highlighted ? "bg-black/10" : "bg-surface-sunken text-text-soft",
          )}
        >
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </span>

        {task.clientId && task.clientName && (
          <Link
            href={`/clientes/${task.clientId}`}
            onDoubleClick={(event) => event.stopPropagation()}
            className={cx(
              "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition",
              highlighted ? "bg-black/10 hover:bg-black/20" : "bg-surface-sunken hover:bg-surface-2",
            )}
          >
            <IconUser size={11} />
            <span className="max-w-[110px] truncate">{task.clientName}</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function formatDue(iso: string, state: ReturnType<typeof dueState>): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (state === "today") return `Hoje ${time}`;
  if (state === "overdue") {
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    return days >= 1 ? `Atrasada ${days}d` : `Atrasada ${time}`;
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function SortableTaskCard({
  task,
  onEdit,
}: {
  task: TaskView;
  onEdit?: (task: TaskView) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <TaskCard task={task} dragging={isDragging} onEdit={onEdit} />
    </div>
  );
}
