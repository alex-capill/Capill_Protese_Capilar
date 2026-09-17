"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

/**
 * Menu suspenso simples: fecha no clique fora e no Esc, e devolve o foco ao
 * gatilho. Suficiente para os menus de coluna e de card, sem trazer uma
 * biblioteca de overlay inteira para o projeto.
 */
export function Menu({
  trigger,
  children,
  align = "end",
  width = 220,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
  align?: "start" | "end";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          role="menu"
          style={{ width }}
          className={cx(
            "absolute top-[calc(100%+6px)] z-50 overflow-hidden rounded-[var(--radius-inner)] border border-[var(--border)] bg-surface p-1.5 shadow-[var(--shadow-raised)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  children,
  danger,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left text-sm font-medium transition disabled:opacity-40",
        danger ? "text-negative hover:bg-negative/10" : "text-text hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-[var(--border)]" />;
}
