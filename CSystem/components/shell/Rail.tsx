"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
import {
  IconCalendar,
  IconChart,
  IconFunnel,
  IconInbox,
  IconSettings,
  IconTasks,
  IconWorkspace,
} from "@/components/ui/icons";

/**
 * Rail vertical de navegação, como na referência: coluna estreita de botões
 * circulares, o ativo virando um círculo preto sólido.
 */

const ITEMS = [
  { href: "/", label: "Workspace", Icon: IconWorkspace },
  { href: "/funil", label: "Funil", Icon: IconFunnel },
  { href: "/tarefas", label: "Minhas tarefas", Icon: IconTasks },
  { href: "/agenda", label: "Agenda", Icon: IconCalendar },
  { href: "/metricas", label: "Métricas", Icon: IconChart },
  { href: "/entrada-sdr", label: "Entrada SDR", Icon: IconInbox },
  { href: "/configuracoes", label: "Configurações", Icon: IconSettings },
];

export function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 z-30 flex h-dvh shrink-0 flex-col items-center gap-2 px-3 py-6 max-lg:hidden"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex size-11 items-center justify-center rounded-full transition",
              active
                ? "bg-ink text-ink-invert shadow-[var(--shadow-raised)]"
                : "text-muted hover:bg-surface hover:text-text",
            )}
          >
            <Icon size={19} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior no celular — o rail some abaixo de lg. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--border)] bg-surface/95 px-2 py-2 backdrop-blur lg:hidden"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex size-10 items-center justify-center rounded-full transition",
              active ? "bg-ink text-ink-invert" : "text-muted",
            )}
          >
            <Icon size={18} />
          </Link>
        );
      })}
    </nav>
  );
}
