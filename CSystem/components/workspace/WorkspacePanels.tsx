"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGrip } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import { useWorkspacePanels, type WorkspacePanelId } from "@/components/workspace/WorkspacePanelsContext";
import type { getFollowupQueue } from "@/lib/queries";

type ListCount = { id: string; name: string; color: string | null; total: number };

/** Deslocamento vertical mínimo do arrasto para contar como "fechar"/"abrir" a bandeja inteira — abaixo disso, é um clique. */
const COLLAPSE_DRAG_THRESHOLD = 24;

/**
 * "Onde os cards estão" e "Fila de follow-up", flutuando soltos por cima do
 * conteúdo (`fixed`, aplicado pelo componente pai em `app/page.tsx`).
 *
 * A bandeja de fundo separa os dois cartões do conteúdo de verdade por baixo.
 * Rente ao rodapé da tela (zero respiro, igual à referência) — cresce para
 * cima conforme mais painéis abrem, nunca para baixo. As laterais da bandeja
 * encostam exatamente nas laterais dos cartões (sem `px` extra), com um fundo
 * translúcido e desfocado por trás (`bg-.../70` + `backdrop-blur`).
 *
 * A tarjinha no topo recolhe/expande os dois cartões de uma vez (arrastar para
 * baixo recolhe, para cima ou um clique simples expande) com uma transição
 * suave de altura (técnica `grid-template-rows` — anima para/de `auto` sem
 * JS medindo altura). Fechar um painel específico continua sendo os ícones em
 * `WorkspacePanelToggles`.
 *
 * Reorganizar os cartões é arrasto de verdade, com `@dnd-kit/sortable` (a
 * mesma biblioteca do Kanban do Funil e das colunas de Tarefas) — pega,
 * arrasta, solta, encaixa suavemente. Um clique sem mover não reordena
 * (`PointerSensor` com `activationConstraint.distance`), então abrir o card
 * clicando não dispara um arrasto sem querer.
 */
export function WorkspacePanels({
  counts,
  max,
  followups,
}: {
  counts: ListCount[];
  max: number;
  followups: ReturnType<typeof getFollowupQueue>;
}) {
  const { open, order, setOrder } = useWorkspacePanels();
  const [collapsed, setCollapsed] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const anyOpen = open["onde-os-cards"] || open["fila-follow-up"];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!anyOpen) return null;

  function handleCollapseDown(event: PointerEvent<HTMLDivElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCollapseUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartY.current == null) return;
    const deltaY = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (deltaY > COLLAPSE_DRAG_THRESHOLD) setCollapsed(true);
    else if (deltaY < -COLLAPSE_DRAG_THRESHOLD) setCollapsed(false);
    else setCollapsed((current) => !current);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id as WorkspacePanelId);
    const to = order.indexOf(over.id as WorkspacePanelId);
    if (from === -1 || to === -1) return;
    setOrder(arrayMove(order, from, to));
  }

  const visibleOrder = order.filter((id) => open[id]);

  const sections: Record<WorkspacePanelId, ReactNode> = {
    "onde-os-cards": (
      <section className="card p-5">
        <p className="mb-4 text-sm text-muted">Onde os cards estão</p>
        <div className="space-y-3">
          {counts.length === 0 ? (
            <p className="text-sm text-muted">Nenhum card ativo.</p>
          ) : (
            counts.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-semibold tabular-nums">{item.total}</span>
                </div>
                <span className="block h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(item.total / max) * 100}%`, backgroundColor: item.color ?? "var(--muted)" }}
                  />
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    ),
    "fila-follow-up": (
      <section className="rounded-[var(--radius-card)] bg-[#111111] p-5 text-white shadow-[var(--shadow-card)]">
        <p className="mb-4 text-sm text-white/55">Fila de follow-up</p>
        {followups.length === 0 ? (
          <p className="text-sm text-white/55">Nenhum retorno marcado.</p>
        ) : (
          <div className="space-y-3">
            {followups.map((item) => {
              const date = item.nextFollowupAt ? new Date(item.nextFollowupAt) : null;
              const overdue = date != null && date < new Date();
              return (
                <Link
                  key={item.id}
                  href={`/clientes/${item.id}`}
                  className="flex items-center gap-2.5 rounded-xl transition hover:bg-white/10"
                >
                  <span
                    className={cx(
                      "flex size-9 shrink-0 flex-col items-center justify-center rounded-full text-[11px] leading-none",
                      overdue ? "bg-negative text-white" : "bg-white/10",
                    )}
                  >
                    <span>{date?.getDate() ?? "—"}</span>
                    <small className="mt-0.5 opacity-70">
                      {date?.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") ?? ""}
                    </small>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.name}</span>
                    <span className="block truncate text-xs text-white/55">{item.listName}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    ),
  };

  return (
    <div className="flex w-[300px] flex-col rounded-t-[var(--radius-card)] bg-[color-mix(in_srgb,var(--surface-sunken)_70%,transparent)] shadow-[var(--shadow-raised)] backdrop-blur-md">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mostrar janelas" : "Recolher janelas"}
        onPointerDown={handleCollapseDown}
        onPointerUp={handleCollapseUp}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setCollapsed((current) => !current);
        }}
        className="flex cursor-grab items-center justify-center py-2.5 active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
      </div>

      {/* Truque de "grid-template-rows: 0fr ⇄ 1fr" anima pra/de altura automática
          sem JS medindo pixel — o `overflow-hidden` do filho impede que o
          conteúdo vaze durante a transição. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3 pb-3">
                {visibleOrder.map((id) => (
                  <SortablePanel key={id} id={id}>
                    {sections[id]}
                  </SortablePanel>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

/** Envelope arrastável de um painel — a alça (grip) fica sobreposta no canto do cartão. */
function SortablePanel({ id, children }: { id: WorkspacePanelId; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const dark = id === "fila-follow-up";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx("relative", isDragging && "z-10 opacity-70")}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Arrastar "${id === "onde-os-cards" ? "Onde os cards estão" : "Fila de follow-up"}" para reorganizar`}
        title="Arrastar para reorganizar"
        className={cx(
          "absolute right-3 top-3 z-10 flex size-6 cursor-grab touch-none items-center justify-center rounded active:cursor-grabbing",
          dark ? "text-white/40 hover:text-white/70" : "text-muted hover:text-text",
        )}
      >
        <IconGrip size={13} />
      </button>
      {children}
    </div>
  );
}
