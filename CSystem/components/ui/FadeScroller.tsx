"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

/**
 * Rolagem horizontal com fade suave nas laterais que ainda têm conteúdo oculto.
 *
 * Extraído do filtro de etiquetas do Funil, que foi o primeiro lugar a resolver
 * isto: a máscara apaga o próprio conteúdo (não é uma faixa por cima), então não
 * deixa uma linha de transição visível. `ResizeObserver` recalcula início/fim
 * porque o conteúdo pode mudar de largura (filtro aplicado, fonte carregada).
 *
 * Reaproveitado nas fileiras roláveis do Workspace e das Tarefas para o mesmo
 * comportamento aparecer em todo lugar onde a referência corta cards na borda.
 */
export function FadeScroller({
  children,
  className,
  fadeWidth = 88,
}: {
  children: ReactNode;
  className?: string;
  fadeWidth?: number;
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

  const width = `${fadeWidth}px`;
  const maskImage = hasLeft
    ? hasRight
      ? `linear-gradient(to right, transparent, black ${width}, black calc(100% - ${width}), transparent)`
      : `linear-gradient(to right, transparent, black ${width})`
    : hasRight
      ? `linear-gradient(to right, black calc(100% - ${width}), transparent)`
      : undefined;
  const fadeStyle: CSSProperties | undefined = maskImage
    ? { maskImage, WebkitMaskImage: maskImage }
    : undefined;

  return (
    <div
      ref={ref}
      onScroll={updateEdges}
      className={cx("scroll-row px-[10px] pb-1 pt-[10px] -mx-[10px]", className)}
      style={fadeStyle}
    >
      {children}
    </div>
  );
}
