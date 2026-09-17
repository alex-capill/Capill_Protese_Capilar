import { describe, expect, it } from "vitest";
import { extractPhone, formatPhone, normalizePhone } from "./phone";

/**
 * A normalização de telefone é a chave da Regra 1 (card único por cliente).
 * Um erro aqui vira card duplicado, que é exatamente o que o Manual proíbe.
 */
describe("normalizePhone", () => {
  it("leva formatos diferentes do mesmo número à mesma chave", () => {
    const esperado = "5584999998888";
    const variantes = [
      "84999998888",
      "(84) 99999-8888",
      "84 9 9999-8888",
      "+55 84 99999-8888",
      "5584999998888",
      "084999998888",
      "  84.99999.8888  ",
    ];

    for (const variante of variantes) {
      expect(normalizePhone(variante), variante).toBe(esperado);
    }
  });

  it("acrescenta o nono dígito em celular antigo de 8 dígitos", () => {
    expect(normalizePhone("8499998888")).toBe("5584999998888");
  });

  it("preserva fixo de 8 dígitos sem inventar o nono", () => {
    // Fixo começa em 2-5: não recebe o 9.
    expect(normalizePhone("8432118888")).toBe("558432118888");
  });

  it("devolve null quando não dá para identificar ninguém", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });

  it("não confunde dois números diferentes", () => {
    expect(normalizePhone("84999998888")).not.toBe(normalizePhone("84999998889"));
  });
});

describe("formatPhone", () => {
  it("formata celular brasileiro", () => {
    expect(formatPhone("5584999998888")).toBe("+55 (84) 99999-8888");
  });

  it("formata fixo brasileiro", () => {
    expect(formatPhone("558432118888")).toBe("+55 (84) 3211-8888");
  });

  it("devolve string vazia para null", () => {
    expect(formatPhone(null)).toBe("");
  });
});

describe("extractPhone", () => {
  it("acha o telefone no meio de um texto", () => {
    expect(extractPhone("Cliente João, contato (84) 99999-8888, quer avaliação")).toBe(
      "5584999998888",
    );
  });

  it("devolve null quando não há telefone", () => {
    expect(extractPhone("Cliente João, sem contato")).toBeNull();
  });
});
