import { NoData, SmallSampleNote } from "@/components/ui/primitives";
import { formatRate } from "@/lib/metrics";

/* --------------------------------------------------------- comparecimento */

export function AttendancePanel({
  data,
}: {
  data: {
    agendado: number;
    compareceu: number;
    naoCompareceu: number;
    rate: number | null;
    smallSample: boolean;
  };
}) {
  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight">Comparecimento</h2>
      <p className="mb-5 text-sm text-muted">
        Quantas avaliações marcadas viraram avaliação feita.
      </p>

      <div className="mb-5 flex items-baseline gap-2">
        {data.rate == null ? (
          <NoData>Sem avaliações agendadas no período</NoData>
        ) : (
          <>
            <span className="display-title text-[44px]">{formatRate(data.rate)}</span>
            <span className="text-sm text-muted">compareceram</span>
          </>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Agendadas", value: data.agendado },
          { label: "Compareceram", value: data.compareceu },
          { label: "Não compareceram", value: data.naoCompareceu },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-inner)] bg-surface-sunken p-3">
            <dt className="text-xs font-medium text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-2xl font-bold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      {data.smallSample && (
        <p className="mt-3">
          <SmallSampleNote sample={data.agendado} />
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------- tempo médio por etapa */

export function DurationsPanel({
  durations,
}: {
  durations: Array<{
    fromLabel: string;
    toLabel: string;
    averageDays: number | null;
    sample: number;
  }>;
}) {
  const withData = durations.filter((entry) => entry.averageDays != null);

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight">Tempo médio entre etapas</h2>
      <p className="mb-5 text-sm text-muted">
        Em dias. Sai das próprias transições — você não precisou anotar nada para isto
        existir.
      </p>

      {withData.length === 0 ? (
        <NoData>Ainda não há clientes que percorreram duas etapas no período.</NoData>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-semibold">Transição</th>
              <th className="pb-2 text-right font-semibold">Média</th>
              <th className="pb-2 text-right font-semibold">Base</th>
            </tr>
          </thead>
          <tbody>
            {withData.map((entry) => (
              <tr
                key={`${entry.fromLabel}-${entry.toLabel}`}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="py-2.5 font-medium">
                  {entry.fromLabel} → {entry.toLabel}
                </td>
                <td className="py-2.5 text-right font-bold tabular-nums">
                  {entry.averageDays!.toFixed(1)} d
                </td>
                <td className="py-2.5 text-right text-xs text-muted tabular-nums">
                  {entry.sample}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- motivos */

/**
 * Motivos de hesitação e de perda.
 *
 * A barra mede o total (série única, hue única); a separação entre PENSANDO e
 * PERDIDO aparece como número na tabela, não como segunda cor. Duas séries
 * exigiriam uma paleta categórica validada, e a tabela já responde melhor a
 * pergunta "qual motivo mais aparece".
 */
export function ReasonsPanel({
  reasons,
}: {
  reasons: Array<{ reason: string; pensando: number; perdido: number }>;
}) {
  const max = Math.max(...reasons.map((r) => r.pensando + r.perdido), 1);

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight">Motivos registrados</h2>
      <p className="mb-5 text-sm text-muted">
        Só aparece aqui o motivo que você registrou com evidência. O sistema nunca
        adivinha motivo.
      </p>

      {reasons.length === 0 ? (
        <NoData>Nenhum motivo registrado no período.</NoData>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-semibold">Motivo</th>
              <th className="pb-2 pl-4 font-semibold">Total</th>
              <th className="pb-2 text-right font-semibold">Pensando</th>
              <th className="pb-2 text-right font-semibold">Perdido</th>
            </tr>
          </thead>
          <tbody>
            {reasons.map((entry) => {
              const total = entry.pensando + entry.perdido;
              return (
                <tr key={entry.reason} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5 font-medium">{entry.reason}</td>
                  <td className="w-[45%] py-2.5 pl-4">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${(total / max) * 100}%` }}
                          title={`${entry.reason}: ${total}`}
                        />
                      </span>
                      <span className="w-6 text-right text-xs font-bold tabular-nums">
                        {total}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-xs tabular-nums text-text-soft">
                    {entry.pensando}
                  </td>
                  <td className="py-2.5 text-right text-xs tabular-nums text-text-soft">
                    {entry.perdido}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- origem */

/** Cada barra usa a cor da própria etiqueta: a cor segue a entidade, não o rank. */
export function OriginPanel({
  origins,
}: {
  origins: Array<{ name: string; colorHex: string; total: number }>;
}) {
  const max = Math.max(...origins.map((o) => o.total), 1);

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight">Origem dos leads</h2>
      <p className="mb-5 text-sm text-muted">
        Clientes criados no período, pelas etiquetas do grupo Origem.
      </p>

      {origins.length === 0 ? (
        <NoData>Nenhum cliente com etiqueta de origem no período.</NoData>
      ) : (
        <ul className="space-y-2.5">
          {origins.map((origin) => (
            <li key={origin.name} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: origin.colorHex }}
                aria-hidden="true"
              />
              <span className="w-36 shrink-0 truncate text-sm font-medium">{origin.name}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(origin.total / max) * 100}%`,
                    backgroundColor: origin.colorHex,
                  }}
                  title={`${origin.name}: ${origin.total}`}
                />
              </span>
              <span className="w-6 text-right text-sm font-bold tabular-nums">
                {origin.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------- distribuição atual */

export function DistributionPanel({
  distribution,
}: {
  distribution: Array<{ listId: string; name: string; color: string | null; total: number }>;
}) {
  const max = Math.max(...distribution.map((d) => d.total), 1);
  const totalCards = distribution.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight">Onde os cards estão agora</h2>
      <p className="mb-5 text-sm text-muted">
        Foto do presente — {totalCards} card{totalCards === 1 ? "" : "s"} ativo
        {totalCards === 1 ? "" : "s"}. Não depende do período selecionado.
      </p>

      <ul className="space-y-2.5">
        {distribution.map((item) => (
          <li key={item.listId} className="flex items-center gap-3">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color ?? "var(--muted)" }}
              aria-hidden="true"
            />
            <span className="w-44 shrink-0 truncate text-sm font-medium">{item.name}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(item.total / max) * 100}%`,
                  backgroundColor: item.color ?? "var(--muted)",
                }}
                title={`${item.name}: ${item.total}`}
              />
            </span>
            <span className="w-6 text-right text-sm font-bold tabular-nums">{item.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
