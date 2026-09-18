import { NoData, SmallSampleNote } from "@/components/ui/primitives";
import { formatRate, type FunnelStep } from "@/lib/metrics";

/**
 * A cadeia do funil em barras horizontais.
 *
 * Série única, hue única: a barra mede magnitude, não identidade, então não há
 * paleta categórica aqui — e por isso também não há legenda (o título e o rótulo
 * de cada linha já nomeiam a etapa).
 *
 * A taxa entre etapas é o ponto do gráfico, não o número absoluto. É a leitura
 * que o PROTOCOLO_DE_TRABALHO item 7 cobra: "lead não é lead qualificado,
 * lead qualificado não é avaliação, avaliação não é venda".
 */
export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((step) => step.count), 1);
  const hasAnyData = steps.some((step) => step.count > 0);

  if (!hasAnyData) {
    return (
      <div className="card p-6">
        <h2 className="mb-1 text-2xl font-medium tracking-tight">Funil do período</h2>
        <p className="mb-6 text-sm text-muted">
          Cada etapa conta clientes distintos que entraram nela no período.
        </p>
        <div className="rounded-[var(--radius-inner)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center">
          <p className="text-sm font-semibold">Ainda sem movimentos registrados</p>
          <p className="mt-1 text-sm text-muted">
            Os números aparecem sozinhos conforme você arrasta os cards entre as listas.
            Nada aqui exige preencher relatório.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-2xl font-medium tracking-tight">Funil do período</h2>
      <p className="mb-5 text-sm text-muted">
        Clientes distintos que entraram em cada etapa. A porcentagem é a conversão a
        partir da etapa anterior com base.
      </p>

      <ol className="space-y-3">
        {steps.map((step) => {
          const width = (step.count / max) * 100;
          return (
            <li key={step.stage}>
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="ml-auto text-sm font-bold tabular-nums">{step.count}</span>
                <span className="w-24 text-right text-xs font-semibold">
                  {step.rate == null ? (
                    <NoData>—</NoData>
                  ) : (
                    <span className="text-text-soft">{formatRate(step.rate)}</span>
                  )}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(width, step.count > 0 ? 3 : 0)}%` }}
                  title={`${step.label}: ${step.count}`}
                />
              </div>

              {step.smallSample && step.rate != null && step.base != null && (
                <p className="mt-1">
                  {/* A amostra é a BASE da conversão, não a contagem desta etapa. */}
                  <SmallSampleNote sample={step.base} />
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
