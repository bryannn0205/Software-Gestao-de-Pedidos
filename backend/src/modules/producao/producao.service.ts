import { prisma } from "../../shared/prisma.js";
import { NotFoundError, ConflictError } from "../../shared/errors.js";
import type { $Enums } from "@prisma/client";
import { calcularDiasDiferenca, calcularSituacaoPrazo } from "./producao.calculos.js";

const ETAPA_LABEL: Record<$Enums.EtapaPedido, string> = {
  EM_PRODUCAO: "Em Produção",
  FINALIZADO: "Finalizado",
  ENTREGUE: "Entregue (OK)",
};

// Transições permitidas a partir de cada etapa: um passo adiante (fluxo normal)
// ou um passo atrás (correção). Pular etapa (ex.: Em Produção → Entregue direto)
// deixava o pedido sem situação de prazo para sempre — achado da auditoria.
const TRANSICOES_VALIDAS: Record<$Enums.EtapaPedido, $Enums.EtapaPedido[]> = {
  EM_PRODUCAO: ["FINALIZADO"],
  FINALIZADO: ["EM_PRODUCAO", "ENTREGUE"],
  ENTREGUE: ["FINALIZADO"],
};

export async function mudarEtapaPedido(
  id: string,
  novaEtapa: $Enums.EtapaPedido,
  dataFinalizacao: Date | undefined,
  usuarioId: string,
) {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw new NotFoundError("Pedido");

  if (novaEtapa !== pedido.etapa && !TRANSICOES_VALIDAS[pedido.etapa].includes(novaEtapa)) {
    throw new ConflictError(
      `Não é possível mudar de "${ETAPA_LABEL[pedido.etapa]}" direto para "${ETAPA_LABEL[novaEtapa]}". ` +
        "Siga a ordem: Em Produção → Finalizado → Entregue (ou volte uma etapa por vez).",
    );
  }

  const dataAtualizada: {
    etapa: $Enums.EtapaPedido;
    dataFinalizacao: Date | null;
    situacaoPrazo: $Enums.SituacaoPrazo | null;
    diasDiferenca: number | null;
  } = {
    etapa: novaEtapa,
    dataFinalizacao: pedido.dataFinalizacao,
    situacaoPrazo: pedido.situacaoPrazo,
    diasDiferenca: pedido.diasDiferenca,
  };

  if (novaEtapa === "FINALIZADO") {
    if (!dataFinalizacao) {
      throw new ConflictError("Data de finalização é obrigatória para marcar o pedido como Finalizado.");
    }
    const diferenca = calcularDiasDiferenca(dataFinalizacao, pedido.dataEntregaPrevista);
    dataAtualizada.dataFinalizacao = dataFinalizacao;
    dataAtualizada.diasDiferenca = diferenca;
    dataAtualizada.situacaoPrazo = calcularSituacaoPrazo(diferenca);
  } else if (novaEtapa === "EM_PRODUCAO") {
    dataAtualizada.dataFinalizacao = null;
    dataAtualizada.situacaoPrazo = null;
    dataAtualizada.diasDiferenca = null;
  }

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.pedido.update({
      where: { id },
      data: dataAtualizada,
      include: { cliente: true, itens: { include: { produto: true } } },
    });

    await tx.pedidoStatusHist.create({
      data: {
        pedidoId: id,
        etapaAnterior: pedido.etapa,
        etapaNova: novaEtapa,
        usuarioId,
      },
    });

    return atualizado;
  });
}
