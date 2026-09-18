"use client";

import { useState, useTransition } from "react";
import { deletePaymentAction, upsertPaymentAction } from "@/app/actions/payments";
import { Dialog } from "@/components/ui/Dialog";
import { IconMoney, IconPlus, IconTrash } from "@/components/ui/icons";
import { cx, formatBRL, parseBRL } from "@/lib/utils";

export type PaymentRow = {
  id: string;
  totalCents: number;
  paidCents: number;
  method: string | null;
  status: string;
  dueAt: string | null;
  notes: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando pagamento",
  parcial: "Resta pagamento",
  ok: "Pagamento ok",
};

/**
 * Pagamentos do cliente.
 *
 * Os nomes dos status espelham de propósito as três etiquetas do grupo PAGAMENTO
 * da Regra 2 — é a mesma informação, e usar dois vocabulários para a mesma coisa
 * só criaria dúvida sobre qual vale.
 */
export function PaymentsPanel({
  clientId,
  payments,
}: {
  clientId: string;
  payments: PaymentRow[];
}) {
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const total = payments.reduce((sum, p) => sum + p.totalCents, 0);
  const paid = payments.reduce((sum, p) => sum + p.paidCents, 0);
  const pending = total - paid;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pagamentos</h2>
          {payments.length > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              {formatBRL(paid)} de {formatBRL(total)}
              {pending > 0 && (
                <span className="font-semibold text-warning"> · faltam {formatBRL(pending)}</span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="icon-btn size-8 shrink-0"
          aria-label="Registrar pagamento"
        >
          <IconPlus size={15} />
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconMoney size={16} />
          Nenhum pagamento registrado.
        </p>
      ) : (
        <ul className="space-y-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center gap-3 rounded-[var(--radius-inner)] bg-surface-sunken px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {formatBRL(payment.paidCents)}{" "}
                  <span className="font-normal text-muted">
                    de {formatBRL(payment.totalCents)}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {payment.method ?? "forma não informada"}
                  {payment.dueAt &&
                    ` · vence ${new Date(payment.dueAt).toLocaleDateString("pt-BR")}`}
                </p>
              </div>

              <span
                className={cx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  payment.status === "ok"
                    ? "bg-[color-mix(in_srgb,var(--positive)_18%,transparent)] text-positive"
                    : payment.status === "parcial"
                      ? "bg-[color-mix(in_srgb,var(--warning)_20%,transparent)] text-warning"
                      : "bg-surface text-text-soft",
                )}
              >
                {STATUS_LABEL[payment.status] ?? payment.status}
              </span>

              <button
                type="button"
                onClick={() => setEditing(payment)}
                className="chip chip-off shrink-0 px-2.5 py-1 text-[11px]"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => void deletePaymentAction(payment.id))}
                aria-label="Excluir pagamento"
                className="icon-btn size-7 shrink-0 hover:text-negative"
              >
                <IconTrash size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <PaymentDialog
          clientId={clientId}
          payment={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PaymentDialog({
  clientId,
  payment,
  onClose,
}: {
  clientId: string;
  payment: PaymentRow | null;
  onClose: () => void;
}) {
  const toInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  const [total, setTotal] = useState(payment ? toInput(payment.totalCents) : "");
  const [paid, setPaid] = useState(payment ? toInput(payment.paidCents) : "0,00");
  const [method, setMethod] = useState(payment?.method ?? "");
  const [dueAt, setDueAt] = useState(payment?.dueAt ? payment.dueAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(payment?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    const totalCents = parseBRL(total);
    const paidCents = parseBRL(paid) ?? 0;

    if (totalCents == null) {
      setError("Informe o valor total.");
      return;
    }

    startTransition(async () => {
      const result = await upsertPaymentAction({
        id: payment?.id ?? null,
        clientId,
        totalCents,
        paidCents,
        method: method || null,
        dueAt: dueAt || null,
        notes: notes || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={payment ? "Editar pagamento" : "Registrar pagamento"}
      width={460}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Valor total (R$)</span>
            <input
              autoFocus
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              placeholder="1.800,00"
              className="field"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Já pago (R$)</span>
            <input
              value={paid}
              onChange={(event) => setPaid(event.target.value)}
              placeholder="900,00"
              className="field"
            />
          </label>
        </div>

        <p className="text-xs text-muted">
          O status sai da conta: nada pago é &quot;aguardando&quot;, pago em parte é
          &quot;resta pagamento&quot;, quitado é &quot;pagamento ok&quot;. Não é campo
          para escolher.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Forma</span>
            <input
              list="formas-pagamento"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              placeholder="Pix"
              className="field"
            />
            <datalist id="formas-pagamento">
              <option value="Pix" />
              <option value="Cartão de crédito" />
              <option value="Cartão de débito" />
              <option value="Dinheiro" />
            </datalist>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Vencimento</span>
            <input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="field"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Observação <span className="font-normal text-muted">(opcional)</span>
          </span>
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex: 50% de entrada, 50% na aplicação"
            className="field resize-none"
          />
        </label>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}
