"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, LabelChip } from "@/components/ui/primitives";
import { IconArrowUpRight } from "@/components/ui/icons";
import { cx, formatBRL } from "@/lib/utils";
import type { ClientView } from "@/lib/view-types";
import { updateClientAction } from "@/app/actions/clients";
import { normalizeTemperature, temperatureFromSdrConfidence } from "@/lib/temperature";
import { TemperatureControl } from "@/components/ui/TemperatureControl";

/**
 * O card de cliente no Kanban — o "New Leads" da referência: avatar, nome,
 * subtítulo, bloco de origem com as etiquetas e a escala em bolinhas.
 *
 * A temperatura começa com o nível declarado pelo SDR e pode ser ajustada
 * manualmente pelo Alex conforme a interação. A confiança original permanece separada.
 */

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
  const [, startTransition] = useTransition();
  const origin = client.labels.filter((label) => label.group === "ORIGEM");
  const others = client.labels.filter((label) => label.group !== "ORIGEM");
  // Cards anteriores à coluna nova mantêm o dado original do SDR. Exibir a
  // conversão direta evita que pareçam sem classificação até o próximo repasse.
  // `rawTemperature` (não a conversão) é o que orienta o próximo clique — ver
  // o comentário em TemperatureControl.tsx.
  const rawTemperature = normalizeTemperature(client.temperature);
  const displayTemperature = rawTemperature ?? temperatureFromSdrConfidence(client.sdrConfidence);

  return (
    <article
      onDoubleClick={() => router.push(`/clientes/${client.id}`)}
      className={cx(
        "group relative flex min-h-[196px] cursor-pointer flex-col rounded-[26px] rounded-tr-[8px] bg-surface p-[18px] shadow-[var(--shadow-card)] transition",
        overlay && "rotate-2 shadow-[var(--shadow-raised)]",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={client.name} size={42} />
        <div className="min-w-0 flex-1 pr-6">
          <p className="truncate text-[17px] font-normal leading-tight">{client.name}</p>
          <p className="mt-1 truncate text-[13px] text-muted">
            {client.city ?? "Cidade não informada"}
            {client.modality === "online" && " · Online"}
            {client.modality === "studio" && " · Studio"}
          </p>
        </div>
      </div>

      {origin.length > 0 && (
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-normal text-muted">
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

        </div>
      )}

      {others.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {others.slice(0, 3).map((label) => (
            <LabelChip key={label.id} name={label.name} colorHex={label.colorHex} size="sm" />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--border)] pt-2.5">
        <div className="min-w-0">
          <TemperatureControl
            value={rawTemperature}
            displayValue={displayTemperature}
            clientName={client.name}
            onChange={(next) => startTransition(() => void updateClientAction(client.id, { temperature: next }))}
            className="-ml-2 -my-1 px-2 py-1"
          />
        </div>
        {client.valueCents != null && <span className="shrink-0 text-[14px] font-medium">{formatBRL(client.valueCents)}</span>}
      </div>

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
