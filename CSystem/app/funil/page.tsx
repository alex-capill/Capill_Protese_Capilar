import { FunilView } from "@/components/funil/FunilView";
import { PageHeader } from "@/components/shell/PageHeader";
import { getClients, getLabels, getLists } from "@/lib/queries";
import { headlineMetrics, monthPeriod } from "@/lib/metrics";

// O banco é lido a cada requisição: nada aqui pode ser renderizado no build.
export const dynamic = "force-dynamic";

export default function FunilPage() {
  const lists = getLists();
  const clients = getClients();
  const labels = getLabels();
  const metrics = headlineMetrics(monthPeriod());

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <PageHeader title="Funil" metrics={metrics} />
      <FunilView lists={lists} clients={clients} labels={labels} />
    </div>
  );
}
