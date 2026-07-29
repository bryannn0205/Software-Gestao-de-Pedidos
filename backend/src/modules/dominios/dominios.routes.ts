import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { NotFoundError } from "../../shared/errors.js";

const TIPOS = ["MATERIAL", "COR", "MEDIDA", "MICRAGEM", "TIPO_RESIDUO", "FORMA_PAGAMENTO"] as const;

const dominioSchema = z.object({
  tipo: z.enum(TIPOS),
  valor: z.string().min(1),
});

export async function dominiosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // Leitura liberada a qualquer usuário autenticado: são listas de referência usadas
  // em formulários de outros módulos (ex.: cor/forma de pagamento no cadastro de pedido),
  // não dados administrativos sensíveis. Apenas escrita permanece restrita a admin.
  app.get("/", async (request, reply) => {
    const { tipo, ativo } = z
      .object({ tipo: z.enum(TIPOS).optional(), ativo: z.coerce.boolean().optional() })
      .parse(request.query);

    const dominios = await prisma.dominio.findMany({
      where: { ...(tipo ? { tipo } : {}), ...(ativo !== undefined ? { ativo } : {}) },
      orderBy: [{ tipo: "asc" }, { valor: "asc" }],
    });

    return reply.send(dominios);
  });

  app.post("/", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const body = dominioSchema.parse(request.body);
    const dominio = await prisma.dominio.create({ data: body });
    return reply.status(201).send(dominio);
  });

  app.patch("/:id/status", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body);

    const existente = await prisma.dominio.findUnique({ where: { id } });
    if (!existente) throw new NotFoundError("Item de domínio");

    const dominio = await prisma.dominio.update({ where: { id }, data: { ativo } });
    return reply.send(dominio);
  });
}
