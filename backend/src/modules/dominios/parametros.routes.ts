import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { ConflictError } from "../../shared/errors.js";

export async function parametrosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: requirePermissao("admin", "read") }, async (_request, reply) => {
    const parametros = await prisma.parametro.findMany({ orderBy: { chave: "asc" } });
    return reply.send(parametros);
  });

  // Leitura liberada a qualquer usuário autenticado: usado como valor-sugestão (editável)
  // no formulário de novo pedido, não é uma configuração administrativa sensível.
  app.get("/prazo-padrao-dias", async (_request, reply) => {
    const parametro = await prisma.parametro.findUnique({ where: { chave: "prazo_padrao_dias" } });
    return reply.send({ dias: parametro ? Number(parametro.valor) : 7 });
  });

  app.put("/:chave", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { chave } = z.object({ chave: z.string().min(1) }).parse(request.params);
    const { valor } = z.object({ valor: z.string().min(1) }).parse(request.body);

    const parametro = await prisma.parametro.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor },
    });

    return reply.send(parametro);
  });

  app.get(
    "/sequencia-pedido",
    { preHandler: requirePermissao("admin", "read") },
    async (_request, reply) => {
      const sequencia = await prisma.sequenciaPedido.findUnique({ where: { id: 1 } });
      return reply.send({ proximoNumero: sequencia?.proximoNumero ?? 1 });
    },
  );

  app.put(
    "/sequencia-pedido",
    { preHandler: requirePermissao("admin", "write") },
    async (request, reply) => {
      const { proximoNumero } = z.object({ proximoNumero: z.number().int().positive() }).parse(request.body);

      const maiorPedido = await prisma.pedido.findFirst({ orderBy: { numero: "desc" } });
      if (maiorPedido && proximoNumero <= maiorPedido.numero) {
        throw new ConflictError(
          `Já existe o pedido nº ${maiorPedido.numero}. O próximo número deve ser maior que ${maiorPedido.numero}.`,
        );
      }

      const sequencia = await prisma.sequenciaPedido.upsert({
        where: { id: 1 },
        update: { proximoNumero },
        create: { id: 1, proximoNumero },
      });

      return reply.send(sequencia);
    },
  );
}
