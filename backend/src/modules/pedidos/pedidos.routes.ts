import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { registrarAuditoria } from "../../shared/auditoria.js";
import { NotFoundError } from "../../shared/errors.js";
import { criarPedido, atualizarPedido, PEDIDO_INCLUDE } from "./pedidos.service.js";

const itemSchema = z.object({
  produtoId: z.string().uuid(),
  cor: z.string().optional(),
  quantidade: z.number().positive(),
});

const pedidoSchema = z
  .object({
    clienteId: z.string().uuid(),
    dataPedido: z.coerce.date(),
    dataEntregaPrevista: z.coerce.date().optional(),
    formaPagamento: z.string().min(1),
    descontoPercentual: z.number().min(0).max(100).default(0),
    observacoes: z.string().optional(),
    itens: z.array(itemSchema).min(1),
  })
  .refine((data) => !data.dataEntregaPrevista || data.dataEntregaPrevista >= data.dataPedido, {
    message: "A data de entrega prevista não pode ser anterior à data do pedido.",
    path: ["dataEntregaPrevista"],
  });

const listQuerySchema = z.object({
  etapa: z.enum(["EM_PRODUCAO", "FINALIZADO", "ENTREGUE"]).optional(),
  clienteId: z.string().uuid().optional(),
  cidade: z.string().optional(),
  numero: z.coerce.number().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export async function pedidosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: requirePermissao("pedidos", "read") }, async (request, reply) => {
    const { etapa, clienteId, cidade, numero, dataInicio, dataFim, page, pageSize } = listQuerySchema.parse(
      request.query,
    );

    const where = {
      ...(etapa ? { etapa } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(numero ? { numero } : {}),
      ...(cidade ? { cliente: { enderecos: { some: { cidade: { contains: cidade, mode: "insensitive" as const } } } } } : {}),
      ...(dataInicio || dataFim
        ? { dataPedido: { ...(dataInicio ? { gte: dataInicio } : {}), ...(dataFim ? { lte: dataFim } : {}) } }
        : {}),
    };

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: { cliente: true, itens: true },
        orderBy: { numero: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pedido.count({ where }),
    ]);

    return reply.send({ data: pedidos, total, page, pageSize });
  });

  app.get("/:id", { preHandler: requirePermissao("pedidos", "read") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const pedido = await prisma.pedido.findUnique({ where: { id }, include: PEDIDO_INCLUDE });
    if (!pedido) throw new NotFoundError("Pedido");
    return reply.send(pedido);
  });

  app.post("/", { preHandler: requirePermissao("pedidos", "write") }, async (request, reply) => {
    const body = pedidoSchema.parse(request.body);
    const pedido = await criarPedido(body, request.user.sub);

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Pedido",
      entidadeId: pedido.id,
      acao: "CREATE",
      depois: pedido,
    });

    return reply.status(201).send(pedido);
  });

  app.put("/:id", { preHandler: requirePermissao("pedidos", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = pedidoSchema.parse(request.body);

    const antes = await prisma.pedido.findUnique({ where: { id }, include: PEDIDO_INCLUDE });
    const pedido = await atualizarPedido(id, body);

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Pedido",
      entidadeId: pedido.id,
      acao: "UPDATE",
      antes,
      depois: pedido,
    });

    return reply.send(pedido);
  });
}
