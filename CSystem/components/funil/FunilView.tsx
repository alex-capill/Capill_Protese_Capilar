"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconSearch } from "@/components/ui/icons";
import { Avatar, LabelChip } from "@/components/ui/primitives";
import { ViewToggle, useViewMode } from "@/components/ui/ViewToggle";
import { formatPhone } from "@/lib/phone";
import { cx, formatBRL } from "@/lib/utils";
import type { ClientView, LabelView, ListView } from "@/lib/view-types";
import { FunilBoard } from "./FunilBoard";

/**
 * Casca do funil: busca, filtro por etiqueta e o alternador Lista ⇄ Kanban.
 * O arrasto só existe no Kanban; a lista é para varrer tudo de uma vez.
 */
export function FunilView({
  lists,
  clients,
  labels,
}: {
  lists: ListView[];
  clients: ClientView[];
  labels: LabelView[];
}) {
  const [mode, setMode] = useViewMode("csystem-funil-view", "kanban");
  const [term, setTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return clients.filter((client) => {
      if (labelFilter && !client.labels.some((l) => l.id === labelFilter)) return false;
      if (!needle) return true;
      return (
        client.name.toLowerCase().includes(needle) ||
        (client.city ?? "").toLowerCase().includes(needle) ||
        (client.phoneNormalized ?? "").includes(needle)
      );
    });
  }, [clients, term, labelFilter]);

  const filtering = term.trim().length > 0 || labelFilter != null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar por nome, cidade ou telefone"
            aria-label="Buscar cliente"
            className="field rounded-full bg-surface py-2.5 pl-10"
          />
        </div>

        <div className="scroll-row flex-1 items-center">
          <button
            type="button"
            onClick={() => setLabelFilter(null)}
            className={cx("chip", labelFilter === null ? "chip-on" : "chip-off")}
          >
            Todas
          </button>
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => setLabelFilter(labelFilter === label.id ? null : label.id)}
              className={cx("chip", labelFilter === label.id ? "chip-on" : "chip-off")}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: label.colorHex }}
              />
              {label.name}
            </button>
          ))}
        </div>

        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      {filtering && (
        <p className="text-xs text-muted">
          {filtered.length} de {clients.length} cards correspondem ao filtro.
          {mode === "kanban" && " Arrastar continua funcionando normalmente."}
        </p>
      )}

      {mode === "kanban" ? (
        <FunilBoard lists={lists} clients={filtered} />
      ) : (
        <FunilList lists={lists} clients={filtered} />
      )}
    </div>
  );
}

function FunilList({ lists, clients }: { lists: ListView[]; clients: ClientView[] }) {
  const byList = new Map(lists.map((list) => [list.id, list]));
  const ordered = [...clients].sort((a, b) => {
    const listA = byList.get(a.listId)?.position ?? 0;
    const listB = byList.get(b.listId)?.position ?? 0;
    return listA - listB || a.position - b.position;
  });

  if (ordered.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-muted">
        Nenhum cliente por aqui ainda.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold max-md:hidden">Etapa</th>
            <th className="px-4 py-3 font-semibold max-lg:hidden">Etiquetas</th>
            <th className="px-4 py-3 font-semibold max-sm:hidden">Telefone</th>
            <th className="px-4 py-3 text-right font-semibold max-md:hidden">Valor</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((client) => {
            const list = byList.get(client.listId);
            return (
              <tr
                key={client.id}
                className="border-b border-[var(--border)] transition last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <Link href={`/clientes/${client.id}`} className="flex items-center gap-3">
                    <Avatar name={client.name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{client.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {client.city ?? "—"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 max-md:hidden">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: list?.color ?? "var(--muted)" }}
                    />
                    {list?.name ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 max-lg:hidden">
                  <span className="flex flex-wrap gap-1">
                    {client.labels.slice(0, 3).map((label) => (
                      <LabelChip
                        key={label.id}
                        name={label.name}
                        colorHex={label.colorHex}
                        size="sm"
                      />
                    ))}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-soft max-sm:hidden">
                  {formatPhone(client.phoneNormalized) || "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs font-semibold max-md:hidden">
                  {formatBRL(client.valueCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
