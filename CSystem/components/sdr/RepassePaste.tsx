"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ingestRepasseAction, previewRepasseAction } from "@/app/actions/sdr";
import type { ParsedRepasse } from "@/lib/sdr-parser";
import { formatPhone } from "@/lib/phone";

/**
 * Cola de repasse manual, com prévia do parse antes de gravar.
 *
 * A prévia importa: o bloco vem de um modelo de linguagem, e ver o que o
 * sistema entendeu antes de criar o card evita card errado por texto torto.
 */
export function RepassePaste() {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedRepasse | null>(null);
  const [result, setResult] = useState<{
    clientId: string | null;
    created: boolean;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function preview() {
    startTransition(async () => {
      setParsed(await previewRepasseAction(raw));
      setResult(null);
    });
  }

  function save() {
    startTransition(async () => {
      const response = await ingestRepasseAction(raw);
      if (response.ok) {
        setResult(response.data);
        setError(null);
        setRaw("");
        setParsed(null);
      } else {
        setError(response.error);
      }
    });
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 text-xl font-bold tracking-tight">Colar repasse</h2>
      <p className="mb-4 text-sm text-muted">
        Cole o bloco <code className="font-mono text-xs">===REPASSE===</code> que o SDR
        mandou no WhatsApp. Serve enquanto o webhook não está ligado, e para testar.
      </p>

      <textarea
        rows={8}
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        placeholder={"===REPASSE===\nLEAD: João\nORIGEM: anúncio\nCIDADE: Natal\nTELEFONE: 84999998888\n..."}
        className="field resize-y font-mono text-xs"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={preview}
          disabled={pending || !raw.trim()}
          className="chip chip-off disabled:opacity-40"
        >
          Ver o que o sistema entendeu
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !raw.trim()}
          className="btn-ink px-4 py-2 text-sm disabled:opacity-40"
        >
          {pending ? "Processando…" : "Processar repasse"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-negative">{error}</p>}

      {result && (
        <div className="mt-4 rounded-[var(--radius-inner)] bg-surface-sunken p-4 text-sm">
          {result.clientId ? (
            <p className="font-semibold">
              {result.created ? "Card criado" : "Card existente atualizado"} —{" "}
              <Link href={`/clientes/${result.clientId}`} className="underline">
                abrir cliente
              </Link>
            </p>
          ) : (
            <p className="font-semibold">
              Repasse registrado na entrada, sem entrar no funil.
            </p>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-warning">
              {result.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {parsed && <ParsedPreview parsed={parsed} />}
    </div>
  );
}

export function ParsedPreview({ parsed }: { parsed: ParsedRepasse }) {
  const rows: Array<[string, string | null]> = [
    ["Nome", parsed.name],
    ["Telefone", parsed.phoneNormalized ? formatPhone(parsed.phoneNormalized) : null],
    ["Cidade", parsed.city],
    ["Origem", parsed.origin],
    ["Classificação", parsed.classification],
    ["Nível de confiança", parsed.confidence],
    ["Intenção de tempo", parsed.intencaoTempo],
    ["Disponibilidade", parsed.disponibilidade],
    ["Comentário", parsed.comentarioKeyword ?? parsed.comentarioTexto],
  ];

  return (
    <div className="mt-4 rounded-[var(--radius-inner)] bg-surface-sunken p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        O que o sistema entendeu
      </p>

      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className="text-right font-medium">
              {value ?? <span className="text-muted">não informado</span>}
            </dd>
          </div>
        ))}
      </dl>

      {parsed.camposAusentes.length > 0 && (
        <p className="mt-3 text-xs text-warning">
          Campos ausentes: {parsed.camposAusentes.join(", ")}
        </p>
      )}
      {parsed.agendouRejeitado && (
        <p className="mt-2 text-xs text-warning">
          O bloco trazia AGENDOU. O SDR não agenda — será registrado como OUTRO.
        </p>
      )}
      {parsed.classification !== "QUALIFICADO" && (
        <p className="mt-2 text-xs text-muted">
          Classificação diferente de QUALIFICADO: fica só no registro de entrada, sem
          entrar no funil.
        </p>
      )}
    </div>
  );
}
