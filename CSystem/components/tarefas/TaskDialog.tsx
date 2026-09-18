"use client";

import { useState, useTransition } from "react";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { IconTrash } from "@/components/ui/icons";
import { LabelChip } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import type { ClientView, LabelView, TaskColumnView, TaskView } from "@/lib/view-types";

/** Criação e edição de tarefa, com prioridade e vínculo opcional com cliente. */
export function TaskDialog({
  task,
  columnId,
  columns,
  specialLabels,
  clients,
  onClose,
}: {
  task: TaskView | null;
  columnId: string;
  columns: TaskColumnView[];
  specialLabels: LabelView[];
  clients: ClientView[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueAt, setDueAt] = useState(task?.dueAt ? toLocalInput(task.dueAt) : "");
  const [priority, setPriority] = useState(task?.priority ?? "media");
  const [clientId, setClientId] = useState(task?.clientId ?? "");
  const [specialLabelIds, setSpecialLabelIds] = useState(task?.labels.map((label) => label.id) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const payload = {
        title,
        notes: notes || null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority: priority as "baixa" | "media" | "alta",
        clientId: clientId || null,
        specialLabelIds,
      };

      const result = task
        ? await updateTaskAction(task.id, payload)
        : await createTaskAction({ ...payload, columnId });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      width={560}
      footer={
        <>
          {task && (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deleteTaskAction(task.id);
                  onClose();
                })
              }
              className="mr-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-negative transition hover:bg-negative/10"
            >
              <IconTrash size={15} />
              Excluir
            </button>
          )}
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !title.trim()}
            className="btn-ink px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Título</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Ligar para o fornecedor sobre a peça do João"
            className="field"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Observações <span className="font-normal text-muted">(opcional)</span>
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="field resize-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Prazo</span>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="field"
            />
          </label>

          <PriorityPicker value={priority} onChange={setPriority} />
        </div>

        {!task && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Coluna</span>
            <select value={columnId} disabled className="field opacity-70">
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Cliente relacionado <span className="font-normal text-muted">(opcional)</span>
          </span>
          <select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="field"
          >
            <option value="">Nenhum</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Situação especial</legend>
          <div className="flex flex-wrap gap-2 rounded-[var(--radius-inner)] border border-[var(--border)] bg-surface-2 p-2">
            {specialLabels.map((label) => {
              const active = specialLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSpecialLabelIds((current) => active ? current.filter((id) => id !== label.id) : [...current, label.id])}
                  className={cx(
                    "rounded-full transition",
                    active ? "brightness-110 drop-shadow-sm" : "opacity-50 hover:opacity-100",
                  )}
                >
                  <LabelChip name={label.name} colorHex={label.colorHex} size="sm" />
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted">Use apenas para sinalizar uma questão fora do fluxo normal.</p>
        </fieldset>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}

function PriorityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: "baixa" | "media" | "alta") => void;
}) {
  const options = [
    { value: "baixa", label: "Baixa", active: "bg-surface text-text" },
    { value: "media", label: "Média", active: "bg-warning/25 text-text" },
    { value: "alta", label: "Alta", active: "bg-negative text-white" },
  ] as const;

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Nível de prioridade</legend>
      <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-inner)] border border-[var(--border)] bg-surface-2 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cx(
              "choice-control rounded-[14px] px-2 py-2 text-sm font-medium transition",
              value === option.value
                ? option.active
                : "text-text-soft hover:bg-surface hover:text-text",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** `datetime-local` só aceita o formato local sem timezone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
