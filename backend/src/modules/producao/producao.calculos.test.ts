import { describe, expect, it } from "vitest";
import { calcularDiasDiferenca, calcularSituacaoPrazo } from "./producao.calculos.js";

describe("calcularDiasDiferenca", () => {
  it("retorna 0 quando finalizado exatamente no dia previsto", () => {
    expect(calcularDiasDiferenca(new Date("2026-08-01"), new Date("2026-08-01"))).toBe(0);
  });

  it("retorna positivo quando finalizado depois do previsto (atrasado)", () => {
    expect(calcularDiasDiferenca(new Date("2026-08-04"), new Date("2026-08-01"))).toBe(3);
  });

  it("retorna negativo quando finalizado antes do previsto (antecipado)", () => {
    expect(calcularDiasDiferenca(new Date("2026-07-25"), new Date("2026-08-01"))).toBe(-7);
  });

  it("ignora hora do dia — só compara a data (evita bug de fuso horário)", () => {
    const finalizacaoComHora = new Date("2026-08-01T23:59:00");
    const previstaComHora = new Date("2026-08-01T00:01:00");
    expect(calcularDiasDiferenca(finalizacaoComHora, previstaComHora)).toBe(0);
  });

  it("calcula corretamente atravessando virada de mês", () => {
    expect(calcularDiasDiferenca(new Date("2026-02-03"), new Date("2026-01-31"))).toBe(3);
  });

  it("calcula corretamente atravessando virada de ano", () => {
    expect(calcularDiasDiferenca(new Date("2027-01-02"), new Date("2026-12-30"))).toBe(3);
  });
});

describe("calcularSituacaoPrazo", () => {
  it("dias negativos => ANTECIPADO", () => {
    expect(calcularSituacaoPrazo(-1)).toBe("ANTECIPADO");
    expect(calcularSituacaoPrazo(-10)).toBe("ANTECIPADO");
  });

  it("zero dias => NO_PRAZO", () => {
    expect(calcularSituacaoPrazo(0)).toBe("NO_PRAZO");
  });

  it("dias positivos => ATRASADO", () => {
    expect(calcularSituacaoPrazo(1)).toBe("ATRASADO");
    expect(calcularSituacaoPrazo(10)).toBe("ATRASADO");
  });
});
