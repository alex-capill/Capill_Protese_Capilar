import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientDetails } from "@/components/cliente/ClientDetails";
import { ClientTimeline } from "@/components/cliente/ClientTimeline";
import { EventComposer } from "@/components/cliente/EventComposer";
import { PaymentsPanel } from "@/components/cliente/PaymentsPanel";
import { PageHeader } from "@/components/shell/PageHeader";
import { IconChevronLeft } from "@/components/ui/icons";
import {
  getClient,
  getClientPayments,
  getClientTimeline,
  getLabels,
  getLists,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * O card único do cliente (Regra 1 do Manual Operacional).
 *
 * Um cliente, um registro, uma história — do primeiro repasse do SDR até o
 * pós-venda. Não se cria card novo a cada etapa.
 */
export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  const { events, transitions } = getClientTimeline(id);
  const payments = getClientPayments(id);
  const lists = getLists();
  const labels = getLabels();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/funil"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-text"
        >
          <IconChevronLeft size={16} />
          Voltar ao funil
        </Link>
      </div>

      <PageHeader title={client.name} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4 lg:order-2">
          <ClientDetails client={client} lists={lists} allLabels={labels} />
          <PaymentsPanel clientId={client.id} payments={payments} />
        </div>

        <div className="space-y-4 lg:order-1">
          <EventComposer clientId={client.id} />
          <ClientTimeline events={events} transitions={transitions} />
        </div>
      </div>
    </>
  );
}
