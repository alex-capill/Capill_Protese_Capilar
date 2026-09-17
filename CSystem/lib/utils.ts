/** Junta classes ignorando falsy — versão mínima do clsx. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** `crypto` global existe no Node 19+ e no navegador — este módulo roda nos dois. */
export function newId(): string {
  return crypto.randomUUID();
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Iniciais para o avatar do card: "João Paulo Silva" -> "JS". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Posição fracionária entre dois vizinhos — é assim que o arrasto reordena sem
 * precisar reescrever a coluna inteira a cada movimento.
 */
export function positionBetween(before: number | null, after: number | null): number {
  if (before == null && after == null) return 1000;
  if (before == null) return (after as number) - 1000;
  if (after == null) return before + 1000;
  return (before + after) / 2;
}

export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Lê "1.800", "R$1800,50" ou "1800" e devolve centavos. */
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

export function pluralize(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
