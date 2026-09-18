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
 *
 * `value` é o dado de verdade (o que foi classificado manualmente, ou `null`
 * se nunca foi) — é dele que o próximo clique parte. `displayValue` é só o
 * que aparece nas bolinhas/rótulo antes do primeiro clique: quando não há
 * classificação manual, os cards mostram a conversão direta da confiança do
 * SDR (`temperatureFromSdrConfidence`) para não parecerem "sem dado". Sem
 * separar os dois, o primeiro clique partia do valor exibido (ex.: "Quente",
 * herdado do SDR) em vez do valor real (`null`) — o ciclo pulava direto para
 * "Classificar" em vez de avançar para "Frio", parecendo que o clique não
 * fazia nada.
 */
export function TemperatureControl({
  value,
  displayValue,
  onChange,
  clientName,
  className,
  size = "card",
}: {
  value: Temperature | null;
  /** O que mostrar quando `value` for `null` (ex.: a conversão do SDR). Default: `value`. */
  displayValue?: Temperature | null;
  onChange: (value: Temperature | null) => void;
  clientName?: string;
  className?: string;
  /** A edição ganha pontos levemente maiores para facilitar o clique. */
  size?: "card" | "edit";
}) {
  const shown = displayValue ?? value;
  const dots = shown ? TEMPERATURE_DOTS[shown] : 0;
  const label = shown ? TEMPERATURE_LABEL[shown] : "Classificar";
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
