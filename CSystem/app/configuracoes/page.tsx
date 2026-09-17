import { PageHeader } from "@/components/shell/PageHeader";
import { LabelsManager } from "@/components/config/LabelsManager";
import { ListsManager } from "@/components/config/ListsManager";
import { getLabels, getLists } from "@/lib/queries";
import { dbPath } from "@/db";

export const dynamic = "force-dynamic";

export default function ConfiguracoesPage() {
  const lists = getLists();
  const labels = getLabels();

  const tokenConfigured =
    !!process.env.CSYSTEM_WEBHOOK_TOKEN &&
    process.env.CSYSTEM_WEBHOOK_TOKEN !== "troque-este-valor-por-um-segredo-longo";
  const publicUrl = process.env.CSYSTEM_PUBLIC_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader title="Configurações" />

      <div className="space-y-4">
        <ListsManager lists={lists} />
        <LabelsManager labels={labels} />

        <section className="card p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight">Webhook do SDR</h2>
          <p className="mb-4 text-sm text-muted">
            É o endereço que o n8n chama no lugar do nó que criava o card no Trello.
          </p>

          <dl className="space-y-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">Endpoint</dt>
              <dd className="font-mono text-xs">{publicUrl}/api/sdr/repasse</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">Header de autenticação</dt>
              <dd className="font-mono text-xs">x-csystem-token</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted">Segredo configurado</dt>
              <dd
                className={
                  tokenConfigured ? "font-semibold text-positive" : "font-semibold text-negative"
                }
              >
                {tokenConfigured ? "sim" : "não — defina CSYSTEM_WEBHOOK_TOKEN no .env.local"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-[var(--radius-inner)] bg-surface-sunken p-3 text-xs text-text-soft">
            O segredo vive no arquivo <code className="font-mono">.env.local</code> e nunca
            é exibido aqui nem enviado ao navegador. A configuração completa do nó do n8n
            está em <code className="font-mono">CSystem/docs/INTEGRACAO_N8N.md</code>.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight">Backup</h2>
          <p className="mb-4 text-sm text-muted">
            Todo o sistema vive em um arquivo só. Backup é copiar esse arquivo.
          </p>
          <p className="rounded-[var(--radius-inner)] bg-surface-sunken p-3 font-mono text-xs">
            {dbPath}
          </p>
          <p className="mt-3 text-xs text-muted">
            Com o app parado, copie o arquivo para onde quiser. Com o app rodando, copie
            também os arquivos terminados em <code className="font-mono">-wal</code> e{" "}
            <code className="font-mono">-shm</code>, se existirem.
          </p>
        </section>
      </div>
    </>
  );
}
