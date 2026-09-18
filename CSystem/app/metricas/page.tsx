import { PageHeader } from "@/components/shell/PageHeader";
import { FunnelChart } from "@/components/metricas/FunnelChart";
import {
  AttendancePanel,
  DistributionPanel,
  DurationsPanel,
  OriginPanel,
  ReasonsPanel,
} from "@/components/metricas/MetricPanels";
import {
  attendance,
  averageStageDurations,
  currentDistribution,
  funnelSteps,
  headlineMetrics,
  monthPeriod,
  originBreakdown,
  reasonBreakdown,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

/**
 * Métricas do funil.
 *
 * Tudo aqui sai de `list_transitions`, gravada automaticamente a cada arrasto.
 * Nenhum número desta tela depende de alguém ter lembrado de escrever comentário.
 */
export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const reference = params.mes ? new Date(`${params.mes}-01T12:00:00`) : new Date();
  const period = monthPeriod(Number.isNaN(reference.getTime()) ? new Date() : reference);

  const steps = funnelSteps(period);
  const metrics = headlineMetrics(period);

  return (
    <>
      <PageHeader title="Métricas" metrics={metrics} />

      <p className="mb-8 text-sm text-muted">
        Período: <strong className="text-text">{period.label}</strong>. Os deltas comparam
        com o mês anterior. Onde não há base para calcular, aparece &quot;sem dados&quot; —
        e não 0%.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <FunnelChart steps={steps} />
        </div>
        <AttendancePanel data={attendance(period)} />
        <DurationsPanel durations={averageStageDurations(period)} />
        <ReasonsPanel reasons={reasonBreakdown(period)} />
        <OriginPanel origins={originBreakdown(period)} />
        <div className="lg:col-span-2">
          <DistributionPanel distribution={currentDistribution()} />
        </div>
      </div>
    </>
  );
}
