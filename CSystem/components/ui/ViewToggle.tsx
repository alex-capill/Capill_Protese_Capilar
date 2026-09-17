"use client";

import { useEffect, useState } from "react";
import { IconColumns, IconList } from "./icons";
import { cx } from "@/lib/utils";

export type ViewMode = "kanban" | "list";

/**
 * Alternador Lista ⇄ Kanban.
 *
 * A escolha fica no localStorage por tela (`storageKey`), porque a preferência
 * do funil e a das tarefas são naturalmente diferentes.
 */
export function useViewMode(storageKey: string, initial: ViewMode = "kanban") {
  const [mode, setMode] = useState<ViewMode>(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "kanban" || saved === "list") setMode(saved);
    } catch {
      // Storage bloqueado: segue com o padrão desta sessão.
    }
  }, [storageKey]);

  function change(next: ViewMode) {
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // idem
    }
  }

  return [mode, change] as const;
}

export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização"
      className="flex items-center gap-1 rounded-full bg-surface-sunken p-1"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        className={cx(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
          mode === "list" ? "bg-surface text-text shadow-[var(--shadow-chip)]" : "text-muted",
        )}
      >
        <IconList size={14} />
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        aria-pressed={mode === "kanban"}
        className={cx(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
          mode === "kanban" ? "bg-surface text-text shadow-[var(--shadow-chip)]" : "text-muted",
        )}
      >
        <IconColumns size={14} />
        Kanban
      </button>
    </div>
  );
}
