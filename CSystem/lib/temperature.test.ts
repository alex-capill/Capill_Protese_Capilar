import { describe, expect, it } from "vitest";
import { nextTemperature, normalizeTemperature, temperatureFromSdrConfidence } from "./temperature";

describe("temperatura do SDR", () => {
  it("converte os três níveis declarados pelo SDR", () => {
    expect(temperatureFromSdrConfidence("ALTA")).toBe("quente");
    expect(temperatureFromSdrConfidence("MODERADA")).toBe("morno");
    expect(temperatureFromSdrConfidence("BAIXA")).toBe("frio");
  });

  it("não classifica valores ausentes ou fora do contrato", () => {
    expect(temperatureFromSdrConfidence(null)).toBeNull();
    expect(temperatureFromSdrConfidence("MÉDIA")).toBeNull();
    expect(normalizeTemperature("quente")).toBe("quente");
    expect(normalizeTemperature("alta")).toBeNull();
  });

  it("percorre as temperaturas na ordem do controle clicável", () => {
    expect(nextTemperature(null)).toBe("frio");
    expect(nextTemperature("frio")).toBe("morno");
    expect(nextTemperature("morno")).toBe("quente");
    expect(nextTemperature("quente")).toBeNull();
  });
});
