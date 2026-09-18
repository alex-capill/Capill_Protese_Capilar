"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { IconGrip } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import { useWorkspacePanels, type WorkspacePanelId } from "@/components/workspace/WorkspacePanelsContext";
import type { getFollowupQueue } from "@/lib/queries";

type ListCount = { id: string; name: string; color: string | null; total: number };

/** Deslocamento vertical mínimo do arrasto para contar como "fechar"/"abrir" — abaixo disso, é um clique. */
const DRAG_THRESHOLD = 24;

/**
 * "Onde os cards estão" e "Fila de follow-up", flutuando soltos por cima do
 * conteúdo (`fixed`, aplicado pelo componente pai em `app/page.tsx`, junto
 * com `WorkspacePanelToggles` — os dois dividem a mesma coluna fixa no canto
 * inferior direito).
 *
 * A bandeja de fundo separa os dois cartões do conteúdo de verdade por baixo.
 * Rente ao rodapé da tela (zero respiro, igual à referência) — cresce para
 * cima conforme mais painéis abrem, nunca para baixo. As laterais da bandeja
 * encostam exatamente nas laterais dos cartões (sem `px` extra), com um fundo
 * translúcido e desfocado por trás (`bg-.../70` + `backdrop-blur`).
 *
 * A tarjinha no topo é uma alça de arrastar, como as de bottom sheet: arrastar
 * para baixo recolhe os dois cartões; arrastar para cima ou um clique simples
 * devolve. Isto é um "recolher tudo" — fechar um painel específico continua
 * sendo os ícones em `WorkspacePanelToggles`.
 *
 * Cada cartão tem sua própria alça (ícone de grip) para reorganizar: como só
 * existem 2 painéis, "arrastar pra cima ou pra baixo" só pode significar uma
 * coisa — trocar os dois de posição — então qualquer clique ou arrasto na
 * alça troca a ordem. Se um terceiro tipo de painel for adicionado (o "+" já
 * planejado), isto precisa virar uma lista arrastável de verdade
 * (`@dnd-kit/sortable`, já usado no Funil e em Tarefas) em vez desta troca
 * simples de dois.
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
  const { open, order, swapOrder } = useWorkspacePanels();
  const [collapsed, setCollapsed] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const anyOpen = open["onde-os-cards"] || open["fila-follow-up"];

  if (!anyOpen) return null;

  function handleCollapseDown(event: PointerEvent<HTMLDivElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCollapseUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartY.current == null) return;
    const deltaY = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (deltaY > DRAG_THRESHOLD) setCollapsed(true);
    else if (deltaY < -DRAG_THRESHOLD) setCollapsed(false);
    else setCollapsed((current) => !current);
  }

  const sections: Record<WorkspacePanelId, ReactNode> = {
    "onde-os-cards": (
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ReorderHandle onReorder={swapOrder} label="Onde os cards estão" />
          <p className="text-sm text-muted">Onde os cards estão</p>
        </div>
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
        <div className="mb-4 flex items-center gap-2">
          <ReorderHandle onReorder={swapOrder} label="Fila de follow-up" dark />
          <p className="text-sm text-white/55">Fila de follow-up</p>
        </div>
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

      {!collapsed && (
        <div className="flex flex-col gap-3 pb-3">
          {order.map((id) => open[id] && <div key={id}>{sections[id]}</div>)}
        </div>
      )}
    </div>
  );
}

/** Alça para trocar os dois painéis de lugar — clique ou arrasto, tanto faz (só há uma troca possível). */
function ReorderHandle({ onReorder, label, dark }: { onReorder: () => void; label: string; dark?: boolean }) {
  const dragStartY = useRef<number | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp() {
    if (dragStartY.current == null) return;
    dragStartY.current = null;
    onReorder();
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label={`Reorganizar: trocar "${label}" de posição com o outro painel`}
      title="Arrastar para reorganizar"
      className={cx(
        "flex size-5 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing",
        dark ? "text-white/40 hover:text-white/70" : "text-muted hover:text-text",
      )}
      style={{ touchAction: "none" }}
    >
      <IconGrip size={13} />
    </button>
  );
}
