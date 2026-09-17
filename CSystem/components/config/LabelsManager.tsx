"use client";

import { useState, useTransition } from "react";
import {
  createLabelAction,
  deleteLabelAction,
  updateLabelAction,
} from "@/app/actions/labels";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { LabelChip } from "@/components/ui/primitives";
import { IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import { LABEL_GROUP_LABEL } from "@/db/seed-data";
import type { LabelView } from "@/lib/view-types";

/**
 * CRUD de etiquetas com seletor de cor.
 *
 * Os 4 grupos da Regra 2 vêm prontos, mas o grupo é texto livre: dá para criar
 * um grupo novo só digitando o nome. Os grupos são independentes — um card pode
 * ter etiqueta de vários ao mesmo tempo.
 */
export function LabelsManager({ labels }: { labels: LabelView[] }) {
  const [editing, setEditing] = useState<LabelView | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<LabelView | null>(null);
  const [pending, startTransition] = useTransition();

  const groups = [...new Set([...labels.map((l) => l.group), "ORIGEM", "MODALIDADE", "PAGAMENTO", "SITUACAO_ESPECIAL"])];

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Etiquetas</h2>
          <p className="text-sm text-muted">
            {labels.length} etiquetas em {groups.filter((g) => labels.some((l) => l.group === g)).length} grupos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-ink ml-auto px-4 py-2 text-sm"
        >
          <IconPlus size={15} />
          Nova etiqueta
        </button>
      </div>

      <div className="space-y-5">
        {groups
          .filter((group) => labels.some((label) => label.group === group))
          .map((group) => (
            <div key={group}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                {LABEL_GROUP_LABEL[group] ?? group}
              </h3>
              <ul className="space-y-1.5">
                {labels
                  .filter((label) => label.group === group)
                  .map((label) => (
                    <li
                      key={label.id}
                      className="flex items-center gap-3 rounded-[var(--radius-inner)] bg-surface-sunken px-3 py-2"
                    >
                      <span
                        className="size-5 shrink-0 rounded-full"
                        style={{ backgroundColor: label.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {label.name}
                      </span>
                      <LabelChip name="exemplo" colorHex={label.colorHex} size="sm" />
                      <span className="font-mono text-[11px] text-muted max-sm:hidden">
                        {label.colorHex}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(label)}
                        aria-label={`Editar ${label.name}`}
                        className="icon-btn size-8 shrink-0"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(label)}
                        aria-label={`Excluir ${label.name}`}
                        className="icon-btn size-8 shrink-0 hover:text-negative"
                      >
                        <IconTrash size={14} />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>

      {(creating || editing) && (
        <LabelDialog
          label={editing}
          knownGroups={groups}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting != null}
        onClose={() => setDeleting(null)}
        pending={pending}
        title={`Excluir "${deleting?.name}"`}
        description="A etiqueta sai de todos os cards e tarefas que a usam. Isso não afeta as métricas de funil."
        confirmLabel="Excluir etiqueta"
        onConfirm={() => {
          if (!deleting) return;
          startTransition(async () => {
            await deleteLabelAction(deleting.id);
            setDeleting(null);
          });
        }}
      />
    </section>
  );
}

function LabelDialog({
  label,
  knownGroups,
  onClose,
}: {
  label: LabelView | null;
  knownGroups: string[];
  onClose: () => void;
}) {
  const [name, setName] = useState(label?.name ?? "");
  const [group, setGroup] = useState(label?.group ?? "ORIGEM");
  const [colorHex, setColorHex] = useState(label?.colorHex ?? "#C9F24D");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = label
        ? await updateLabelAction(label.id, { name, group, colorHex })
        : await createLabelAction({ name, group, colorHex });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={label ? "Editar etiqueta" : "Nova etiqueta"}
      width={480}
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !name.trim()}
            className="btn-ink px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Nome</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Indicação de cliente"
            className="field"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Grupo</span>
          <input
            list="grupos-etiqueta"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="field"
          />
          <datalist id="grupos-etiqueta">
            {knownGroups.map((option) => (
              <option key={option} value={option}>
                {LABEL_GROUP_LABEL[option] ?? option}
              </option>
            ))}
          </datalist>
          <span className="mt-1 block text-xs text-muted">
            Grupos são independentes: um card pode ter etiqueta de vários ao mesmo tempo.
          </span>
        </label>

        <ColorPicker value={colorHex} onChange={setColorHex} />

        <div className="rounded-[var(--radius-inner)] bg-surface-sunken p-3">
          <p className="mb-2 text-xs font-semibold text-muted">Prévia</p>
          <LabelChip name={name || "Etiqueta"} colorHex={colorHex} />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}
