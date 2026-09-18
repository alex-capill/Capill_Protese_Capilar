"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { cx } from "@/lib/utils";
import { useWorkspacePanels } from "@/components/workspace/WorkspacePanelsContext";
import type { getFollowupQueue } from "@/lib/queries";

type ListCount = { id: string; name: string; color: string | null; total: number };

/** Deslocamento vertical mínimo do arrasto para contar como "fechar"/"abrir" — abaixo disso, é um clique. */
const DRAG_THRESHOLD = 24;

/**
 * "Onde os cards estão" e "Fila de follow-up", flutuando soltos por cima do
 * conteúdo (`fixed`) — não mais numa coluna de grade reservada, porque as
 * fileiras de Novos Leads e Minhas Tarefas ocupam a largura inteira da tela.
 *
 * A bandeja de fundo separa os dois cartões do conteúdo de verdade por baixo.
 * Presa embaixo à direita, rente ao rodapé da tela (`bottom-0`, zero respiro,
 * igual à referência) — cresce para cima conforme mais painéis abrem, nunca
 * para baixo. Os dois ícones de mostrar/ocultar ficaram ao lado dela em vez de
 * embaixo (`WorkspacePanelToggles`), porque não sobra espaço abaixo dela para
 * eles com `bottom-0`. As laterais da bandeja encostam exatamente nas laterais
 * dos cartões (sem `px` extra) — referência que o Alex mandou de um widget de
 * chamada com resumo embaixo, com um fundo translúcido e desfocado por trás
 * (`bg-.../70` + `backdrop-blur`), não um fundo sólido.
 *
 * A tarjinha no topo é uma alça de arrastar, como as de bottom sheet: arrastar
 * para baixo recolhe os dois cartões (só a tarjinha fica visível, presa no
 * mesmo lugar); arrastar para cima devolve. Um clique simples (sem arrastar)
 * alterna do mesmo jeito. Isto é um "recolher tudo" por cima do que cada botão
 * do rail já controla — fechar um painel específico continua sendo os ícones
 * do canto inferior direito; a tarjinha nunca decide QUAIS painéis aparecem,
 * só se a bandeja está expandida ou minimizada.
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
  const { open } = useWorkspacePanels();
  const [collapsed, setCollapsed] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const anyOpen = open["onde-os-cards"] || open["fila-follow-up"];

  if (!anyOpen) return null;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartY.current == null) return;
    const deltaY = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (deltaY > DRAG_THRESHOLD) setCollapsed(true);
    else if (deltaY < -DRAG_THRESHOLD) setCollapsed(false);
    else setCollapsed((current) => !current);
  }

  return (
    <div className="fixed bottom-0 right-8 z-30 hidden w-[300px] flex-col rounded-t-[var(--radius-card)] bg-[color-mix(in_srgb,var(--surface-sunken)_70%,transparent)] shadow-[var(--shadow-raised)] backdrop-blur-md xl:flex">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mostrar janelas" : "Recolher janelas"}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
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
          {open["onde-os-cards"] && (
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
          )}

          {open["fila-follow-up"] && (
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
          )}
        </div>
      )}
    </div>
  );
}
