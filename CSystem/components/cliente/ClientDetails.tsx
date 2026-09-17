"use client";

import { useState, useTransition } from "react";
import {
  markClientLostAction,
  reactivateClientAction,
  toggleClientLabelAction,
  updateClientAction,
} from "@/app/actions/clients";
import { Dialog } from "@/components/ui/Dialog";
import { LabelChip } from "@/components/ui/primitives";
import { IconWhatsapp } from "@/components/ui/icons";
import { LABEL_GROUP_LABEL } from "@/db/seed-data";
import { MOTIVO_NAO_IDENTIFICADO, REASONS } from "@/lib/keywords";
import { formatPhone, whatsappUrl } from "@/lib/phone";
import { cx, formatBRL, parseBRL } from "@/lib/utils";
import type { LabelView, ListView } from "@/lib/view-types";

type ClientRecord = {
  id: string;
  name: string;
  listId: string;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  city: string | null;
  description: string | null;
  modality: string | null;
  status: string;
  valueCents: number | null;
  lostReason: string | null;
  sdrClassification: string | null;
  sdrConfidence: string | null;
  labels: LabelView[];
};

/** Cadastro, etiquetas e ações do card único. */
export function ClientDetails({
  client,
  lists,
  allLabels,
}: {
  client: ClientRecord;
  lists: ListView[];
  allLabels: LabelView[];
}) {
  const [editing, setEditing] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [applied, setApplied] = useState(client.labels.map((l) => l.id));
  const [, startTransition] = useTransition();

  const currentList = lists.find((list) => list.id === client.listId);
  const groups = [...new Set(allLabels.map((label) => label.group))];
  const wa = whatsappUrl(client.phoneNormalized);

  function toggleLabel(labelId: string) {
    setApplied((current) =>
      current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    );
    startTransition(() => void toggleClientLabelAction(client.id, labelId));
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">Cadastro</h2>
            {currentList && (
              <p className="mt-0.5 text-xs text-muted">Etapa atual: {currentList.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="chip chip-off shrink-0"
          >
            Editar
          </button>
        </div>

        <dl className="space-y-2.5 text-sm">
          <Field label="Telefone">
            {client.phoneNormalized ? (
              <span className="flex items-center gap-2">
                {formatPhone(client.phoneNormalized)}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="icon-btn size-7"
                    aria-label="Abrir conversa no WhatsApp"
                  >
                    <IconWhatsapp size={14} />
                  </a>
                )}
              </span>
            ) : (
              <span className="text-muted">não informado</span>
            )}
          </Field>
          <Field label="Cidade">{client.city ?? <span className="text-muted">—</span>}</Field>
          <Field label="Modalidade">
            {client.modality === "studio"
              ? "Avaliação no Studio"
              : client.modality === "online"
                ? "Avaliação Online"
                : <span className="text-muted">não definida</span>}
          </Field>
          <Field label="Valor">{formatBRL(client.valueCents)}</Field>
          {client.sdrClassification && (
            <Field label="Classificação do SDR">
              {client.sdrClassification}
              {client.sdrConfidence && (
                <span className="text-muted"> · confiança {client.sdrConfidence}</span>
              )}
            </Field>
          )}
        </dl>

        {client.description && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Contexto
            </p>
            <p className="whitespace-pre-wrap text-sm text-text-soft">{client.description}</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-1 text-lg font-bold tracking-tight">Etiquetas</h2>
        <p className="mb-4 text-xs text-muted">
          Os grupos são independentes — o card pode ter etiqueta de vários ao mesmo tempo.
        </p>

        <div className="space-y-3.5">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                {LABEL_GROUP_LABEL[group] ?? group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allLabels
                  .filter((label) => label.group === group)
                  .map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      aria-pressed={applied.includes(label.id)}
                      className={cx(
                        "rounded-full transition",
                        applied.includes(label.id)
                          ? "ring-2 ring-[var(--text)]"
                          : "opacity-45 hover:opacity-100",
                      )}
                    >
                      <LabelChip name={label.name} colorHex={label.colorHex} size="sm" />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-lg font-bold tracking-tight">Situação</h2>
        {client.status === "lost" ? (
          <div>
            <p className="mb-3 text-sm">
              Marcado como <strong>perdido</strong>
              {client.lostReason && ` — ${client.lostReason}`}.
            </p>
            <button
              type="button"
              onClick={() => startTransition(() => void reactivateClientAction(client.id))}
              className="chip chip-off"
            >
              Reativar no funil
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted">
              Cliente que confirmou que não vai fechar sai do funil ativo. Isso é diferente
              de &quot;sem retorno&quot;, que é lista.
            </p>
            <button
              type="button"
              onClick={() => setLostOpen(true)}
              className="rounded-full border border-[var(--border)] px-3.5 py-2 text-sm font-semibold text-negative transition hover:bg-negative/10"
            >
              Marcar como perdido
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditClientDialog client={client} onClose={() => setEditing(false)} />
      )}
      {lostOpen && <MarkLostDialog clientId={client.id} onClose={() => setLostOpen(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function EditClientDialog({
  client,
  onClose,
}: {
  client: ClientRecord;
  onClose: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phoneRaw ?? "");
  const [city, setCity] = useState(client.city ?? "");
  const [modality, setModality] = useState(client.modality ?? "");
  const [value, setValue] = useState(
    client.valueCents != null ? (client.valueCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [description, setDescription] = useState(client.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateClientAction(client.id, {
        name,
        phone: phone || null,
        city: city || null,
        modality: modality || null,
        valueCents: value.trim() ? parseBRL(value) : null,
        description: description || null,
      });
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
        setConflictId(result.conflictClientId ?? null);
      }
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Editar cliente"
      width={560}
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
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
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Telefone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(84) 99999-9999"
              className="field"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Cidade</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="field" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Modalidade</span>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="field"
            >
              <option value="">Não definida</option>
              <option value="studio">Avaliação no Studio</option>
              <option value="online">Avaliação Online</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Valor (R$)</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1.800,00"
              className="field"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Contexto</span>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field resize-none"
          />
        </label>

        {error && (
          <div className="rounded-[var(--radius-inner)] bg-negative/10 p-3 text-sm text-negative">
            <p>{error}</p>
            {conflictId && (
              <a href={`/clientes/${conflictId}`} className="mt-1 inline-block font-semibold underline">
                Abrir o card existente
              </a>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function MarkLostDialog({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [reason, setReason] = useState(MOTIVO_NAO_IDENTIFICADO);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open
      onClose={onClose}
      title="Marcar como perdido"
      description="Sai do funil ativo e passa a contar em Perdidas na métrica do mês."
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markClientLostAction({ clientId, reason, note });
                onClose();
              })
            }
            className="rounded-full bg-negative px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Marcar como perdido"}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Motivo</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field"
          >
            <option value={MOTIVO_NAO_IDENTIFICADO}>{MOTIVO_NAO_IDENTIFICADO}</option>
            {REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            Sem evidência clara, deixe em &quot;motivo não identificado&quot;. Chutar aqui
            contamina a métrica de perdas.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Observação <span className="font-normal text-muted">(opcional)</span>
          </span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field resize-none"
          />
        </label>
      </div>
    </Dialog>
  );
}
