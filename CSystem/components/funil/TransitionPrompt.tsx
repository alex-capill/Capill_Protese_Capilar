"use client";

import { useState, useTransition } from "react";
import { undoMoveAction } from "@/app/actions/clients";
import { confirmTransitionEventAction } from "@/app/actions/events";
import { Dialog } from "@/components/ui/Dialog";
import { IconUndo } from "@/components/ui/icons";
import {
  KEYWORD_INFO,
  MOTIVO_NAO_IDENTIFICADO,
  REASONS,
  type Keyword,
} from "@/lib/keywords";
import { cx } from "@/lib/utils";

/**
 * O balão que aparece depois de soltar um card.
 *
 * LEIA ISTO ANTES DE MEXER: a métrica JÁ FOI GRAVADA quando o card foi solto.
 * Este diálogo só acrescenta o registro qualitativo — a palavra-chave no
 * histórico, o motivo de uma hesitação, a data de uma avaliação. Fechar sem
 * preencher é uma escolha legítima e não perde nenhum número.
 *
 * É por isso que o botão secundário se chama "Só mover" e não "Cancelar".
 */

export type PromptState = {
  transitionId: string;
  clientId: string;
  clientName: string;
  toListName: string;
  suggestions: Keyword[];
  asksForDate: boolean;
};

export function TransitionPrompt({
  state,
  onClose,
}: {
  state: PromptState;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState<Keyword | null>(state.suggestions[0] ?? null);
  const [body, setBody] = useState("");
  const [reason, setReason] = useState<string>(MOTIVO_NAO_IDENTIFICADO);
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsReason = keyword ? KEYWORD_INFO[keyword].pedeMotivo : false;

  function save() {
    if (!keyword && !state.asksForDate) {
      onClose();
      return;
    }

    startTransition(async () => {
      const result = await confirmTransitionEventAction({
        transitionId: state.transitionId,
        clientId: state.clientId,
        keyword: keyword ?? "OUTRO",
        body,
        reason: needsReason ? reason : null,
        scheduledAtISO: state.asksForDate && scheduledAt ? scheduledAt : null,
      });

      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  /**
   * Desfazer daqui, e não só pelo toast: enquanto este diálogo está aberto ele
   * cobre o toast, que expira em segundos. E é justamente aqui, lendo "Fulano →
   * LISTA", que se percebe ter arrastado o card errado.
   */
  function undo() {
    startTransition(async () => {
      const result = await undoMoveAction(state.transitionId);
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${state.clientName} → ${state.toListName}`}
      description="O movimento já foi contabilizado. Isto aqui é o registro do porquê — opcional."
      width={480}
      footer={
        <>
          <button
            type="button"
            onClick={undo}
            disabled={pending}
            className="mr-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-negative transition hover:bg-negative/10 disabled:opacity-50"
          >
            <IconUndo size={15} />
            Desfazer movimento
          </button>
          <button type="button" onClick={onClose} className="chip chip-off">
            Só mover
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="btn-ink px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Registrar"}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {state.suggestions.length > 0 && (
          <div>
            <span className="mb-2 block text-sm font-medium">
              {state.suggestions.length > 1
                ? "O que aconteceu?"
                : "Registrar como"}
            </span>
            <div className="flex flex-wrap gap-2">
              {state.suggestions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKeyword(option)}
                  className={cx("chip", keyword === option ? "chip-on" : "chip-off")}
                >
                  {option}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setKeyword("OUTRO")}
                className={cx("chip", keyword === "OUTRO" ? "chip-on" : "chip-off")}
              >
                OUTRO
              </button>
            </div>
            {keyword && (
              <p className="mt-2 text-xs text-muted">{KEYWORD_INFO[keyword].quandoUsar}</p>
            )}
          </div>
        )}

        {state.asksForDate && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Data e hora da avaliação</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="field"
            />
            <span className="mt-1 block text-xs text-muted">
              Preenchendo aqui, o compromisso entra na agenda do dia.
            </span>
          </label>
        )}

        {needsReason && (
          <div>
            <span className="mb-1.5 block text-sm font-medium">Motivo</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="field"
            >
              {/* Padrão deliberado: sem evidência clara, não se adivinha o motivo. */}
              <option value={MOTIVO_NAO_IDENTIFICADO}>{MOTIVO_NAO_IDENTIFICADO}</option>
              {REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              Só escolha um motivo se o cliente deu evidência. Chutar aqui contamina a
              métrica de perdas.
            </p>
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Comentário <span className="font-normal text-muted">(opcional)</span>
          </span>
          <textarea
            rows={2}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Com suas palavras. Ex: avaliação boa, quer trazer a esposa."
            className="field resize-none"
          />
        </label>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}
