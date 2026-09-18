"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClientMiniCard } from "@/components/funil/ClientMiniCard";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { cx } from "@/lib/utils";
import type { ClientView, ListView } from "@/lib/view-types";

/**
 * A linha "New Leads" da referência: cards de cliente em rolagem horizontal,
 * com chips de filtro acima.
 *
 * Os filtros são as perguntas que o Alex realmente faz ao abrir o sistema:
 * quem chegou qualificado, quem está esperando retorno, quem tem avaliação
 * marcada, quem está marcado como prioridade.
 */
export function LeadsRow({
  clients,
  lists,
}: {
  clients: ClientView[];
  lists: ListView[];
}) {
  const [filter, setFilter] = useState<string>("todos");

  const listById = useMemo(() => new Map(lists.map((list) => [list.id, list])), [lists]);

  const filtered = useMemo(() => {
    return clients.filter((client) => {
      const stage = listById.get(client.listId)?.countsAsStage;
      switch (filter) {
        case "qualificado":
          return stage === "qualificado";
        case "followup":
          return stage === "lead";
        case "agendado":
          return stage === "agendado";
        case "prioridade":
          return client.labels.some((label) => label.name === "Prioridade");
        case "online":
          return client.modality === "online";
        default:
          return true;
      }
    });
  }, [clients, filter, listById]);

  const FILTERS = [
    { id: "todos", label: "Todos" },
    { id: "qualificado", label: "Qualificados" },
    { id: "followup", label: "Follow-up" },
    { id: "agendado", label: "Avaliação marcada" },
    { id: "prioridade", label: "Prioridade" },
    { id: "online", label: "Online" },
  ];

  return (
    <section className="mb-12">
      <SectionHeader title="Novos Leads" count={clients.length} countLabel="no funil">
        <div className="scroll-row">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cx("chip", filter === item.id ? "chip-on" : "chip-off")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionHeader>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            clients.length === 0
              ? "Nenhum cliente ainda"
              : "Nenhum cliente com este filtro"
          }
          description={
            clients.length === 0
              ? "Crie o primeiro card no funil, ou espere o primeiro repasse do SDR chegar pelo webhook."
              : undefined
          }
          action={
            clients.length === 0 ? (
              <Link href="/funil" className="btn-ink mt-1 px-4 py-2 text-sm">
                Abrir o funil
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="scroll-row">
          {filtered.slice(0, 20).map((client) => (
            <div key={client.id} className="w-[270px] shrink-0 snap-start">
              <ClientMiniCard client={client} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
