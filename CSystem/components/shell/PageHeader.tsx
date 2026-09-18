import { IconBell } from "@/components/ui/icons";
import { Avatar, StatCounter } from "@/components/ui/primitives";
import { ThemeToggle } from "./ThemeToggle";
import type { HeadlineMetric } from "@/lib/metrics";

/**
 * Cabeçalho das páginas, no formato da referência: título gigante em caixa
 * alta, botão preto colado no título e os contadores grandes na mesma linha.
 */
export function PageHeader({
  title,
  action,
  metrics,
  children,
  controls = true,
  metricExamples,
}: {
  title: string;
  /** Botão principal ao lado do título — o "+ Nova Tarefa" da referência. */
  action?: React.ReactNode;
  metrics?: HeadlineMetric[];
  children?: React.ReactNode;
  /** No Workspace os controles pertencem à barra de agenda, como na referência. */
  controls?: boolean;
  /** Exemplos visuais explicitamente solicitados; não alteram os dados de métrica. */
  metricExamples?: Partial<Record<string, number>>;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-5 gap-y-4">
          <h1 className="display-title text-[38px] sm:text-[50px]">{title}</h1>
          {action}
          {metrics && metrics.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3 pb-1">
              {metrics.map((metric) => (
                <StatCounter
                  key={metric.label}
                  value={metric.value}
                  label={metric.label}
                  delta={metric.delta}
                  previewDelta={metricExamples?.[metric.label]}
                />
              ))}
            </div>
          )}
        </div>

        {controls && (
          <div className="flex items-center gap-1 rounded-full bg-surface p-2 shadow-[var(--shadow-card)]">
            {children}
            <ThemeToggle />
            <button type="button" className="icon-btn size-11" aria-label="Notificações">
              <span className="relative"><IconBell size={18} /><span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-negative ring-2 ring-surface" /></span>
            </button>
            <Avatar name="Alex" size={44} />
          </div>
        )}
      </div>
    </header>
  );
}
