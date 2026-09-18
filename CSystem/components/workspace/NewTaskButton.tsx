"use client";

import { useState } from "react";
import { IconPlus } from "@/components/ui/icons";
import { TaskDialog } from "@/components/tarefas/TaskDialog";
import type { ClientView, LabelView, TaskColumnView } from "@/lib/view-types";

/** O botão preto colado no título, como na referência. */
export function NewTaskButton({
  columns,
  specialLabels,
  clients,
}: {
  columns: TaskColumnView[];
  specialLabels: LabelView[];
  clients: ClientView[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={columns.length === 0}
        className="btn-ink shrink-0 px-5 py-3 text-sm disabled:opacity-40"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
          <IconPlus size={13} />
        </span>
        Nova Tarefa
      </button>

      {open && (
        <TaskDialog
          task={null}
          columnId={columns[0]?.id ?? ""}
          columns={columns}
          specialLabels={specialLabels}
          clients={clients}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
