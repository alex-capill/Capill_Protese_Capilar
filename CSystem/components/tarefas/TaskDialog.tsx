"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskLabelAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { Dialog } from "@/components/ui/Dialog";
import { LabelChip } from "@/components/ui/primitives";
import { IconTrash } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import type { ClientView, LabelView, TaskColumnView, TaskView } from "@/lib/view-types";

/** Criação e edição de tarefa, incluindo etiquetas e vínculo com cliente. */
export function TaskDialog({
  task,
  columnId,
  columns,
  labels,
  clients,
  onClose,
}: {
  task: TaskView | null;
  columnId: string;
  columns: TaskColumnView[];
  labels: LabelView[];
  clients: ClientView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueAt, setDueAt] = useState(task?.dueAt ? toLocalInput(task.dueAt) : "");
  const [priority, setPriority] = useState(task?.priority ?? "media");
  const [clientId, setClientId] = useState(task?.clientId ?? "");
  const [applied, setApplied] = useState<string[]>(task?.labels.map((l) => l.id) ?? []);
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

  function toggleLabel(labelId: string) {
    // Etiqueta só pode ser aplicada em tarefa que já existe: precisa de um id.
    if (!task) {
      setApplied((current) =>
        current.includes(labelId)
          ? current.filter((id) => id !== labelId)
          : [...current, labelId],
      );
      return;
    }
    startTransition(async () => {
      const result = await toggleTaskLabelAction(task.id, labelId);
      if (result.ok) {
        setApplied((current) =>
          result.data.applied
            ? [...current, labelId]
            : current.filter((id) => id !== labelId),
        );
        // A etiqueta é gravada numa action separada da edição da tarefa. Sem
        // renovar os props do quadro, o chip só aparecia após recarregar a página.
        router.refresh();
      }
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

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Prioridade</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="field"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </label>
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

        <div>
          <span className="mb-2 block text-sm font-medium">Etiquetas</span>
          {!task && (
            <p className="mb-2 text-xs text-muted">
              Salve a tarefa primeiro para poder aplicar etiquetas.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const on = applied.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  disabled={!task}
                  onClick={() => toggleLabel(label.id)}
                  className={cx(
                    "rounded-full transition disabled:opacity-40",
                    on && "brightness-110 drop-shadow-sm",
                  )}
                >
                  <LabelChip name={label.name} colorHex={label.colorHex} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}

/** `datetime-local` só aceita o formato local sem timezone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
