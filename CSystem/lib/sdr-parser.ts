import { isKeyword, sanitizeSdrKeyword, type Keyword } from "./keywords";
import { normalizePhone } from "./phone";

/**
 * Parser do bloco ===REPASSE=== produzido pelo Agente SDR.
 *
 * Formato-fonte: SDR/AGENTS.md, seção "FORMATO DO REPASSE".
 *
 * Isto é um contrato de TEXTO gerado por um modelo de linguagem, não um JSON.
 * O parser precisa ser tolerante: acento faltando, dois-pontos ausente, campo
 * em linha ou em bloco, colchetes de template não preenchidos. O que ele NÃO
 * faz é adivinhar: campo que não veio fica null, e null nunca vira valor padrão.
 */

export type ParsedRepasse = {
  name: string | null;
  origin: string | null;
  city: string | null;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  situacao: string | null;
  incomoda: string | null;
  intencaoTempo: string | null;
  disponibilidade: string | null;
  jaInformado: string | null;
  objecoes: string | null;
  /** 'QUALIFICADO' | 'NAO QUALIFICADO' | 'INDEFINIDO' | null */
  classification: string | null;
  /** 'ALTA' | 'MODERADA' | 'BAIXA' | null */
  confidence: string | null;
  confidenceNote: string | null;
  faltaSaber: string | null;
  comentarioKeyword: Keyword | null;
  comentarioTexto: string | null;
  /** true quando o SDR tentou registrar AGENDOU — proibido, convertido para OUTRO. */
  agendouRejeitado: boolean;
  /** Campos esperados que não vieram. Exibido na tela de Entrada SDR. */
  camposAusentes: string[];
};

type FieldKey = keyof Omit<
  ParsedRepasse,
  | "phoneNormalized"
  | "comentarioKeyword"
  | "comentarioTexto"
  | "agendouRejeitado"
  | "camposAusentes"
  | "confidenceNote"
>;

/** Cabeçalhos aceitos por campo. Comparados sem acento e em maiúsculas. */
const FIELD_HEADERS: Array<{ key: FieldKey | "comentario" | "confidence"; headers: string[] }> = [
  { key: "name", headers: ["LEAD", "NOME"] },
  { key: "origin", headers: ["ORIGEM"] },
  { key: "city", headers: ["CIDADE", "CIDADE / REGIAO", "CIDADE/REGIAO"] },
  { key: "phoneRaw", headers: ["TELEFONE", "WHATSAPP", "CELULAR"] },
  { key: "situacao", headers: ["SITUACAO", "SITUACAO ATUAL"] },
  {
    key: "incomoda",
    headers: [
      "O QUE INCOMODA / O QUE BUSCA",
      "O QUE INCOMODA/O QUE BUSCA",
      "O QUE INCOMODA",
      "O QUE BUSCA",
    ],
  },
  { key: "intencaoTempo", headers: ["INTENCAO DE TEMPO", "INTENCAO"] },
  { key: "disponibilidade", headers: ["DISPONIBILIDADE"] },
  { key: "jaInformado", headers: ["JA FOI INFORMADO SOBRE", "JA INFORMADO"] },
  {
    key: "objecoes",
    headers: ["OBJECOES QUE APARECERAM", "OBJECOES", "OBJECAO"],
  },
  { key: "classification", headers: ["CLASSIFICACAO"] },
  { key: "confidence", headers: ["NIVEL DE CONFIANCA", "CONFIANCA"] },
  { key: "faltaSaber", headers: ["O QUE FALTA SABER", "FALTA SABER"] },
  {
    key: "comentario",
    headers: [
      "COMENTARIO A REGISTRAR NO CARD",
      "COMENTARIO NO CARD",
      "COMENTARIO",
    ],
  },
];

function deaccent(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Um valor que sobrou como template ("[nome]", "...", "-") não é um valor. */
function cleanValue(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  // Remove colchetes de template que envolvam a linha inteira
  if (/^\[.*\]$/s.test(value)) value = value.slice(1, -1).trim();
  if (!value) return null;
  if (/^[.\-—–_…]+$/.test(value)) return null;
  const placeholder = deaccent(value).toLowerCase();
  if (
    placeholder === "nao informado" ||
    placeholder === "n/a" ||
    placeholder === "na" ||
    placeholder === "vazio"
  ) {
    return null;
  }
  return value;
}

/** Identifica se a linha abre um campo conhecido; devolve a chave e o resto da linha. */
function matchHeader(line: string): { key: string; rest: string } | null {
  const withoutColon = line.trim();
  const colonIndex = withoutColon.indexOf(":");
  const candidate = deaccent(
    colonIndex >= 0 ? withoutColon.slice(0, colonIndex) : withoutColon,
  )
    .toUpperCase()
    .trim();

  for (const field of FIELD_HEADERS) {
    if (field.headers.includes(candidate)) {
      return {
        key: field.key,
        rest: colonIndex >= 0 ? withoutColon.slice(colonIndex + 1) : "",
      };
    }
  }
  return null;
}

function normalizeClassification(value: string | null): string | null {
  if (!value) return null;
  const upper = deaccent(value).toUpperCase();
  if (upper.includes("NAO QUALIFICADO") || upper.includes("NAO-QUALIFICADO")) {
    return "NAO QUALIFICADO";
  }
  if (upper.includes("QUALIFICADO")) return "QUALIFICADO";
  if (upper.includes("INDEFINIDO")) return "INDEFINIDO";
  return null;
}

function normalizeConfidence(value: string | null): {
  level: string | null;
  note: string | null;
} {
  if (!value) return { level: null, note: null };
  const upper = deaccent(value).toUpperCase();
  let level: string | null = null;
  if (upper.includes("ALTA")) level = "ALTA";
  else if (upper.includes("MODERADA") || upper.includes("MEDIA")) level = "MODERADA";
  else if (upper.includes("BAIXA")) level = "BAIXA";

  // A justificativa é a linha seguinte ao nível, conforme o formato do documento.
  const lines = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const note = lines.length > 1 ? lines.slice(1).join(" ") : null;

  return { level, note: cleanValue(note ?? "") };
}

/**
 * Do bloco COMENTÁRIO A REGISTRAR NO CARD extrai a palavra-chave e o texto sugerido.
 * Formato esperado:
 *   COMENTÁRIO A REGISTRAR NO CARD:
 *   OUTRO
 *   Texto sugerido: "Lead pronto para avaliação"
 */
function parseComentario(block: string | null): {
  keyword: Keyword | null;
  texto: string | null;
  agendouRejeitado: boolean;
} {
  if (!block) return { keyword: null, texto: null, agendouRejeitado: false };

  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let rawKeyword: string | null = null;
  const textParts: string[] = [];

  for (const line of lines) {
    const sugerido = line.match(/^texto\s+sugerido\s*:\s*(.*)$/i);
    if (sugerido) {
      textParts.push(sugerido[1].replace(/^["']|["']$/g, "").trim());
      continue;
    }
    if (!rawKeyword) {
      // A palavra-chave vem sozinha na linha, em maiúsculas, possivelmente entre colchetes.
      const stripped = line.replace(/^\[|\]$/g, "").trim();
      const candidate = deaccent(stripped).toUpperCase();
      // Testa as compostas primeiro para não casar "SEM" antes de "SEM RETORNO".
      const composed = ["NAO COMPARECEU", "PEDIDO FEITO", "PECA CHEGOU", "SEM RETORNO"].find(
        (kw) => candidate.startsWith(kw),
      );
      const first = composed ?? candidate.split(/[\s:]+/)[0];
      if (composed || isKeyword(first)) {
        rawKeyword = first;
        // deaccent preserva o comprimento, então o corte vale para a linha original.
        const rest = stripped.slice(first.length).replace(/^[\s:]+/, "").trim();
        if (rest) textParts.push(rest);
        continue;
      }
    }
    textParts.push(line);
  }

  const { keyword, rejected } = sanitizeSdrKeyword(rawKeyword);
  return {
    keyword,
    texto: cleanValue(textParts.join(" ")),
    agendouRejeitado: rejected,
  };
}

const CAMPOS_ESPERADOS: Array<[keyof ParsedRepasse, string]> = [
  ["name", "LEAD"],
  ["phoneNormalized", "TELEFONE"],
  ["city", "CIDADE"],
  ["classification", "CLASSIFICAÇÃO"],
  ["confidence", "NÍVEL DE CONFIANÇA"],
];

export function parseRepasse(input: string): ParsedRepasse {
  // Tudo antes do marcador é mensagem para o cliente e não nos interessa.
  const markerIndex = input.indexOf("===REPASSE===");
  const body = markerIndex >= 0 ? input.slice(markerIndex + "===REPASSE===".length) : input;

  const buckets = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of body.split("\n")) {
    const header = matchHeader(line);
    if (header) {
      current = header.key;
      if (!buckets.has(current)) buckets.set(current, []);
      if (header.rest.trim()) buckets.get(current)!.push(header.rest);
      continue;
    }
    if (current) buckets.get(current)!.push(line);
  }

  const get = (key: string): string | null => {
    const lines = buckets.get(key);
    if (!lines) return null;
    return cleanValue(lines.join("\n"));
  };

  const phoneRaw = get("phoneRaw");
  const confidenceRaw = buckets.get("confidence")?.join("\n") ?? null;
  const { level, note } = normalizeConfidence(confidenceRaw);
  const comentario = parseComentario(buckets.get("comentario")?.join("\n") ?? null);

  const parsed: ParsedRepasse = {
    name: get("name"),
    origin: get("origin"),
    city: get("city"),
    phoneRaw,
    phoneNormalized: normalizePhone(phoneRaw),
    situacao: get("situacao"),
    incomoda: get("incomoda"),
    intencaoTempo: get("intencaoTempo"),
    disponibilidade: get("disponibilidade"),
    jaInformado: get("jaInformado"),
    objecoes: get("objecoes"),
    classification: normalizeClassification(get("classification")),
    confidence: level,
    confidenceNote: note,
    faltaSaber: get("faltaSaber"),
    comentarioKeyword: comentario.keyword,
    comentarioTexto: comentario.texto,
    agendouRejeitado: comentario.agendouRejeitado,
    camposAusentes: [],
  };

  parsed.camposAusentes = CAMPOS_ESPERADOS.filter(([key]) => !parsed[key]).map(
    ([, label]) => label,
  );

  return parsed;
}

/** Monta a descrição do cliente a partir do repasse, no formato de leitura do Alex. */
export function repasseToDescription(parsed: ParsedRepasse): string {
  const blocks: string[] = [];
  const add = (title: string, value: string | null) => {
    if (value) blocks.push(`**${title}**\n${value}`);
  };

  add("Situação", parsed.situacao);
  add("O que incomoda / o que busca", parsed.incomoda);
  add("Intenção de tempo", parsed.intencaoTempo);
  add("Disponibilidade", parsed.disponibilidade);
  add("Já foi informado sobre", parsed.jaInformado);
  add("Objeções que apareceram", parsed.objecoes);
  add("O que falta saber", parsed.faltaSaber);

  if (parsed.classification) {
    const confidence = parsed.confidence
      ? ` · confiança ${parsed.confidence}${parsed.confidenceNote ? ` (${parsed.confidenceNote})` : ""}`
      : "";
    blocks.push(`**Classificação do SDR**\n${parsed.classification}${confidence}`);
  }

  return blocks.join("\n\n");
}
