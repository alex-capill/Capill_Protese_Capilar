import { describe, expect, it } from "vitest";
import { parseRepasse, repasseToDescription } from "./sdr-parser";

/**
 * O bloco ===REPASSE=== é gerado por um modelo de linguagem, não por um schema.
 * Estes testes cobrem o formato ideal e as variações que aparecem na prática.
 */

const REPASSE_COMPLETO = `Vou passar seu contato para o Alex agora.

===REPASSE===
LEAD: João Nicodemos
ORIGEM: anúncio
CIDADE: Parnamirim
TELEFONE: 84999998888

SITUAÇÃO:
Calvície nível 5, já usou minoxidil por 2 anos, usa boné todo dia

O QUE INCOMODA / O QUE BUSCA:
"não consigo mais tirar o boné nem em casa"

INTENÇÃO DE TEMPO:
Quer resolver esse mês

DISPONIBILIDADE:
Tarde

JÁ FOI INFORMADO SOBRE:
procedimento / faixa de preço / manutenção

OBJEÇÕES QUE APARECERAM:
achou caro no primeiro momento

CLASSIFICAÇÃO:
QUALIFICADO

NÍVEL DE CONFIANÇA:
ALTA
declarou prazo específico e pediu para agendar

O QUE FALTA SABER:
se já usou prótese antes

COMENTÁRIO A REGISTRAR NO CARD:
OUTRO
Texto sugerido: "Lead pronto para avaliação, conversa encaminhada para Alex"`;

describe("parseRepasse — bloco completo", () => {
  const parsed = parseRepasse(REPASSE_COMPLETO);

  it("ignora a mensagem do cliente antes do marcador", () => {
    expect(parsed.name).toBe("João Nicodemos");
    expect(parsed.situacao).not.toContain("Vou passar seu contato");
  });

  it("lê os campos de uma linha", () => {
    expect(parsed.origin).toBe("anúncio");
    expect(parsed.city).toBe("Parnamirim");
    expect(parsed.phoneNormalized).toBe("5584999998888");
  });

  it("lê os campos em bloco multilinha", () => {
    expect(parsed.situacao).toContain("Calvície nível 5");
    expect(parsed.incomoda).toContain("não consigo mais tirar o boné");
    expect(parsed.intencaoTempo).toBe("Quer resolver esse mês");
  });

  it("normaliza classificação e confiança", () => {
    expect(parsed.classification).toBe("QUALIFICADO");
    expect(parsed.confidence).toBe("ALTA");
    expect(parsed.confidenceNote).toContain("declarou prazo específico");
  });

  it("separa a palavra-chave do texto sugerido", () => {
    expect(parsed.comentarioKeyword).toBe("OUTRO");
    expect(parsed.comentarioTexto).toBe(
      "Lead pronto para avaliação, conversa encaminhada para Alex",
    );
  });

  it("não reporta campos ausentes quando tudo veio", () => {
    expect(parsed.camposAusentes).toEqual([]);
  });
});

describe("parseRepasse — variações e defeitos", () => {
  it("entende NÃO QUALIFICADO com e sem acento", () => {
    expect(parseRepasse("CLASSIFICAÇÃO:\nNÃO QUALIFICADO").classification).toBe(
      "NAO QUALIFICADO",
    );
    expect(parseRepasse("CLASSIFICACAO: NAO QUALIFICADO").classification).toBe(
      "NAO QUALIFICADO",
    );
  });

  it("não confunde NÃO QUALIFICADO com QUALIFICADO", () => {
    expect(parseRepasse("CLASSIFICAÇÃO: NÃO QUALIFICADO").classification).not.toBe(
      "QUALIFICADO",
    );
  });

  it("trata colchetes de template não preenchidos como ausência", () => {
    const parsed = parseRepasse("LEAD: [nome]\nCIDADE: [...]");
    expect(parsed.name).toBeNull();
    expect(parsed.city).toBeNull();
  });

  it("recusa AGENDOU vindo do SDR e converte para OUTRO", () => {
    const parsed = parseRepasse(
      "COMENTÁRIO A REGISTRAR NO CARD:\nAGENDOU\nTexto sugerido: \"marcou para sexta\"",
    );
    expect(parsed.comentarioKeyword).toBe("OUTRO");
    expect(parsed.agendouRejeitado).toBe(true);
  });

  it("reconhece palavra-chave composta sem acento", () => {
    const parsed = parseRepasse("COMENTÁRIO A REGISTRAR NO CARD:\nSEM RETORNO");
    expect(parsed.comentarioKeyword).toBe("SEM RETORNO");
  });

  it("lista os campos que faltaram", () => {
    const parsed = parseRepasse("===REPASSE===\nLEAD: Carlos");
    expect(parsed.camposAusentes).toContain("TELEFONE");
    expect(parsed.camposAusentes).toContain("CLASSIFICAÇÃO");
    expect(parsed.camposAusentes).not.toContain("LEAD");
  });

  it("não quebra com bloco vazio", () => {
    const parsed = parseRepasse("===REPASSE===");
    expect(parsed.name).toBeNull();
    expect(parsed.classification).toBeNull();
  });

  it("aceita telefone com DDI e formatação", () => {
    expect(parseRepasse("TELEFONE: +55 (84) 99999-8888").phoneNormalized).toBe(
      "5584999998888",
    );
  });
});

describe("repasseToDescription", () => {
  it("monta a descrição só com o que existe", () => {
    const description = repasseToDescription(parseRepasse(REPASSE_COMPLETO));
    expect(description).toContain("SITUAÇÃO");
    expect(description).toContain("CLASSIFICAÇÃO DO SDR");
    expect(description).toContain("confiança ALTA");
  });

  it("não inventa seção para campo ausente", () => {
    const description = repasseToDescription(parseRepasse("LEAD: Carlos"));
    expect(description).not.toContain("SITUAÇÃO");
  });

  it("não usa markdown: o campo é exibido como texto puro", () => {
    const description = repasseToDescription(parseRepasse(REPASSE_COMPLETO));
    expect(description).not.toContain("**");
  });
});
