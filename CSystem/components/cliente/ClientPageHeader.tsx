"use client";

import { useTransition } from "react";
import { updateClientAction } from "@/app/actions/clients";
import { PageHeader } from "@/components/shell/PageHeader";
import { TemperatureControl } from "@/components/ui/TemperatureControl";
import { normalizeTemperature, temperatureFromSdrConfidence } from "@/lib/temperature";

/** Título do cadastro com a temperatura ao lado do nome do lead. */
export function ClientPageHeader({
  clientId,
  name,
  temperature: storedTemperature,
  sdrConfidence,
}: {
  clientId: string;
  name: string;
  temperature: string | null;
  sdrConfidence: string | null;
}) {
  const [, startTransition] = useTransition();
  const rawTemperature = normalizeTemperature(storedTemperature);
  const displayTemperature = rawTemperature ?? temperatureFromSdrConfidence(sdrConfidence);

  return (
    <PageHeader
      title={name}
      action={
        <TemperatureControl
          value={rawTemperature}
          displayValue={displayTemperature}
          clientName={name}
          onChange={(next) => startTransition(() => void updateClientAction(clientId, { temperature: next }))}
          className="mb-1 rounded-full bg-surface px-3 py-2 shadow-[var(--shadow-chip)]"
        />
      }
    />
  );
}
