"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type WorkspacePanelId = "onde-os-cards" | "fila-follow-up";

export const WORKSPACE_PANELS: { id: WorkspacePanelId; label: string }[] = [
  { id: "onde-os-cards", label: "Onde os cards estão" },
  { id: "fila-follow-up", label: "Fila de follow-up" },
];

const STORAGE_KEY = "csystem-workspace-panels";
const ORDER_STORAGE_KEY = "csystem-workspace-panels-order";
const DEFAULTS: Record<WorkspacePanelId, boolean> = {
  "onde-os-cards": true,
  "fila-follow-up": true,
};
const DEFAULT_ORDER: WorkspacePanelId[] = ["onde-os-cards", "fila-follow-up"];

const WorkspacePanelsCtx = createContext<{
  open: Record<WorkspacePanelId, boolean>;
  toggle: (id: WorkspacePanelId) => void;
  order: WorkspacePanelId[];
  setOrder: (order: WorkspacePanelId[]) => void;
} | null>(null);

/**
 * Mostrar/ocultar "Onde os cards estão" e "Fila de follow-up" — os botões que
 * fazem isso ficam no rail (`Rail.tsx`), mas os painéis em si moram na página
 * do Workspace (`app/page.tsx`). Como rail e página são irmãos no layout (os
 * dois filhos de `AppShell`), o estado precisa de um contexto compartilhado
 * em vez de `useState` local em qualquer um dos dois.
 *
 * Preferência de tela, por navegador — guardada em `localStorage`, nunca no
 * banco.
 */
export function WorkspacePanelsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Record<WorkspacePanelId, boolean>>(DEFAULTS);
  const [order, setOrderState] = useState<WorkspacePanelId[]>(DEFAULT_ORDER);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpen((current) => ({ ...current, ...JSON.parse(raw) }));
    } catch {
      // localStorage pode falhar (aba anônima, storage bloqueado) — fica no padrão (os dois abertos).
    }
    try {
      const raw = localStorage.getItem(ORDER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) setOrderState(parsed);
      }
    } catch {
      // ver comentário acima.
    }
  }, []);

  function toggle(id: WorkspacePanelId) {
    setOpen((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ver comentário acima.
      }
      return next;
    });
  }

  function setOrder(next: WorkspacePanelId[]) {
    setOrderState(next);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ver comentário acima.
    }
  }

  return <WorkspacePanelsCtx.Provider value={{ open, toggle, order, setOrder }}>{children}</WorkspacePanelsCtx.Provider>;
}

export function useWorkspacePanels() {
  const ctx = useContext(WorkspacePanelsCtx);
  if (!ctx) throw new Error("useWorkspacePanels precisa estar dentro de WorkspacePanelsProvider");
  return ctx;
}
