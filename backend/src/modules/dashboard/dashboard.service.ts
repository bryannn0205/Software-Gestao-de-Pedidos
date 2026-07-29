import { prisma } from "../../shared/prisma.js";

export async function obterKpis() {
  const [totais, ticket, porStatus, prazoContagem, mediaAtraso, mediaAntecipacao] = await Promise.all([
    prisma.pedido.aggregate({ _sum: { valorTotal: true, valorComDesconto: true } }),
    prisma.pedido.aggregate({ _avg: { valorComDesconto: true }, where: { valorComDesconto: { gt: 0 } } }),
    prisma.pedido.groupBy({ by: ["etapa"], _count: { _all: true } }),
    prisma.pedido.groupBy({ by: ["situacaoPrazo"], _count: { _all: true }, where: { situacaoPrazo: { not: null } } }),
    prisma.pedido.aggregate({ _avg: { diasDiferenca: true }, where: { situacaoPrazo: "ATRASADO" } }),
    prisma.pedido.aggregate({ _avg: { diasDiferenca: true }, where: { situacaoPrazo: "ANTECIPADO" } }),
  ]);

  const pedidosPorStatus = { EM_PRODUCAO: 0, FINALIZADO: 0, ENTREGUE: 0 } as Record<string, number>;
  for (const grupo of porStatus) {
    pedidosPorStatus[grupo.etapa] = grupo._count._all;
  }

  const contagemPrazo = { ANTECIPADO: 0, NO_PRAZO: 0, ATRASADO: 0 } as Record<string, number>;
  for (const grupo of prazoContagem) {
    if (grupo.situacaoPrazo) contagemPrazo[grupo.situacaoPrazo] = grupo._count._all;
  }
  const totalFinalizados = contagemPrazo.ANTECIPADO + contagemPrazo.NO_PRAZO + contagemPrazo.ATRASADO;

  return {
    valorTotalVendido: Number(totais._sum.valorTotal ?? 0),
    valorTotalRecebido: Number(totais._sum.valorComDesconto ?? 0),
    ticketMedio: Number(ticket._avg.valorComDesconto ?? 0),
    pedidosPorStatus,
    prazos: {
      total: totalFinalizados,
      antecipados: contagemPrazo.ANTECIPADO,
      noPrazo: contagemPrazo.NO_PRAZO,
      atrasados: contagemPrazo.ATRASADO,
      percentualNoPrazo:
        totalFinalizados > 0
          ? Math.round(((contagemPrazo.ANTECIPADO + contagemPrazo.NO_PRAZO) / totalFinalizados) * 1000) / 10
          : 0,
      percentualAtrasados:
        totalFinalizados > 0 ? Math.round((contagemPrazo.ATRASADO / totalFinalizados) * 1000) / 10 : 0,
      mediaDiasAtraso: Math.round(Number(mediaAtraso._avg.diasDiferenca ?? 0) * 10) / 10,
      mediaDiasAntecipacao: Math.round(Math.abs(Number(mediaAntecipacao._avg.diasDiferenca ?? 0)) * 10) / 10,
    },
  };
}

interface FaturamentoMensalRow {
  mes: Date;
  quantidade: bigint;
  faturamento: string | null;
}

export async function obterFaturamentoMensal(ano: number) {
  const linhas = await prisma.$queryRaw<FaturamentoMensalRow[]>`
    SELECT date_trunc('month', data_pedido) AS mes,
           COUNT(*)::bigint AS quantidade,
           SUM(valor_com_desconto)::text AS faturamento
    FROM pedidos
    WHERE EXTRACT(YEAR FROM data_pedido) = ${ano}
    GROUP BY 1
    ORDER BY 1
  `;

  const porMes = new Map(
    linhas.map((linha) => [
      linha.mes.getUTCMonth() + 1,
      { quantidade: Number(linha.quantidade), faturamento: Number(linha.faturamento ?? 0) },
    ]),
  );

  let quantidadeAcumulada = 0;
  let faturamentoAcumulado = 0;

  return Array.from({ length: 12 }, (_, index) => {
    const mes = index + 1;
    const dados = porMes.get(mes) ?? { quantidade: 0, faturamento: 0 };
    quantidadeAcumulada += dados.quantidade;
    faturamentoAcumulado += dados.faturamento;
    return {
      mes,
      quantidade: dados.quantidade,
      quantidadeAcumulada,
      faturamento: dados.faturamento,
      faturamentoAcumulado,
    };
  });
}
