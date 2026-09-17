/**
 * Normalização de telefone — a chave da REGRA 1 (card único por cliente).
 *
 * O objetivo é que o mesmo cliente chegando por caminhos diferentes (webhook do SDR,
 * digitação manual, com ou sem DDI, com ou sem o 9 do celular) caia sempre na mesma
 * chave. Erro aqui = card duplicado = Regra 1 quebrada.
 */

const DDI_BR = "55";

/**
 * Reduz um telefone a uma chave canônica: só dígitos, sempre com DDI 55 e com o
 * nono dígito presente quando for celular.
 *
 * Retorna null quando não há dígitos suficientes para identificar alguém —
 * nesse caso o cliente fica sem telefone, e não com uma chave inventada.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // Remove zeros de operadora/DDD à esquerda (ex: 084..., 0xx84...)
  digits = digits.replace(/^0+/, "");

  // Já veio com DDI brasileiro
  if (digits.startsWith(DDI_BR) && digits.length >= 12) {
    digits = digits.slice(DDI_BR.length);
  }

  // Sem DDI: esperamos DDD (2) + número (8 ou 9)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.slice(0, 2);
    let number = digits.slice(2);
    // Celular antigo de 8 dígitos começando em 6-9 ganha o nono dígito.
    if (number.length === 8 && /^[6-9]/.test(number)) {
      number = `9${number}`;
    }
    return `${DDI_BR}${ddd}${number}`;
  }

  // Número internacional ou formato que não reconhecemos: preserva como veio,
  // desde que tenha tamanho plausível. Melhor uma chave estranha do que uma errada.
  if (digits.length >= 8 && digits.length <= 15) return digits;

  return null;
}

/** Exibição amigável: +55 (84) 99999-9999 */
export function formatPhone(normalized: string | null | undefined): string {
  if (!normalized) return "";
  const d = normalized;
  if (d.startsWith(DDI_BR) && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const mid = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
    const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
    return `+55 (${ddd}) ${mid}-${end}`;
  }
  return `+${d}`;
}

/** Link direto para a conversa no WhatsApp. */
export function whatsappUrl(normalized: string | null | undefined): string | null {
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
}

/**
 * Extrai o primeiro telefone plausível de um texto livre — usado no parse do
 * bloco ===REPASSE=== e na leitura de descrições coladas.
 */
export function extractPhone(text: string | null | undefined): string | null {
  if (!text) return null;
  const candidates = text.match(/(?:\+?55\s*)?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/g);
  if (!candidates) return null;
  for (const candidate of candidates) {
    const normalized = normalizePhone(candidate);
    if (normalized) return normalized;
  }
  return null;
}
