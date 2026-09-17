"use client";

import { useState, useTransition } from "react";
import { addEventAction, addFollowupAction } from "@/app/actions/events";
import {
  KEYWORDS,
  KEYWORD_INFO,
  MOTIVO_NAO_IDENTIFICADO,
  REASONS,
  type Keyword,
} from "@/lib/keywords";
import { cx } from "@/lib/utils";

/**
 * Compositor de comentário no padrão do PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md.
 *
 * A palavra-chave é escolhida em chips, nunca digitada. Isso mata na raiz o
 * problema que o documento aponta — variações inventadas como "AGENDADO" no
 * lugar de "AGENDOU" — e é o que permite contar depois.
 */
export function EventComposer({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState<"evento" | "followup">("evento");

  return (
    <div className="card p-5">
      <div className="mb-4 flex gap-1 rounded-full bg-surface-sunken p-1">
        <button
          type="button"
          onClick={() => setTab("evento")}
          className={cx(
            "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
            tab === "evento" ? "bg-surface shadow-[var(--shadow-chip)]" : "text-muted",
          )}
        >
          Registrar evento
        </button>
        <button
          type="button"
          onClick={() => setTab("followup")}
          className={cx(
            "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
            tab === "followup" ? "bg-surface shadow-[var(--shadow-chip)]" : "text-muted",
          )}
        >
          Agendar follow-up
        </button>
      </div>

      {tab === "evento" ? (
        <EventForm clientId={clientId} />
      ) : (
        <FollowupForm clientId={clientId} />
      )}
    </div>
  );
}

function EventForm({ clientId }: { clientId: string }) {
  const [keyword, setKeyword] = useState<Keyword | null>(null);
  const [body, setBody] = useState("");
  const [reason, setReason] = useState(MOTIVO_NAO_IDENTIFICADO);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsReason = keyword ? KEYWORD_INFO[keyword].pedeMotivo : false;

  function submit() {
    startTransition(async () => {
      const result = await addEventAction({
        clientId,
        keyword,
        body,
        reason: needsReason ? reason : null,
      });
      if (result.ok) {
        setBody("");
        setKeyword(null);
        setReason(MOTIVO_NAO_IDENTIFICADO);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
          Palavra-chave
        </span>
        <div className="flex flex-wrap gap-1.5">
          {KEYWORDS.map((option) => (
            <button
              key={option}
              type="button"
              title={KEYWORD_INFO[option].quandoUsar}
              onClick={() => setKeyword(keyword === option ? null : option)}
              className={cx(
                "chip px-2.5 py-1 text-[11px]",
                keyword === option ? "chip-on" : "chip-off",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {keyword && (
          <p className="mt-2 text-xs text-muted">
            {KEYWORD_INFO[keyword].quandoUsar}
            {KEYWORD_INFO[keyword].transicao !== "—" && (
              <> · {KEYWORD_INFO[keyword].transicao}</>
            )}
          </p>
        )}
      </div>

      {needsReason && (
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Motivo
          </span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="field"
          >
            <option value={MOTIVO_NAO_IDENTIFICADO}>{MOTIVO_NAO_IDENTIFICADO}</option>
            {REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}

      <textarea
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={
          keyword
            ? "Complete com suas palavras. Ex: avaliação boa, quer trazer a esposa."
            : "Escreva uma nota, ou escolha uma palavra-chave acima."
        }
        className="field resize-none"
      />

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">Um comentário = um evento.</p>
        <button
          type="button"
          onClick={submit}
          disabled={pending || (!keyword && !body.trim())}
          className="btn-ink px-4 py-2 text-sm disabled:opacity-40"
        >
          {pending ? "Registrando…" : "Registrar"}
        </button>
      </div>
    </div>
  );
}

/** Gera exatamente `FOLLOW-UP: motivo=… | evento=… | data=…` (seção 5 do documento). */
function FollowupForm({ clientId }: { clientId: string }) {
  const [motivo, setMotivo] = useState("");
  const [evento, setEvento] = useState("");
  const [data, setData] = useState("");
  const [dataISO, setDataISO] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = `FOLLOW-UP: motivo=${motivo || "…"} | evento=${evento || "…"} | data=${data || "…"}`;

  function submit() {
    startTransition(async () => {
      const result = await addFollowupAction({
        clientId,
        motivo,
        evento,
        data,
        dataISO: dataISO || null,
      });
      if (result.ok) {
        setMotivo("");
        setEvento("");
        setData("");
        setDataISO("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Motivo
        </span>
        <input
          list="followup-motivos"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          placeholder="condição financeira"
          className="field"
        />
        <datalist id="followup-motivos">
          {REASONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          O que precisa acontecer
        </span>
        <input
          value={evento}
          onChange={(event) => setEvento(event.target.value)}
          placeholder="virada da fatura"
          className="field"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Data que o cliente falou
          </span>
          <input
            value={data}
            onChange={(event) => setData(event.target.value)}
            placeholder="05/10"
            className="field"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Data para a fila <span className="normal-case text-muted">(opcional)</span>
          </span>
          <input
            type="date"
            value={dataISO}
            onChange={(event) => setDataISO(event.target.value)}
            className="field"
          />
        </label>
      </div>

      <p className="rounded-[var(--radius-inner)] bg-surface-sunken px-3 py-2 font-mono text-[11px] text-text-soft">
        {preview}
      </p>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !motivo.trim() || !evento.trim() || !data.trim()}
          className="btn-ink px-4 py-2 text-sm disabled:opacity-40"
        >
          {pending ? "Salvando…" : "Registrar follow-up"}
        </button>
      </div>
    </div>
  );
}
