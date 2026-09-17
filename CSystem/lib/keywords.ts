/**
 * As 11 palavras-chave do PADRAO_DE_COMENTARIOS_EVENTOS_CAPILL_V1.md.
 *
 * A grafia é literal e intencional: `NAO COMPARECEU` e `PECA CHEGOU` estão SEM
 * ACENTO no documento-fonte. Não "corrigir" — o documento manda não inventar
 * variações da palavra-chave.
 */

export const KEYWORDS = [
  "AGENDOU",
  "COMPARECEU",
  "NAO COMPARECEU",
  "FECHOU",
  "PEDIDO FEITO",
  "PECA CHEGOU",
  "APLICOU",
  "SEM RETORNO",
  "PENSANDO",
  "PERDIDO",
  "OUTRO",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

export function isKeyword(value: string): value is Keyword {
  return (KEYWORDS as readonly string[]).includes(value);
}

export const KEYWORD_INFO: Record<
  Keyword,
  { quandoUsar: string; transicao: string; pedeMotivo: boolean }
> = {
  AGENDOU: {
    quandoUsar: "Lead marcou a avaliação",
    transicao: "LEAD FOLLOW-UP → AVALIAÇÃO AGENDADA",
    pedeMotivo: false,
  },
  COMPARECEU: {
    quandoUsar: "Cliente veio na avaliação agendada",
    transicao: "AVALIAÇÃO AGENDADA → ANALISANDO PROPOSTA",
    pedeMotivo: false,
  },
  "NAO COMPARECEU": {
    quandoUsar: "Cliente faltou à avaliação agendada",
    transicao: "Fica em AVALIAÇÃO AGENDADA ou volta para acompanhamento",
    pedeMotivo: false,
  },
  FECHOU: {
    quandoUsar: "Cliente decidiu fechar negócio",
    transicao: "ANALISANDO PROPOSTA → FOLLOW-UP ou FAZER PEDIDO DO SISTEMA",
    pedeMotivo: false,
  },
  "PEDIDO FEITO": {
    quandoUsar: "Pendência resolvida e pedido do sistema realizado",
    transicao: "FAZER PEDIDO DO SISTEMA → AGUARDANDO A PEÇA",
    pedeMotivo: false,
  },
  "PECA CHEGOU": {
    quandoUsar: "Peça chegou e está pronta para aplicação",
    transicao: "AGUARDANDO A PEÇA → CHEGOU PEÇA",
    pedeMotivo: false,
  },
  APLICOU: {
    quandoUsar: "Aplicação realizada",
    transicao: "CHEGOU PEÇA → 1° CONTATO PÓS VENDA",
    pedeMotivo: false,
  },
  "SEM RETORNO": {
    quandoUsar: "Lead parou de responder",
    transicao: "LEAD FOLLOW-UP → SEM RETORNO",
    pedeMotivo: false,
  },
  PENSANDO: {
    quandoUsar: 'Cliente pediu tempo para decidir ("vou pensar")',
    transicao: "Permanece em ANALISANDO PROPOSTA ou FOLLOW-UP",
    pedeMotivo: true,
  },
  PERDIDO: {
    quandoUsar: "Cliente confirmou que não vai fechar",
    transicao: "Sai do funil ativo",
    pedeMotivo: true,
  },
  OUTRO: {
    quandoUsar: "Evento relevante não coberto pelas opções acima",
    transicao: "—",
    pedeMotivo: false,
  },
};

/**
 * Categorias de motivo, seção 4 do PADRAO_DE_COMENTARIOS (idênticas às da seção 11
 * do CHECKLIST_AVALIACAO_E_FECHAMENTO).
 *
 * MOTIVO_NAO_IDENTIFICADO é o padrão deliberado: o documento manda NÃO ADIVINHAR
 * o motivo quando não há evidência clara.
 */
export const MOTIVO_NAO_IDENTIFICADO = "motivo não identificado";

export const REASONS = [
  "preço",
  "condição de pagamento",
  "cartão",
  "esposa/parceira",
  "família",
  "medo",
  "arrependimento",
  "manutenção",
  "rotina",
  "comparação",
  "necessidade de pensar",
  "falta de urgência",
  "necessidade de esperar",
  "outro",
] as const;

export type Reason = (typeof REASONS)[number] | typeof MOTIVO_NAO_IDENTIFICADO;

/**
 * Estágios do funil para métrica.
 *
 * Deliberadamente separados do nome da lista: o Alex pode renomear ou criar listas,
 * e a métrica continua somando o que deve. A ordem aqui é a ordem da cadeia do
 * PROTOCOLO_DE_TRABALHO_CAPILL_V1.md, item 7:
 *   LEAD → LEAD QUALIFICADO → AVALIAÇÃO → COMPARECIMENTO → VENDA → ...
 */
export const FUNNEL_STAGES = [
  "lead",
  "qualificado",
  "agendado",
  "compareceu",
  "fechou",
  "pedido",
  "peca",
  "aplicou",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

/** Estágios fora da cadeia principal — contados à parte, nunca como etapa de avanço. */
export const SIDE_STAGES = ["sem_retorno", "perdido"] as const;
export type SideStage = (typeof SIDE_STAGES)[number];

export type Stage = FunnelStage | SideStage;

export const ALL_STAGES: readonly Stage[] = [...FUNNEL_STAGES, ...SIDE_STAGES];

export const STAGE_LABEL: Record<Stage, string> = {
  lead: "Leads",
  qualificado: "Qualificados",
  agendado: "Avaliações agendadas",
  compareceu: "Compareceram",
  fechou: "Fecharam",
  pedido: "Pedido feito",
  peca: "Peça chegou",
  aplicou: "Aplicaram",
  sem_retorno: "Sem retorno",
  perdido: "Perdidos",
};

export function isStage(value: string | null | undefined): value is Stage {
  return !!value && (ALL_STAGES as readonly string[]).includes(value);
}

/**
 * Regra do SDR: ele nunca registra AGENDOU — agendar é decisão que só existe
 * depois que o Alex confirma com o cliente. Um repasse que tente AGENDOU vira OUTRO.
 * Ver SDR/AGENTS.md, seção REGISTRO DE EVENTOS NO TRELLO.
 */
export function sanitizeSdrKeyword(keyword: string | null): {
  keyword: Keyword | null;
  rejected: boolean;
} {
  if (!keyword) return { keyword: null, rejected: false };
  const upper = keyword.trim().toUpperCase();
  if (upper === "AGENDOU") return { keyword: "OUTRO", rejected: true };
  return { keyword: isKeyword(upper) ? upper : null, rejected: false };
}

/**
 * Um comentário = um evento (regra 2 do PADRAO_DE_COMENTARIOS).
 * Detecta se o texto livre contém uma segunda palavra-chave no início de alguma linha.
 */
export function findExtraKeywords(body: string, chosen: Keyword | null): Keyword[] {
  const found = new Set<Keyword>();
  for (const line of body.split("\n")) {
    const trimmed = line.trimStart();
    for (const kw of KEYWORDS) {
      if (kw === chosen) continue;
      // Palavra-chave em maiúsculas no início da linha, seguida de fim, espaço ou ':'
      if (trimmed.startsWith(kw) && /^[\s:]|^$/.test(trimmed.slice(kw.length))) {
        found.add(kw);
      }
    }
  }
  return [...found];
}

/** Monta a linha de follow-up no formato exato da seção 5 do documento. */
export function formatFollowup(motivo: string, evento: string, data: string): string {
  return `FOLLOW-UP: motivo=${motivo} | evento=${evento} | data=${data}`;
}
