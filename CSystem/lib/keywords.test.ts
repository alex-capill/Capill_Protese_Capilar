import { describe, expect, it } from "vitest";
import {
  findExtraKeywords,
  formatFollowup,
  isKeyword,
  KEYWORDS,
  sanitizeSdrKeyword,
} from "./keywords";

describe("palavras-chave", () => {
  it("tem exatamente as 11 do PADRAO_DE_COMENTARIOS", () => {
    expect(KEYWORDS).toHaveLength(11);
  });

  it("mantém a grafia SEM ACENTO do documento-fonte", () => {
    // O documento escreve assim. "Corrigir" quebraria a correspondência com o padrão.
    expect(KEYWORDS).toContain("NAO COMPARECEU");
    expect(KEYWORDS).toContain("PECA CHEGOU");
    expect(KEYWORDS).not.toContain("NÃO COMPARECEU");
    expect(KEYWORDS).not.toContain("PEÇA CHEGOU");
  });

  it("rejeita variações inventadas", () => {
    expect(isKeyword("AGENDOU")).toBe(true);
    // O documento cita AGENDADO explicitamente como o erro a evitar.
    expect(isKeyword("AGENDADO")).toBe(false);
    expect(isKeyword("agendou")).toBe(false);
  });
});

describe("sanitizeSdrKeyword", () => {
  it("converte AGENDOU do SDR para OUTRO: o SDR não agenda", () => {
    const resultado = sanitizeSdrKeyword("AGENDOU");
    expect(resultado.keyword).toBe("OUTRO");
    expect(resultado.rejected).toBe(true);
  });

  it("deixa passar as demais palavras-chave", () => {
    expect(sanitizeSdrKeyword("OUTRO")).toEqual({ keyword: "OUTRO", rejected: false });
    expect(sanitizeSdrKeyword("SEM RETORNO")).toEqual({
      keyword: "SEM RETORNO",
      rejected: false,
    });
  });

  it("devolve null para lixo", () => {
    expect(sanitizeSdrKeyword("QUALQUER COISA").keyword).toBeNull();
    expect(sanitizeSdrKeyword(null).keyword).toBeNull();
  });
});

describe("findExtraKeywords — um comentário = um evento", () => {
  it("detecta uma segunda palavra-chave no corpo", () => {
    const encontradas = findExtraKeywords("avaliação boa\nFECHOU R$1.800", "COMPARECEU");
    expect(encontradas).toContain("FECHOU");
  });

  it("não acusa a palavra-chave que já foi escolhida", () => {
    expect(findExtraKeywords("COMPARECEU hoje", "COMPARECEU")).toEqual([]);
  });

  it("não acusa palavra em minúscula no meio da frase", () => {
    expect(findExtraKeywords("cliente disse que fechou com o concorrente", null)).toEqual([]);
  });

  it("não confunde SEM RETORNO com outra coisa", () => {
    const encontradas = findExtraKeywords("SEM RETORNO desde dia 20/08", null);
    expect(encontradas).toContain("SEM RETORNO");
  });
});

describe("formatFollowup", () => {
  it("gera exatamente o formato da seção 5 do documento", () => {
    expect(formatFollowup("condição financeira", "virada da fatura", "05/10")).toBe(
      "FOLLOW-UP: motivo=condição financeira | evento=virada da fatura | data=05/10",
    );
  });
});
