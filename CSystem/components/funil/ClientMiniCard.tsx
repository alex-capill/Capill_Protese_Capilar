"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, LabelChip } from "@/components/ui/primitives";
import { IconArrowUpRight, IconFlame } from "@/components/ui/icons";
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
const CONFIDENCE_COLORS = ["#F04949", "#F47D49", "#F0A849", "#D8F55A", "#B9FF66"];
// Rótulo de interface (decisão do Alex, 18/09/2026): mapeamento 1:1 com
// sdr_confidence, sem cálculo novo. Detalhe em docs/CONTEXTO_DE_CONTINUIDADE.md.
const CONFIDENCE_LABEL: Record<string, string> = { ALTA: "Quente", MODERADA: "Morno", BAIXA: "Frio" };

export function ClientMiniCard({
  client,
  dragging,
  overlay,
}: {
  client: ClientView;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const router = useRouter();
  const origin = client.labels.filter((label) => label.group === "ORIGEM");
  const others = client.labels.filter((label) => label.group !== "ORIGEM");
  const dots = client.sdrConfidence ? (CONFIDENCE_DOTS[client.sdrConfidence] ?? 0) : 0;

  return (
    <article
      onDoubleClick={() => router.push(`/clientes/${client.id}`)}
      className={cx(
        "group relative flex min-h-[188px] cursor-pointer flex-col rounded-[26px] rounded-tr-[8px] bg-surface p-4 shadow-[var(--shadow-card)] transition",
        overlay && "rotate-2 shadow-[var(--shadow-raised)]",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={client.name} size={42} />
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
        <div className="mt-3.5 flex items-start justify-between gap-2">
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
                {client.sdrConfidence ? (CONFIDENCE_LABEL[client.sdrConfidence] ?? client.sdrConfidence) : ""}
              </p>
              <div
                className="flex items-center justify-end gap-0.5"
                title={`Nível de confiança do SDR: ${client.sdrConfidence}`}
              >
                {[1, 2, 3, 4, 5].map((index) => (
                  <span
                    key={index}
                    className={cx(
                      "size-2.5 rounded-full transition-colors",
                      index > dots && "bg-[var(--surface-sunken)]",
                    )}
                    style={
                      index <= dots ? { backgroundColor: CONFIDENCE_COLORS[index - 1] } : undefined
                    }
                  />
                ))}
                {dots === 5 && (
                  <IconFlame
                    size={12}
                    className="ml-0.5 text-[#F0A849]"
                    aria-label="Confiança alta do SDR"
                  />
                )}
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

      {client.valueCents != null && (
        <div className="mt-auto flex justify-end border-t border-[var(--border)] pt-2.5">
          <span className="text-[11px] font-bold">{formatBRL(client.valueCents)}</span>
        </div>
      )}

      {!overlay && (
        <div className="absolute -right-2 -top-2 z-10 flex size-12 items-center justify-center rounded-full bg-bg">
          <Link
            href={`/clientes/${client.id}`}
            aria-label={`Abrir ${client.name}`}
            className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-text shadow-[var(--shadow-chip)] transition hover:bg-ink hover:text-ink-invert"
          >
            <IconArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </article>
  );
}

/** Wrapper arrastável. Separado para o DragOverlay poder renderizar o card puro. */
export function SortableClientCard({ client }: { client: ClientView }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: client.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onDoubleClick={() => router.push(`/clientes/${client.id}`)}
      className="touch-none"
    >
      <ClientMiniCard client={client} dragging={isDragging} />
    </div>
  );
}
