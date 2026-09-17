"use client";

import { useState } from "react";
import { parseHex, readableInk, SWATCHES } from "@/lib/colors";
import { cx } from "@/lib/utils";
import { IconCheck } from "./icons";

/**
 * Seletor de cor das etiquetas: 16 tons prontos + campo hex livre.
 *
 * Os tons prontos cobrem o dia a dia; o campo livre existe para o Alex não
 * ficar preso à paleta se quiser a cor exata de alguma coisa.
 */
export function ColorPicker({
  value,
  onChange,
  label = "Cor",
}: {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}) {
  const [custom, setCustom] = useState(value);
  const [error, setError] = useState<string | null>(null);

  function commitCustom(raw: string) {
    setCustom(raw);
    const parsed = parseHex(raw);
    if (parsed) {
      setError(null);
      onChange(parsed);
    } else {
      setError("Use o formato #RRGGBB");
    }
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium">{label}</span>

      <div className="grid grid-cols-8 gap-2">
        {SWATCHES.map((swatch) => {
          const selected = value.toUpperCase() === swatch.hex.toUpperCase();
          return (
            <button
              key={swatch.id}
              type="button"
              title={swatch.name}
              aria-label={swatch.name}
              aria-pressed={selected}
              onClick={() => {
                setCustom(swatch.hex);
                setError(null);
                onChange(swatch.hex);
              }}
              className={cx(
                "flex aspect-square items-center justify-center rounded-full transition",
                selected
                  ? "ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]"
                  : "hover:scale-110",
              )}
              style={{ backgroundColor: swatch.hex }}
            >
              {selected && (
                <IconCheck size={14} style={{ color: readableInk(swatch.hex) }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="size-9 shrink-0 rounded-full border border-[var(--border)]"
          style={{ backgroundColor: parseHex(custom) ?? value }}
          aria-hidden="true"
        />
        <input
          value={custom}
          onChange={(event) => commitCustom(event.target.value)}
          placeholder="#C9F24D"
          spellCheck={false}
          aria-label="Cor personalizada em hexadecimal"
          className="field font-mono text-sm"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </div>
  );
}
