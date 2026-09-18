import type { CSSProperties, ReactNode } from "react";
import { labelChipStyle } from "@/lib/colors";
import { cx, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ avatar */

export function Avatar({
  name,
  size = 40,
  color,
}: {
  name: string;
  size?: number;
  color?: string | null;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color ?? "var(--surface-sunken)",
    fontSize: Math.round(size * 0.34),
  };
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-text-soft"
      style={style}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------ etiqueta chip */

export function LabelChip({
  name,
  colorHex,
  size = "md",
}: {
  name: string;
  colorHex: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
      style={labelChipStyle(colorHex)}
    >
      {name}
    </span>
  );
}

/** Ponto sólido da cor da etiqueta — usado quando o espaço é apertado. */
export function LabelDot({ colorHex, title }: { colorHex: string; title: string }) {
  return (
    <span
      className="size-2.5 rounded-full"
      style={{ backgroundColor: colorHex }}
      title={title}
    />
  );
}

/* ---------------------------------------------------------- contador grande */

export function StatCounter({
  value,
  label,
  delta,
  previewDelta,
}: {
  value: number;
  label: string;
  delta: number | null;
  /** Prévia visual temporária; não altera a métrica nem seus dados. */
  previewDelta?: number;
}) {
  const displayedDelta = delta ?? previewDelta ?? null;
  const isPreview = delta == null && previewDelta != null;

  return (
    <div className="flex items-start gap-2">
      <span className="display-title text-[42px] leading-none sm:text-[52px]">{value}</span>
      <div className="flex flex-col gap-1 pt-1">
        {displayedDelta != null && displayedDelta !== 0 && (
          <span
            className={cx(
              "inline-flex w-fit self-start items-center gap-px rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-black",
              displayedDelta > 0
                ? "bg-accent"
                : "bg-negative",
            )}
            title={
              isPreview
                ? "Exemplo visual — não representa uma métrica real"
                : `${displayedDelta > 0 ? "Acima" : "Abaixo"} do mês anterior`
            }
            aria-label={
              isPreview
                ? `Exemplo visual de variação ${displayedDelta > 0 ? "positiva" : "negativa"}`
                : undefined
            }
          >
            {displayedDelta > 0 ? "↑" : "↓"}
            {Math.abs(displayedDelta)}
          </span>
        )}
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- estado vazio */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-semibold text-text">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

/* ----------------------------------------------------- cabeçalho de seção */

export function SectionHeader({
  title,
  count,
  countLabel,
  children,
}: {
  title: string;
  count?: number;
  countLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {count != null && (
        <span className="border-b border-current pb-0.5 text-sm font-semibold text-text-soft">
          {count} {countLabel}
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ aviso */

/**
 * Aviso de amostra pequena — §13 do Protocolo de Verdade.
 * Uma taxa calculada sobre 3 casos não é uma taxa, é uma coincidência.
 */
export function SmallSampleNote({ sample }: { sample: number }) {
  return (
    <span
      className="text-[11px] font-medium text-warning"
      title="Amostra pequena: o número existe, mas ainda não sustenta conclusão."
    >
      amostra de {sample}
    </span>
  );
}

/** Ausência de dado não é dado negativo — §13A. Nunca exibir 0% no lugar. */
export function NoData({ children = "sem dados" }: { children?: ReactNode }) {
  return <span className="text-sm font-medium text-muted">{children}</span>;
}
