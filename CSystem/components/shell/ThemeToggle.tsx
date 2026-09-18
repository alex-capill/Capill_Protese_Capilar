"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/utils";

type Theme = "light" | "dark";

/**
 * Alterna claro/escuro. O tema já foi aplicado pelo script inline do layout;
 * aqui só lemos o que está no <html> para o ícone não começar errado.
 */
export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    // A fonte de verdade é o atributo do documento. Assim o primeiro clique
    // funciona mesmo se ele acontecer antes do useEffect sincronizar o estado
    // React com o tema que o script do layout aplicou antes da hidratação.
    const current = document.documentElement.getAttribute("data-theme");
    const next: Theme = current === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("csystem-theme", next);
    } catch {
      // Navegação privada ou storage bloqueado: o tema vale só para esta sessão.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cx("icon-btn", compact ? "size-8" : "size-11", className)}
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-pressed={theme === "dark"}
    >
      {/* Antes de montar, renderiza o sol: evita divergência de hidratação. */}
      {mounted && theme === "dark" ? <MoonIcon compact={compact} /> : <SunIcon compact={compact} />}
    </button>
  );
}

function SunIcon({ compact }: { compact: boolean }) {
  return (
    <svg width={compact ? 15 : 18} height={compact ? 15 : 18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ compact }: { compact: boolean }) {
  return (
    <svg width={compact ? 15 : 18} height={compact ? 15 : 18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
