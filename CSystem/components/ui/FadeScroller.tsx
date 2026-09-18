"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

/**
 * Rolagem horizontal com fade nas laterais que ainda têm conteúdo oculto —
 * o mesmo tipo de degradê do brilho no topo da página, só que na horizontal:
 * uma faixa que se dissolve visivelmente na cor do fundo ao redor, não um
 * corte abrupto. `ResizeObserver` recalcula início/fim porque o conteúdo pode
 * mudar de largura (filtro aplicado, fonte carregada).
 *
 * Antes disto usava `mask-image` (apagar a opacidade do próprio conteúdo).
 * Funcionava bem em conteúdo escuro/saturado (chips), mas em fileiras de
 * cards claros sobre fundo quase da mesma cor o efeito ficava imperceptível
 * e parecia um corte reto. Uma faixa de gradiente por cima, na cor real do
 * fundo por trás da fileira (`fadeColor`), garante o mesmo efeito visível em
 * qualquer conteúdo.
 */
export function FadeScroller({
  children,
  className,
  fadeWidth = 88,
  fadeColor = "var(--bg)",
}: {
  children: ReactNode;
  className?: string;
  fadeWidth?: number;
  /** Cor para onde a fileira "some" nas bordas — precisa bater com o fundo real atrás dela (página ou cartão). */
  fadeColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasLeft, setHasLeft] = useState(false);
  const [hasRight, setHasRight] = useState(false);

  function updateEdges() {
    const node = ref.current;
    if (!node) return;
    const tolerance = 2;
    setHasLeft(node.scrollLeft > tolerance);
    setHasRight(node.scrollLeft + node.clientWidth < node.scrollWidth - tolerance);
  }

  useEffect(() => {
    updateEdges();
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div className={cx("relative -mx-[10px] px-[10px]", className)}>
      <div
        ref={ref}
        onScroll={updateEdges}
        className={cx("scroll-row pb-1 pt-[10px]", className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 transition-opacity duration-200"
        style={{
          width: fadeWidth,
          opacity: hasLeft ? 1 : 0,
          background: `linear-gradient(to right, ${fadeColor}, transparent)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 transition-opacity duration-200"
        style={{
          width: fadeWidth,
          opacity: hasRight ? 1 : 0,
          background: `linear-gradient(to left, ${fadeColor}, transparent)`,
        }}
      />
    </div>
  );
}
