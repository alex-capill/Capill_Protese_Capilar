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

export function dueState(task: TaskView): "overdue" | "due-soon" | "today" | "future" | "none" {
  if (!task.dueAt) return "none";
  const due = new Date(task.dueAt);
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (due < now) return "overdue";
  if (due.getTime() - now.getTime() <= 60 * 60 * 1000) return "due-soon";
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
  const colored = !done;

  return (
    <article
      onDoubleClick={() => onEdit?.(task)}
      className={cx(
        "group relative flex min-h-[196px] cursor-pointer flex-col rounded-[26px] rounded-tr-[8px] p-[18px] shadow-[var(--shadow-card)] transition",
        colored ? taskTone(state) : "bg-surface",
        colored && "text-black",
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
              : colored
                ? "border-black/25 hover:border-black/60"
                : "border-[var(--border-strong)] hover:border-[var(--text)]",
          )}
        >
          {done && <IconCheck size={12} />}
        </button>

        <div className="min-w-0 flex-1 pr-7">
          <p className={cx("text-[16px] font-normal leading-snug", done && "line-through")}>
            {task.title}
          </p>
          {task.notes && (
            <p
              className={cx(
                "mt-1 line-clamp-2 text-xs",
                colored ? "text-black/65" : "text-muted",
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

      <footer
        className={cx(
          "mt-auto border-t pt-3",
          colored ? "border-black/12" : "border-[var(--border)]",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          {task.dueAt && (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                state === "overdue"
                  ? "bg-negative text-white"
                  : state === "due-soon"
                    ? "bg-[#F0A849] text-black"
                    : "bg-black/10 text-black",
              )}
            >
              <IconClock size={11} />
              {formatDue(task.dueAt, state)}
            </span>
          )}

          <span className={cx("rounded-full px-2.5 py-1", priorityTone(task.priority))}>
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </span>
        </div>

        {task.clientId && task.clientName && (
          <Link
            href={`/clientes/${task.clientId}`}
            onDoubleClick={(event) => event.stopPropagation()}
            className={cx(
              "mt-2 flex w-full items-center gap-1.5 rounded-[12px] px-2.5 py-1.5 text-[11px] font-semibold transition",
              colored
                ? "bg-black/10 hover:bg-black/15"
                : "bg-surface-sunken text-text-soft hover:bg-surface-2 hover:text-text",
            )}
          >
            <IconUser size={11} />
            <span className="truncate">{task.clientName}</span>
          </Link>
        )}
      </footer>
    </article>
  );
}

function priorityTone(priority: string) {
  if (priority === "alta") return "bg-negative/15 text-negative";
  if (priority === "media") return "bg-warning/20 text-text";
  return "bg-surface-sunken text-text-soft";
}

/** As cores de prazo permanecem iguais nos temas claro e escuro. */
function taskTone(state: ReturnType<typeof dueState>) {
  if (state === "overdue") return "bg-[#FFD1D1]";
  if (state === "due-soon") return "bg-[#FFE2B8]";
  return "bg-[#E5FFC7]";
}

function formatDue(iso: string, state: ReturnType<typeof dueState>): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (state === "today") return `Hoje ${time}`;
  if (state === "due-soon") {
    const minutes = Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));
    return `Em ${minutes} min`;
  }
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
