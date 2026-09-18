/**
 * Temperatura operacional do lead.
 *
 * O SDR declara o nível de confiança no repasse. Enquanto o contrato não tem
 * um campo próprio de temperatura, esta conversão direta é a referência única
 * para a temperatura inicial; não calcula comportamento ou chance de venda.
 */
export const TEMPERATURE_LABEL = {
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
} as const;

export type Temperature = keyof typeof TEMPERATURE_LABEL;

export function normalizeTemperature(value: string | null): Temperature | null {
  if (value === "frio" || value === "morno" || value === "quente") return value;
  return null;
}

export function temperatureFromSdrConfidence(confidence: string | null): Temperature | null {
  if (confidence === "ALTA") return "quente";
  if (confidence === "MODERADA") return "morno";
  if (confidence === "BAIXA") return "frio";
  return null;
}

/** Mantém a leitura visual dos pontos: frio → quente. */
export const TEMPERATURE_DOTS: Record<Temperature, number> = {
  frio: 1,
  morno: 3,
  quente: 5,
};

export const TEMPERATURE_COLORS = ["#F04949", "#F47D49", "#F0A849", "#D8F55A", "#B9FF66"];

const TEMPERATURE_CYCLE: Array<Temperature | null> = [null, "frio", "morno", "quente"];

export function nextTemperature(temperature: Temperature | null): Temperature | null {
  const index = TEMPERATURE_CYCLE.indexOf(temperature);
  return TEMPERATURE_CYCLE[(index + 1) % TEMPERATURE_CYCLE.length];
}
