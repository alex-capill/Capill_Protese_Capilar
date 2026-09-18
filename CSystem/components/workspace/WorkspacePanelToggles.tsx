"use client";

import { IconChart, IconClock } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import { WORKSPACE_PANELS, useWorkspacePanels, type WorkspacePanelId } from "@/components/workspace/WorkspacePanelsContext";

const PANEL_ICONS: Record<WorkspacePanelId, typeof IconChart> = {
  "onde-os-cards": IconChart,
  "fila-follow-up": IconClock,
};

/**
 * Botões redondos, só ícone — mostram e ocultam "Onde os cards estão" e
 * "Fila de follow-up". Posição própria e FIXA (`fixed bottom-3 right-8`), de
 * propósito: já foram empilhados por cima da bandeja de painéis
 * (`WorkspacePanels`) numa coluna só, mas o Alex reportou que isso os fazia
 * subir e descer junto com ela conforme ela cresce/recolhe/reordena — ele
 * queria os ícones parados, sempre no mesmo lugar.
 *
 * Ficam na extremidade direita de verdade agora (`right-8`, a mesma borda que
 * a bandeja tinha antes) — a bandeja (`WorkspacePanels`) que abriu espaço,
 * deslocada mais para a esquerda (`right-[76px]`) para não ficar embaixo dos
 * ícones, já que os dois têm `bottom-0`/`bottom-3` próximos.
 *
 * ~33% menor que o botão de navegação do rail (32px contra 48px) — o Alex
 * pediu "pelo menos 30% menor". Mesmo padrão visual dos itens do rail: sem
 * fundo enquanto fechado (só o ícone), fundo preto sólido só quando aberto.
 */
export function WorkspacePanelToggles() {
  const { open, toggle } = useWorkspacePanels();

  return (
    <div className="fixed bottom-3 right-8 z-30 hidden flex-col gap-2 xl:flex">
      {WORKSPACE_PANELS.map(({ id, label }) => {
        const Icon = PANEL_ICONS[id];
        const isOpen = open[id];
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={isOpen ? `Ocultar ${label}` : `Mostrar ${label}`}
            aria-pressed={isOpen}
            onClick={() => toggle(id)}
            className={cx(
              "flex size-8 items-center justify-center rounded-full transition",
              isOpen
                ? "bg-ink text-ink-invert shadow-[var(--shadow-raised)]"
                : "text-muted hover:bg-surface hover:text-text",
            )}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}
