"use client";

import { useEffect, useRef } from "react";
import { IconX } from "./icons";

/**
 * Modal sobre o <dialog> nativo.
 *
 * Nativo e não uma div: o navegador já entrega foco preso dentro do diálogo,
 * fechar no Esc e o backdrop inerte — três coisas que costumam sair erradas
 * numa implementação manual.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      className="m-auto w-[calc(100vw-2rem)] rounded-[var(--radius-card)] bg-surface p-0 text-text shadow-[var(--shadow-raised)] backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      style={{ maxWidth: width }}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start gap-4 px-6 pb-3 pt-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-muted">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn size-9 shrink-0"
              aria-label="Fechar"
            >
              <IconX size={16} />
            </button>
          </header>

          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 py-2">
            {children}
          </div>

          {footer && (
            <footer className="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

/**
 * Confirmação de ação destrutiva. Quando `confirmWord` é passado, exige que a
 * palavra seja digitada — reservado para o que apaga histórico de métrica.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmWord,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmWord?: string;
  pending?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width={460}
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirmWord && inputRef.current?.value.trim() !== confirmWord) return;
              onConfirm();
            }}
            className="rounded-full bg-negative px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Aguarde…" : confirmLabel}
          </button>
        </>
      }
    >
      {confirmWord && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Digite <strong>{confirmWord}</strong> para confirmar
          </span>
          <input ref={inputRef} className="field" autoComplete="off" />
        </label>
      )}
    </Dialog>
  );
}
