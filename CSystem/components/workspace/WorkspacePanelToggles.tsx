"use client";

import { IconChart, IconClock } from "@/components/ui/icons";
import { cx } from "@/lib/utils";
import { WORKSPACE_PANELS, useWorkspacePanels, type WorkspacePanelId } from "@/components/workspace/WorkspacePanelsContext";

const PANEL_ICONS: Record<WorkspacePanelId, typeof IconChart> = {
  "onde-os-cards": IconChart,
  "fila-follow-up": IconClock,
};

/**
 * Botões redondos, só ícone, ao lado esquerdo da bandeja de "Onde os cards
 * estão"/"Fila de follow-up" — mostram e ocultam cada um. Ficam soltos
 * (`fixed`) em vez de dentro do rail, porque o rail é de navegação e aparece
 * em toda tela; isto é específico do Workspace.
 *
 * Posicionados ao lado da bandeja (não embaixo dela) de propósito: a bandeja
 * agora fica com `bottom-0` (zero respiro, igual à referência), então não há
 * mais espaço abaixo dela para os ícones — ficar ao lado evita que um cubra o
 * outro em qualquer altura que a bandeja tenha, sem depender de medir a altura
 * dela.
 *
 * ~33% menor que o botão de navegação do rail (32px contra 48px) — o Alex
 * pediu "pelo menos 30% menor". Mesmo padrão visual dos itens do rail: sem
 * fundo enquanto fechado (só o ícone), fundo preto sólido só quando aberto.
 */
export function WorkspacePanelToggles() {
  const { open, toggle } = useWorkspacePanels();

  return (
    <div className="fixed bottom-3 right-[340px] z-30 hidden flex-col gap-2 xl:flex">
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
