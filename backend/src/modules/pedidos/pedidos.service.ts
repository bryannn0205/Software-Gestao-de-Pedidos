import { prisma } from "../../shared/prisma.js";
import { NotFoundError, ConflictError } from "../../shared/errors.js";
import {
  calcularUnidadeItem,
  calcularValorComDesconto,
  calcularValorTotalItem,
  calcularValorTotalPedido,
  calcularValorUnitarioItem,
} from "./pedidos.calculos.js";

export interface ItemInput {
  produtoId: string;
  cor?: string;
  quantidade: number;
}

export interface PedidoInput {
  clienteId: string;
  dataPedido: Date;
  dataEntregaPrevista?: Date;
  formaPagamento: string;
  descontoPercentual: number;
  observacoes?: string;
  itens: ItemInput[];
}

const PEDIDO_INCLUDE = {
  itens: { include: { produto: true } },
  cliente: { include: { enderecos: true } },
  statusHist: { orderBy: { em: "asc" as const } },
} as const;

async function obterPrazoPadraoDias(): Promise<number> {
  const parametro = await prisma.parametro.findUnique({ where: { chave: "prazo_padrao_dias" } });
  const dias = parametro ? Number(parametro.valor) : 7;
  return Number.isFinite(dias) && dias > 0 ? dias : 7;
}

function addDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

async function calcularItens(itensInput: ItemInput[]) {
  if (itensInput.length === 0) {
    throw new ConflictError("O pedido precisa ter ao menos 1 item.");
  }

  const produtoIds = itensInput.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds } } });
  const produtoMap = new Map(produtos.map((p) => [p.id, p]));

  return itensInput.map((item) => {
    const produto = produtoMap.get(item.produtoId);
    if (!produto) throw new NotFoundError("Produto");
    if (!produto.ativo) {
      throw new ConflictError(`Produto "${produto.material} ${produto.medida}" está inativo.`);
    }

    const valorUnitario = calcularValorUnitarioItem({
      tipoVenda: produto.tipoVenda,
      valorUnitario: Number(produto.valorUnitario),
      pesoKg: produto.pesoKg ? Number(produto.pesoKg) : null,
    });
    const valorTotal = calcularValorTotalItem(valorUnitario, item.quantidade);

    return {
      produtoId: produto.id,
      cor: item.cor,
      quantidade: item.quantidade,
      unidade: calcularUnidadeItem(produto.tipoVenda),
      valorUnitario,
      valorTotal,
    };
  });
}

async function validarCliente(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new NotFoundError("Cliente");
  if (!cliente.ativo) {
    throw new ConflictError(`Cliente "${cliente.razaoSocial}" está inativo.`);
  }
}

async function validarFormaPagamento(formaPagamento: string) {
  const existe = await prisma.dominio.findFirst({
    where: { tipo: "FORMA_PAGAMENTO", valor: formaPagamento, ativo: true },
  });
  if (!existe) {
    throw new ConflictError(`Forma de pagamento "${formaPagamento}" não é válida.`);
  }
}

export async function criarPedido(input: PedidoInput, usuarioId: string) {
  await validarCliente(input.clienteId);
  await validarFormaPagamento(input.formaPagamento);
  const itensCalculados = await calcularItens(input.itens);
  const valorTotal = calcularValorTotalPedido(itensCalculados);
  const valorComDesconto = calcularValorComDesconto(valorTotal, input.descontoPercentual);

  const prazoPadraoDias = await obterPrazoPadraoDias();
  const dataEntregaPrevista = input.dataEntregaPrevista ?? addDias(input.dataPedido, prazoPadraoDias);

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ numero: number }[]>`
      UPDATE sequencia_pedido SET proximo_numero = proximo_numero + 1 WHERE id = 1
      RETURNING proximo_numero - 1 AS numero
    `;
    const numero = rows[0]?.numero;
    if (numero === undefined) {
      throw new ConflictError("Sequência de numeração de pedidos não inicializada.");
    }

    const pedido = await tx.pedido.create({
      data: {
        numero,
        clienteId: input.clienteId,
        dataPedido: input.dataPedido,
        dataEntregaPrevista,
        formaPagamento: input.formaPagamento,
        descontoPercentual: input.descontoPercentual,
        observacoes: input.observacoes,
        valorTotal,
        valorComDesconto,
        usuarioId,
        itens: { create: itensCalculados },
      },
    });

    await tx.pedidoStatusHist.create({
      data: { pedidoId: pedido.id, etapaNova: "EM_PRODUCAO", usuarioId },
    });

    return tx.pedido.findUniqueOrThrow({ where: { id: pedido.id }, include: PEDIDO_INCLUDE });
  });
}

export async function atualizarPedido(id: string, input: PedidoInput) {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw new NotFoundError("Pedido");
  if (pedido.etapa !== "EM_PRODUCAO") {
    throw new ConflictError("Só é possível editar pedidos que ainda estão em produção.");
  }

  await validarCliente(input.clienteId);
  await validarFormaPagamento(input.formaPagamento);
  const itensCalculados = await calcularItens(input.itens);
  const valorTotal = calcularValorTotalPedido(itensCalculados);
  const valorComDesconto = calcularValorComDesconto(valorTotal, input.descontoPercentual);

  return prisma.$transaction(async (tx) => {
    await tx.itemPedido.deleteMany({ where: { pedidoId: id } });
    return tx.pedido.update({
      where: { id },
      data: {
        clienteId: input.clienteId,
        dataPedido: input.dataPedido,
        dataEntregaPrevista: input.dataEntregaPrevista ?? pedido.dataEntregaPrevista,
        formaPagamento: input.formaPagamento,
        descontoPercentual: input.descontoPercentual,
        observacoes: input.observacoes,
        valorTotal,
        valorComDesconto,
        itens: { create: itensCalculados },
      },
      include: PEDIDO_INCLUDE,
    });
  });
}

export { PEDIDO_INCLUDE };
