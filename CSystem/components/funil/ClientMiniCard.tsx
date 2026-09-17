"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, LabelChip } from "@/components/ui/primitives";
import { IconArrowUpRight, IconClock } from "@/components/ui/icons";
import { cx, formatBRL } from "@/lib/utils";
import type { ClientView } from "@/lib/view-types";

/**
 * O card de cliente no Kanban — o "New Leads" da referência: avatar, nome,
 * subtítulo, bloco de origem com as etiquetas e a escala em bolinhas.
 *
 * Sobre as bolinhas: na referência elas marcam "interesse". Aqui elas mostram o
 * NÍVEL DE CONFIANÇA declarado pelo SDR (ALTA/MODERADA/BAIXA), que é um campo
 * que existe de verdade no bloco ===REPASSE===. Inventar um "score de interesse"
 * seria criar dado novo sem uso comprovado — o Teste do Engenheiro reprova isso.
 */

const CONFIDENCE_DOTS: Record<string, number> = { ALTA: 5, MODERADA: 3, BAIXA: 1 };

export function ClientMiniCard({
  client,
  dragging,
  overlay,
}: {
  client: ClientView;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const origin = client.labels.filter((label) => label.group === "ORIGEM");
  const others = client.labels.filter((label) => label.group !== "ORIGEM");
  const dots = client.sdrConfidence ? (CONFIDENCE_DOTS[client.sdrConfidence] ?? 0) : 0;

  return (
    <article
      className={cx(
        "group relative rounded-[var(--radius-inner)] bg-surface p-3.5 shadow-[var(--shadow-card)] transition",
        overlay && "rotate-2 shadow-[var(--shadow-raised)]",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={client.name} size={38} />
        <div className="min-w-0 flex-1 pr-6">
          <p className="truncate text-sm font-bold leading-tight">{client.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {client.city ?? "Cidade não informada"}
            {client.modality === "online" && " · Online"}
            {client.modality === "studio" && " · Studio"}
          </p>
        </div>
      </div>

      {(origin.length > 0 || dots > 0) && (
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Origem
            </p>
            <div className="flex flex-wrap gap-1">
              {origin.length > 0 ? (
                origin
                  .slice(0, 2)
                  .map((label) => (
                    <LabelChip
                      key={label.id}
                      name={label.name}
                      colorHex={label.colorHex}
                      size="sm"
                    />
                  ))
              ) : (
                <span className="text-[10px] text-muted">não identificada</span>
              )}
            </div>
          </div>

          {dots > 0 && (
            <div className="shrink-0 text-right">
              <p className="mb-1 text-[10px] font-semibold text-muted">
                Confiança {client.sdrConfidence?.toLowerCase()}
              </p>
              <div
                className="flex justify-end gap-0.5"
                title={`Nível de confiança do SDR: ${client.sdrConfidence}`}
              >
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    key={index}
                    className={cx(
                      "size-2 rounded-full",
                      index <= dots ? "bg-accent" : "bg-[var(--surface-sunken)]",
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {others.slice(0, 3).map((label) => (
            <LabelChip key={label.id} name={label.name} colorHex={label.colorHex} size="sm" />
          ))}
        </div>
      )}

      {(client.lastEvent || client.valueCents != null) && (
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2.5">
          {client.lastEvent?.keyword && (
            <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold tracking-wide">
              {client.lastEvent.keyword}
            </span>
          )}
          {client.lastEvent && !client.lastEvent.keyword && (
            <IconClock size={12} className="shrink-0 text-muted" />
          )}
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted">
            {client.lastEvent?.body || "—"}
          </p>
          {client.valueCents != null && (
            <span className="shrink-0 text-[11px] font-bold">
              {formatBRL(client.valueCents)}
            </span>
          )}
        </div>
      )}

      {!overlay && (
        <Link
          href={`/clientes/${client.id}`}
          aria-label={`Abrir ${client.name}`}
          className="icon-btn absolute right-2.5 top-2.5 size-7 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
        >
          <IconArrowUpRight size={14} />
        </Link>
      )}
    </article>
  );
}

/** Wrapper arrastável. Separado para o DragOverlay poder renderizar o card puro. */
export function SortableClientCard({ client }: { client: ClientView }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: client.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <ClientMiniCard client={client} dragging={isDragging} />
    </div>
  );
}
