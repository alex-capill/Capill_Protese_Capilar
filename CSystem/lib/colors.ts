/**
 * Paleta das etiquetas.
 *
 * Os 16 tons abaixo são o atalho do seletor de cor — mas o campo aceita
 * qualquer hex, então o Alex não fica preso a eles.
 *
 * Cada tom tem um par claro/escuro para continuar legível nos dois temas:
 * `bg`/`fg` são usados no chip da etiqueta, `dot` no ponto sólido.
 */

import type { CSSProperties } from "react";

export type Swatch = {
  id: string;
  name: string;
  hex: string;
};

export const SWATCHES: Swatch[] = [
  { id: "lime", name: "Limão", hex: "#C9F24D" },
  { id: "green", name: "Verde", hex: "#4CC38A" },
  { id: "teal", name: "Verde-água", hex: "#2DD4BF" },
  { id: "sky", name: "Céu", hex: "#5AC8FA" },
  { id: "cyan", name: "Ciano", hex: "#22B8CF" },
  { id: "blue", name: "Azul", hex: "#3B82F6" },
  { id: "indigo", name: "Índigo", hex: "#6366F1" },
  { id: "violet", name: "Violeta", hex: "#A855F7" },
  { id: "pink", name: "Rosa", hex: "#EC4899" },
  { id: "red", name: "Vermelho", hex: "#EF4444" },
  { id: "maroon", name: "Vinho", hex: "#9F1239" },
  { id: "orange", name: "Laranja", hex: "#F97316" },
  { id: "amber", name: "Âmbar", hex: "#F59E0B" },
  { id: "yellow", name: "Amarelo", hex: "#EAB308" },
  { id: "slate", name: "Ardósia", hex: "#64748B" },
  { id: "graphite", name: "Grafite", hex: "#3F3F46" },
];

/** Aceita "#abc", "#aabbcc" ou "aabbcc". Retorna null se não for hex válido. */
export function parseHex(input: string): string | null {
  const value = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    const [r, g, b] = value.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toUpperCase()}`;
  return null;
}

function toRgb(hex: string): [number, number, number] {
  const normalized = parseHex(hex) ?? "#64748B";
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

/** Luminância relativa (WCAG) — usada para escolher texto claro ou escuro. */
export function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Texto preto ou branco sobre a cor — o que tiver mais contraste. */
export function readableInk(hex: string): string {
  return luminance(hex) > 0.45 ? "#14200A" : "#FFFFFF";
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Estilo do chip da etiqueta: fundo translúcido da própria cor, texto na cor
 * cheia. Funciona nos dois temas sem precisar de borda ou de duas paletas.
 */
export function labelChipStyle(hex: string): CSSProperties {
  return {
    backgroundColor: rgba(hex, 0.2),
    color: luminance(hex) > 0.45 ? readableInk(hex) : hex,
  };
}

/** Estilo do chip sólido — usado quando a etiqueta é o elemento principal. */
export function labelSolidStyle(hex: string): CSSProperties {
  return { backgroundColor: hex, color: readableInk(hex) };
}
