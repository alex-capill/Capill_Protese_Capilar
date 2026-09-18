import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { RepassePaste } from "@/components/sdr/RepassePaste";
import { EmptyState } from "@/components/ui/primitives";
import { formatPhone } from "@/lib/phone";
import { getSdrInbox } from "@/lib/queries";
import { cx } from "@/lib/utils";
import { TEMPERATURE_LABEL, temperatureFromSdrConfidence } from "@/lib/temperature";

export const dynamic = "force-dynamic";

/**
 * Entrada SDR — registro passivo de tudo que o agente repassou.
 *
 * Deliberadamente PASSIVA: sem badge de pendência, sem fila a trabalhar. O
 * objetivo é só não perder o lead não-qualificado, que hoje existe apenas no
 * scroll do WhatsApp. Transformar isso numa caixa de entrada para triar seria
 * criar trabalho novo para quem opera sozinho.
 */
export default function EntradaSdrPage() {
  const inbox = getSdrInbox();

  return (
    <>
      <PageHeader title="Entrada SDR" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="lg:order-2">
          <RepassePaste />
        </section>

        <section className="lg:order-1">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Repasses recebidos</h2>
          <p className="mb-3 text-sm text-muted">
            Tudo que o SDR mandou, qualificado ou não. Nada aqui exige uma ação sua.
          </p>

          {inbox.length === 0 ? (
            <EmptyState
              title="Nenhum repasse ainda"
              description="Quando o n8n chamar o webhook, ou você colar um bloco ao lado, ele aparece aqui."
            />
          ) : (
            <ul className="space-y-2">
              {inbox.map((row) => (
                <InboxRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function InboxRow({ row }: { row: ReturnType<typeof getSdrInbox>[number] }) {
  const temperature = temperatureFromSdrConfidence(row.confidence);

  return (
    <li className="card p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{row.name ?? "Lead sem nome"}</span>
                    {row.classification && (
                      <span
                        className={cx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide",
                          row.classification === "QUALIFICADO"
                            ? "bg-accent text-accent-ink"
                            : "bg-surface-sunken text-text-soft",
                        )}
                      >
                        {row.classification}
                      </span>
                    )}
                    {row.confidence && (
                      <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-text-soft">
                        confiança {row.confidence}
                      </span>
                    )}
                    {temperature && (
                      <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent-ink">
                        temperatura aplicada: {TEMPERATURE_LABEL[temperature]}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted">
                      {new Date(row.receivedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <p className="text-xs text-muted">
                    {row.phone ? formatPhone(row.phone) : "sem telefone"}
                    {" · "}
                    {row.source === "manual" ? "colado manualmente" : "via webhook"}
                  </p>

                  {row.clientId ? (
                    <Link
                      href={`/clientes/${row.clientId}`}
                      className="mt-2 inline-block text-xs font-semibold underline"
                    >
                      Abrir card do cliente
                    </Link>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Não entrou no funil — classificação diferente de QUALIFICADO.
                    </p>
                  )}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted">
                      Ver bloco original
                    </summary>
                    <pre className="thin-scroll mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[var(--radius-inner)] bg-surface-sunken p-3 font-mono text-[11px] leading-relaxed">
                      {row.rawText}
                    </pre>
                  </details>
    </li>
  );
}
