"use client";

import { useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import { createClientAction } from "@/app/actions/clients";
import { IconPlus } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import type { ClientView, ListView } from "@/lib/view-types";
import { SortableClientCard } from "./ClientMiniCard";
import { ColumnMenu } from "./ListControls";

/** Uma coluna do Kanban: cabeçalho editável, cards e criação rápida no rodapé. */
export function FunilColumn({
  list,
  allLists,
  cards,
}: {
  list: ListView;
  allLists: ListView[];
  cards: ClientView[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });

  return (
    <section
      className={cx(
        "flex w-[290px] shrink-0 flex-col rounded-[var(--radius-card)] bg-surface-sunken p-2.5 transition",
        isOver && "ring-2 ring-accent",
      )}
    >
      <header className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: list.color ?? "var(--muted)" }}
          aria-hidden="true"
        />
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-wide">
          {list.name}
        </h3>
        <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-text-soft">
          {cards.length}
        </span>
        <ColumnMenu list={list} allLists={allLists} cardCount={cards.length} />
      </header>

      {/* A área de soltar precisa ter altura própria, senão coluna vazia não recebe card. */}
      <div ref={setNodeRef} className="flex min-h-[72px] flex-col gap-2">
        {cards.map((client) => (
          <SortableClientCard key={client.id} client={client} />
        ))}
        {cards.length === 0 && (
          <p className="rounded-[var(--radius-inner)] border border-dashed border-[var(--border-strong)] px-3 py-5 text-center text-xs text-muted">
            Solte um card aqui
          </p>
        )}
      </div>

      <AddCardInline listId={list.id} />
    </section>
  );
}

function AddCardInline({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const value = name.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await createClientAction({ name: value, listId });
      if (result.ok) {
        setName("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-inner)] px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface hover:text-text"
      >
        <IconPlus size={14} />
        Novo card
      </button>
    );
  }

  return (
    <div className="mt-2">
      <input
        autoFocus
        value={name}
        disabled={pending}
        placeholder="Nome do cliente"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") {
            setOpen(false);
            setError(null);
          }
        }}
        className="field bg-surface text-sm"
      />
      {error && <p className="mt-1.5 text-[11px] leading-snug text-negative">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !name.trim()}
          className="btn-ink px-3 py-1.5 text-xs disabled:opacity-40"
        >
          {pending ? "Criando…" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="chip chip-off px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
