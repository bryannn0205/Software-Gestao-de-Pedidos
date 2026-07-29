import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { registrarAuditoria } from "../../shared/auditoria.js";
import { NotFoundError } from "../../shared/errors.js";

const produtoSchema = z
  .object({
    linha: z.string().optional(),
    material: z.string().min(1),
    medida: z.string().min(1),
    micragem: z.string().optional(),
    corPadrao: z.string().optional(),
    valorUnitario: z.number().positive(),
    tipoVenda: z.enum(["UNIDADE", "KG"]),
    pesoKg: z.number().positive().optional(),
  })
  .refine((data) => (data.tipoVenda === "KG" ? data.pesoKg !== undefined : true), {
    message: "Peso (Kg) é obrigatório para produtos vendidos por Kg.",
    path: ["pesoKg"],
  });

const listQuerySchema = z.object({
  search: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export async function produtosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: requirePermissao("produtos", "read") }, async (request, reply) => {
    const { search, ativo, page, pageSize } = listQuerySchema.parse(request.query);

    const where = {
      ...(ativo !== undefined ? { ativo } : {}),
      ...(search
        ? {
            OR: [
              { material: { contains: search, mode: "insensitive" as const } },
              { medida: { contains: search, mode: "insensitive" as const } },
              { linha: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        orderBy: { codigo: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.produto.count({ where }),
    ]);

    return reply.send({ data: produtos, total, page, pageSize });
  });

  app.get("/:id", { preHandler: requirePermissao("produtos", "read") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new NotFoundError("Produto");
    return reply.send(produto);
  });

  app.post("/", { preHandler: requirePermissao("produtos", "write") }, async (request, reply) => {
    const body = produtoSchema.parse(request.body);

    const produto = await prisma.produto.create({
      data: { ...body, pesoKg: body.tipoVenda === "KG" ? body.pesoKg : null },
    });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Produto",
      entidadeId: produto.id,
      acao: "CREATE",
      depois: produto,
    });

    return reply.status(201).send(produto);
  });

  app.put("/:id", { preHandler: requirePermissao("produtos", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = produtoSchema.parse(request.body);

    const antes = await prisma.produto.findUnique({ where: { id } });
    if (!antes) throw new NotFoundError("Produto");

    const produto = await prisma.produto.update({
      where: { id },
      data: { ...body, pesoKg: body.tipoVenda === "KG" ? body.pesoKg : null },
    });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Produto",
      entidadeId: produto.id,
      acao: "UPDATE",
      antes,
      depois: produto,
    });

    return reply.send(produto);
  });

  app.patch("/:id/status", { preHandler: requirePermissao("produtos", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body);

    const antes = await prisma.produto.findUnique({ where: { id } });
    if (!antes) throw new NotFoundError("Produto");

    const produto = await prisma.produto.update({ where: { id }, data: { ativo } });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Produto",
      entidadeId: produto.id,
      acao: "UPDATE",
      antes,
      depois: produto,
    });

    return reply.send(produto);
  });
}
