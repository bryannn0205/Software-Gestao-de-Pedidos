import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { mudarEtapaPedido } from "./producao.service.js";

const ETAPAS = ["EM_PRODUCAO", "FINALIZADO", "ENTREGUE"] as const;

export async function producaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: requirePermissao("producao", "read") }, async (request, reply) => {
    const { etapa, page, pageSize } = z
      .object({
        etapa: z.enum(ETAPAS).default("EM_PRODUCAO"),
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where: { etapa },
        include: { cliente: { include: { enderecos: true } } },
        orderBy: { dataEntregaPrevista: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pedido.count({ where: { etapa } }),
    ]);

    return reply.send({ data: pedidos, total, page, pageSize });
  });

  app.patch("/:id/etapa", { preHandler: requirePermissao("producao", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { novaEtapa, dataFinalizacao } = z
      .object({ novaEtapa: z.enum(ETAPAS), dataFinalizacao: z.coerce.date().optional() })
      .parse(request.body);

    const pedido = await mudarEtapaPedido(id, novaEtapa, dataFinalizacao, request.user.sub);
    return reply.send(pedido);
  });
}
