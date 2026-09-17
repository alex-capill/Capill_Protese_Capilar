"use client";

import { useEffect, useState, useTransition } from "react";
import { undoMoveAction } from "@/app/actions/clients";
import { IconUndo } from "@/components/ui/icons";

const TIMEOUT_MS = 9000;

/**
 * Aviso de "movi o card" com desfazer, por alguns segundos.
 *
 * Desfazer apaga a transição em vez de gravar um movimento de volta — o arrasto
 * foi um engano, não um passo do cliente no funil. Gravar os dois inflaria a
 * contagem do período.
 */
export function UndoToast({
  undo,
  onDone,
}: {
  undo: { transitionId: string; label: string };
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onDone, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [undo.transitionId, onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-ink-invert shadow-[var(--shadow-raised)] max-lg:bottom-20"
    >
      <span className="text-sm font-medium">{done ? "Movimento desfeito" : undo.label}</span>
      {!done && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await undoMoveAction(undo.transitionId);
              if (result.ok) {
                setDone(true);
                setTimeout(onDone, 1500);
              } else {
                onDone();
              }
            })
          }
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition hover:bg-white/25 disabled:opacity-50"
        >
          <IconUndo size={13} />
          {pending ? "Desfazendo…" : "Desfazer"}
        </button>
      )}
    </div>
  );
}
