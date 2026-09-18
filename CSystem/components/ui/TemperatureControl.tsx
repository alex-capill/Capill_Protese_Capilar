"use client";

import { IconFlame } from "@/components/ui/icons";
import {
  TEMPERATURE_COLORS,
  TEMPERATURE_DOTS,
  TEMPERATURE_LABEL,
  nextTemperature,
  type Temperature,
} from "@/lib/temperature";
import { cx } from "@/lib/utils";

/**
 * Um único controle para a temperatura no card e no diálogo de edição.
 * Cada clique avança: Classificar → Frio → Morno → Quente → Classificar.
 */
export function TemperatureControl({
  value,
  onChange,
  clientName,
  className,
  size = "card",
}: {
  value: Temperature | null;
  onChange: (value: Temperature | null) => void;
  clientName?: string;
  className?: string;
  /** A edição ganha pontos levemente maiores para facilitar o clique. */
  size?: "card" | "edit";
}) {
  const dots = value ? TEMPERATURE_DOTS[value] : 0;
  const label = value ? TEMPERATURE_LABEL[value] : "Classificar";
  const next = nextTemperature(value);

  return (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onChange(next);
      }}
      aria-label={`Temperatura${clientName ? ` de ${clientName}` : ""}: ${label}. Clique para ${next ? TEMPERATURE_LABEL[next].toLowerCase() : "limpar a classificação"}.`}
      title={`Temperatura: ${label}. Clique para alternar.`}
      className={cx(
        "temperature-control inline-flex items-center gap-2 rounded-[var(--radius-inner)] text-left transition hover:bg-surface-2",
        className,
      )}
    >
      <span className={cx("text-muted", size === "edit" ? "text-sm" : "text-[11px]")}>{label}</span>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <span
            key={index}
            className={cx(size === "edit" ? "size-2.5" : "size-2", "rounded-full", index <= dots ? undefined : "bg-[var(--surface-sunken)]")}
            style={index <= dots ? { backgroundColor: TEMPERATURE_COLORS[index - 1] } : undefined}
          />
        ))}
        {dots === 5 && <IconFlame size={size === "edit" ? 13 : 11} className="ml-0.5 text-[#F0A849]" />}
      </span>
    </button>
  );
}
