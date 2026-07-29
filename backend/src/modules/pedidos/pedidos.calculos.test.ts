import { describe, expect, it } from "vitest";
import {
  arredondarMoeda,
  calcularUnidadeItem,
  calcularValorComDesconto,
  calcularValorTotalItem,
  calcularValorTotalPedido,
  calcularValorUnitarioItem,
} from "./pedidos.calculos.js";

describe("calcularValorUnitarioItem", () => {
  it("usa o valor cadastrado direto para produto vendido por Unidade", () => {
    expect(calcularValorUnitarioItem({ tipoVenda: "UNIDADE", valorUnitario: 25, pesoKg: null })).toBe(25);
  });

  it("divide o preço pelo peso para produto vendido por Kg (ex.: pacote de R$20 com 2kg = R$10/kg)", () => {
    expect(calcularValorUnitarioItem({ tipoVenda: "KG", valorUnitario: 20, pesoKg: 2 })).toBe(10);
  });

  it("usa o valor cadastrado direto se for Kg mas sem peso definido (proteção contra divisão por zero/nulo)", () => {
    expect(calcularValorUnitarioItem({ tipoVenda: "KG", valorUnitario: 20, pesoKg: null })).toBe(20);
    expect(calcularValorUnitarioItem({ tipoVenda: "KG", valorUnitario: 20, pesoKg: 0 })).toBe(20);
  });
});

describe("calcularUnidadeItem", () => {
  it("retorna 'Kg' para venda por peso e 'pç' para venda por unidade", () => {
    expect(calcularUnidadeItem("KG")).toBe("Kg");
    expect(calcularUnidadeItem("UNIDADE")).toBe("pç");
  });
});

describe("arredondarMoeda", () => {
  it("arredonda para 2 casas decimais, corrigindo erros de ponto flutuante do JS", () => {
    // 0.1 + 0.2 dá 0.30000000000000004 em JS puro
    expect(arredondarMoeda(0.1 + 0.2)).toBe(0.3);
    expect(arredondarMoeda(19.995)).toBe(20);
  });
});

describe("calcularValorTotalItem", () => {
  it("multiplica valor unitário pela quantidade e arredonda", () => {
    expect(calcularValorTotalItem(10, 3)).toBe(30);
  });

  it("funciona com quantidade fracionária (venda por Kg)", () => {
    expect(calcularValorTotalItem(10, 2.5)).toBe(25);
  });

  it("arredonda corretamente quando o resultado tem dízima", () => {
    // 33.333... * 3 = 99.999... -> deve arredondar para 100, não para 99.99
    expect(calcularValorTotalItem(100 / 3, 3)).toBe(100);
  });
});

describe("calcularValorTotalPedido", () => {
  it("soma o valor total de todos os itens", () => {
    expect(calcularValorTotalPedido([{ valorTotal: 10 }, { valorTotal: 20.5 }, { valorTotal: 5 }])).toBe(35.5);
  });

  it("retorna 0 para pedido sem itens (não deveria ocorrer na prática, mas não deve quebrar)", () => {
    expect(calcularValorTotalPedido([])).toBe(0);
  });
});

describe("calcularValorComDesconto", () => {
  it("sem desconto, mantém o valor total", () => {
    expect(calcularValorComDesconto(100, 0)).toBe(100);
  });

  it("aplica desconto percentual corretamente (10% de R$100 = R$90)", () => {
    expect(calcularValorComDesconto(100, 10)).toBe(90);
  });

  it("desconto de 100% zera o valor", () => {
    expect(calcularValorComDesconto(100, 100)).toBe(0);
  });

  it("aceita desconto com casas decimais (ex.: 12,5%)", () => {
    expect(calcularValorComDesconto(200, 12.5)).toBe(175);
  });
});
