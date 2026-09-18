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
 * "Fila de follow-up". Não tem posição própria: quem posiciona é o pai
 * (`app/page.tsx`), que os empilha por cima da bandeja de painéis
 * (`WorkspacePanels`) na mesma coluna fixa no canto inferior direito da tela.
 * Assim os dois sempre ficam na mesma extremidade, e os ícones sobem
 * automaticamente conforme a bandeja cresce, sem precisar medir a altura dela.
 *
 * ~33% menor que o botão de navegação do rail (32px contra 48px) — o Alex
 * pediu "pelo menos 30% menor". Mesmo padrão visual dos itens do rail: sem
 * fundo enquanto fechado (só o ícone), fundo preto sólido só quando aberto.
 */
export function WorkspacePanelToggles() {
  const { open, toggle } = useWorkspacePanels();

  return (
    <div className="hidden flex-col gap-2 xl:flex">
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
