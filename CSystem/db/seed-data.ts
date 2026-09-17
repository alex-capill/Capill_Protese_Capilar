import type { Keyword, Stage } from "@/lib/keywords";

/**
 * Estrutura inicial do CSystem.
 *
 * Isto NÃO é importação: nenhum cliente vem do Trello. É só a estrutura que a
 * Capill já usa, para o Alex não começar numa tela vazia. Tudo aqui é editável
 * e apagável na tela de Configurações.
 *
 * Fonte: leitura do board real "Clientes Capill" em 17/09/2026, cruzada com o
 * MANUAL_OPERACIONAL_CAPILL_V1.md (Regra 2) e o PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md.
 */

export type SeedList = {
  name: string;
  kind: "funnel" | "support";
  color: string;
  defaultKeyword: Keyword | null;
  countsAsStage: Stage | null;
  /** Quando a lista de destino é ambígua, o app pergunta em vez de assumir. */
  keywordChoices?: Keyword[];
};

export const SEED_LISTS: SeedList[] = [
  {
    name: "MATERIAIS DE APOIO",
    kind: "support",
    color: "#64748B",
    defaultKeyword: null,
    countsAsStage: null,
  },
  {
    name: "LEAD QUALIFICADO",
    kind: "funnel",
    color: "#C9F24D",
    defaultKeyword: null,
    countsAsStage: "qualificado",
  },
  {
    // No Trello está escrito "LEAD FOLOW-UP" (falta um L). Grafia corrigida aqui.
    name: "LEAD FOLLOW-UP",
    kind: "funnel",
    color: "#5AC8FA",
    defaultKeyword: null,
    countsAsStage: "lead",
  },
  {
    name: "AVALIAÇÃO AGENDADA",
    kind: "funnel",
    color: "#3B82F6",
    defaultKeyword: "AGENDOU",
    countsAsStage: "agendado",
  },
  {
    name: "ANALISANDO PROPOSTA",
    kind: "funnel",
    color: "#A855F7",
    defaultKeyword: "COMPARECEU",
    countsAsStage: "compareceu",
  },
  {
    // Ambígua por natureza: pode chegar aqui um cliente que FECHOU com pendência
    // ou um que está PENSANDO. O app pergunta em vez de carimbar.
    name: "FOLLOW-UP",
    kind: "funnel",
    color: "#F59E0B",
    defaultKeyword: null,
    countsAsStage: null,
    keywordChoices: ["FECHOU", "PENSANDO"],
  },
  {
    // Existe no board real, não aparece em nenhum documento. Mantida por estar em uso.
    name: "AGUARDANDO CONTRATO",
    kind: "funnel",
    color: "#F97316",
    defaultKeyword: "FECHOU",
    countsAsStage: "fechou",
  },
  {
    name: "FAZER PEDIDO DO SISTEMA",
    kind: "funnel",
    color: "#4CC38A",
    defaultKeyword: "FECHOU",
    countsAsStage: "fechou",
  },
  {
    name: "AGUARDANDO A PEÇA",
    kind: "funnel",
    color: "#2DD4BF",
    defaultKeyword: "PEDIDO FEITO",
    countsAsStage: "pedido",
  },
  {
    name: "CHEGOU PEÇA",
    kind: "funnel",
    color: "#22B8CF",
    defaultKeyword: "PECA CHEGOU",
    countsAsStage: "peca",
  },
  {
    name: "1° CONTATO PÓS VENDA",
    kind: "funnel",
    color: "#6366F1",
    defaultKeyword: "APLICOU",
    countsAsStage: "aplicou",
  },
  {
    name: "SEM RETORNO",
    kind: "funnel",
    color: "#64748B",
    defaultKeyword: "SEM RETORNO",
    countsAsStage: "sem_retorno",
  },
];

export type SeedLabel = { name: string; group: string; colorHex: string };

/**
 * As 15 etiquetas dos 4 grupos da Regra 2 do Manual Operacional.
 *
 * Duas notas sobre as cores, apuradas no board real:
 *  - O grupo SITUAÇÃO ESPECIAL JÁ EXISTE no Trello (uso zero, mas criado). Isso
 *    encerra a pendência registrada no MANUAL_OPERACIONAL_CAPILL_V1.md.
 *  - No Trello as 7 etiquetas de ORIGEM têm TODAS a mesma cor (sky_light), o que
 *    as torna indistinguíveis no card. Aqui cada uma recebe um tom próprio.
 */
export const SEED_LABELS: SeedLabel[] = [
  // MODALIDADE DA AVALIAÇÃO — cores equivalentes às do board (blue_light / blue)
  { name: "Avaliação Studio", group: "MODALIDADE", colorHex: "#5AC8FA" },
  { name: "Avaliação Online", group: "MODALIDADE", colorHex: "#3B82F6" },

  // PAGAMENTO — green_light / yellow_light / orange_light
  { name: "Pagamento Ok", group: "PAGAMENTO", colorHex: "#4CC38A" },
  { name: "Resta Pagamento", group: "PAGAMENTO", colorHex: "#EAB308" },
  { name: "Aguardando Pagamento", group: "PAGAMENTO", colorHex: "#F97316" },

  // ORIGEM — 7 tons distintos, ao contrário do board real
  { name: "Instagram Orgânico", group: "ORIGEM", colorHex: "#EC4899" },
  { name: "Instagram Anúncio", group: "ORIGEM", colorHex: "#A855F7" },
  { name: "Google Pesquisa", group: "ORIGEM", colorHex: "#22B8CF" },
  { name: "Google Anúncio", group: "ORIGEM", colorHex: "#6366F1" },
  { name: "Indicação", group: "ORIGEM", colorHex: "#C9F24D" },
  { name: "Cliente Antigo", group: "ORIGEM", colorHex: "#2DD4BF" },
  { name: "Outros", group: "ORIGEM", colorHex: "#64748B" },

  // SITUAÇÃO ESPECIAL — red / red_light / red_dark
  { name: "Prioridade", group: "SITUACAO_ESPECIAL", colorHex: "#EF4444" },
  { name: "Retorno Necessário", group: "SITUACAO_ESPECIAL", colorHex: "#F87171" },
  { name: "Problema", group: "SITUACAO_ESPECIAL", colorHex: "#9F1239" },
];

export const LABEL_GROUP_LABEL: Record<string, string> = {
  ORIGEM: "Origem",
  MODALIDADE: "Modalidade da avaliação",
  PAGAMENTO: "Pagamento",
  SITUACAO_ESPECIAL: "Situação especial",
  CUSTOM: "Outras",
};

export const SEED_TASK_COLUMNS = [
  { name: "A fazer", accent: "#64748B" },
  { name: "Hoje", accent: "#C9F24D" },
  { name: "Em andamento", accent: "#3B82F6" },
  { name: "Concluído", accent: "#4CC38A" },
];

/**
 * Cidades que sugerem avaliação PRESENCIAL (Studio).
 * Lista literal do SDR/AGENTS.md — qualquer cidade fora dela sugere ONLINE.
 */
export const CIDADES_PRESENCIAIS = [
  "natal",
  "parnamirim",
  "sao goncalo do amarante",
  "macaiba",
  "extremoz",
  "nisia floresta",
  "sao jose de mipibu",
  "monte alegre",
  "ceara-mirim",
  "ceara mirim",
];
