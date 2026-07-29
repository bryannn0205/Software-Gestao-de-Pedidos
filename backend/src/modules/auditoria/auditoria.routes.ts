import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";

const listQuerySchema = z.object({
  entidade: z.string().optional(),
  entidadeId: z.string().optional(),
  usuarioId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

export async function auditoriaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requirePermissao("admin", "read"));

  app.get("/", async (request, reply) => {
    const { entidade, entidadeId, usuarioId, page, pageSize } = listQuerySchema.parse(request.query);

    const where = {
      ...(entidade ? { entidade } : {}),
      ...(entidadeId ? { entidadeId } : {}),
      ...(usuarioId ? { usuarioId } : {}),
    };

    const [registros, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { usuario: { select: { nome: true, email: true } } },
        orderBy: { em: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({ data: registros, total, page, pageSize });
  });
}
