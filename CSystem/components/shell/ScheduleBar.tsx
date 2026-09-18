"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight, IconBell, IconCalendar } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/primitives";
import { initials } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

/**
 * A barra preta do topo da referência: a agenda do dia em uma linha, com os
 * compromissos como blocos verdes posicionados proporcionalmente ao horário e
 * um marcador da hora atual.
 *
 * Client component porque o marcador do "agora" precisa andar sozinho.
 */

export type ScheduleItem = {
  id: string;
  title: string;
  clientName: string | null;
  startsAt: string; // ISO
  endsAt: string | null; // ISO
  kind: string;
};

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const WINDOW_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function minutesFromStart(date: Date): number {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleBar({ items }: { items: ScheduleItem[] }) {
  const [nowPercent, setNowPercent] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const minutes = minutesFromStart(now);
      // Fora da janela de expediente não faz sentido mostrar o marcador.
      setNowPercent(
        minutes >= 0 && minutes <= WINDOW_MINUTES
          ? (minutes / WINDOW_MINUTES) * 100
          : null,
      );
    }
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#111111] p-1 text-white shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 items-center gap-3 pl-3 pr-1">
        <span className="text-sm font-semibold max-sm:hidden">Sua agenda</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
          <IconCalendar size={13} />
          {today}
        </span>
      </div>

      <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
        {items.length === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/55">
            Nenhum compromisso hoje
          </span>
        ) : (
          items.map((item) => {
            const start = new Date(item.startsAt);
            const end = item.endsAt
              ? new Date(item.endsAt)
              : new Date(start.getTime() + 60 * 60_000);
            const left = clampPercent((minutesFromStart(start) / WINDOW_MINUTES) * 100);
            const right = clampPercent((minutesFromStart(end) / WINDOW_MINUTES) * 100);
            const width = Math.max(right - left, 7);

            return (
              <Link
                key={item.id}
                href="/agenda"
                title={`${formatTime(item.startsAt)} — ${item.title}`}
                className="absolute top-1 flex h-7 items-center gap-1.5 overflow-hidden rounded-full bg-accent px-2.5 text-accent-ink transition hover:brightness-105"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black/15 text-[9px] font-bold">
                  {item.clientName ? initials(item.clientName) : "•"}
                </span>
                <span className="truncate text-xs font-semibold">
                  {formatTime(item.startsAt)} · {item.clientName ?? item.title}
                </span>
              </Link>
            );
          })
        )}

        {nowPercent != null && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-white/70"
            style={{ left: `${nowPercent}%` }}
            aria-hidden="true"
          >
            <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white" />
          </div>
        )}
      </div>

      <Link
        href="/agenda"
        aria-label="Abrir agenda"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
      >
        <IconArrowUpRight size={17} />
      </Link>
      </div>

      <div className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-card)]">
        <ThemeToggle compact />
        <button type="button" className="icon-btn size-8" aria-label="Notificações">
          <span className="relative"><IconBell size={15} /><span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-negative ring-2 ring-surface" /></span>
        </button>
        <Avatar name="Alex" size={34} />
      </div>
    </div>
  );
}
