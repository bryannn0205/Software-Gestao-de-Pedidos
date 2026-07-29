// Regras de cálculo do pedido, isoladas em funções puras (sem acesso a banco)
// para poderem ser testadas diretamente — ver pedidos.calculos.test.ts.

export interface ProdutoParaCalculo {
  tipoVenda: "UNIDADE" | "KG";
  valorUnitario: number;
  pesoKg: number | null;
}

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Para produtos vendidos por Kg, o preço cadastrado é do pacote/embalagem
// (ex.: R$20 para um pacote de 2kg) — o valor por Kg é o preço dividido pelo peso.
export function calcularValorUnitarioItem(produto: ProdutoParaCalculo): number {
  if (produto.tipoVenda === "KG" && produto.pesoKg) {
    return produto.valorUnitario / produto.pesoKg;
  }
  return produto.valorUnitario;
}

export function calcularValorTotalItem(valorUnitario: number, quantidade: number): number {
  return arredondarMoeda(valorUnitario * quantidade);
}

export function calcularUnidadeItem(tipoVenda: "UNIDADE" | "KG"): string {
  return tipoVenda === "KG" ? "Kg" : "pç";
}

export function calcularValorTotalPedido(itens: { valorTotal: number }[]): number {
  return arredondarMoeda(itens.reduce((acumulado, item) => acumulado + item.valorTotal, 0));
}

export function calcularValorComDesconto(valorTotal: number, descontoPercentual: number): number {
  return arredondarMoeda(valorTotal * (1 - descontoPercentual / 100));
}
