import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { registrarAuditoria } from "../../shared/auditoria.js";
import { ConflictError, NotFoundError } from "../../shared/errors.js";

const enderecoSchema = z.object({
  logradouro: z.string().min(1),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1),
  uf: z.string().min(1),
  cep: z.string().optional(),
});

const clienteSchema = z.object({
  razaoSocial: z.string().min(1),
  nomeFantasia: z.string().optional(),
  // Valida só a quantidade de dígitos (11 = CPF, 14 = CNPJ), ignorando pontuação —
  // não calcula dígito verificador (decisão do usuário: simples, não matemático).
  cnpjCpf: z.string().min(1).refine(
    (valor) => {
      const digitos = valor.replace(/\D/g, "");
      return digitos.length === 11 || digitos.length === 14;
    },
    { message: "CNPJ/CPF deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)." },
  ),
  inscricaoEstadual: z.string().optional(),
  email: z.string().email("E-mail em formato inválido.").optional(),
  telefone: z.string().optional(),
  endereco: enderecoSchema,
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export async function clientesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", { preHandler: requirePermissao("clientes", "read") }, async (request, reply) => {
    const { search, ativo, page, pageSize } = listQuerySchema.parse(request.query);

    const where = {
      ...(ativo !== undefined ? { ativo } : {}),
      ...(search
        ? {
            OR: [
              { razaoSocial: { contains: search, mode: "insensitive" as const } },
              { nomeFantasia: { contains: search, mode: "insensitive" as const } },
              { cnpjCpf: { contains: search, mode: "insensitive" as const } },
              { enderecos: { some: { cidade: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: { enderecos: true },
        orderBy: { razaoSocial: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cliente.count({ where }),
    ]);

    return reply.send({ data: clientes, total, page, pageSize });
  });

  app.get("/:id", { preHandler: requirePermissao("clientes", "read") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const cliente = await prisma.cliente.findUnique({ where: { id }, include: { enderecos: true } });
    if (!cliente) throw new NotFoundError("Cliente");
    return reply.send(cliente);
  });

  app.post("/", { preHandler: requirePermissao("clientes", "write") }, async (request, reply) => {
    const body = clienteSchema.parse(request.body);

    const cliente = await prisma.cliente.create({
      data: {
        razaoSocial: body.razaoSocial,
        nomeFantasia: body.nomeFantasia,
        cnpjCpf: body.cnpjCpf,
        inscricaoEstadual: body.inscricaoEstadual,
        email: body.email,
        telefone: body.telefone,
        enderecos: {
          create: { ...body.endereco, principal: true },
        },
      },
      include: { enderecos: true },
    });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Cliente",
      entidadeId: cliente.id,
      acao: "CREATE",
      depois: cliente,
    });

    return reply.status(201).send(cliente);
  });

  app.put("/:id", { preHandler: requirePermissao("clientes", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = clienteSchema.parse(request.body);

    const antes = await prisma.cliente.findUnique({ where: { id }, include: { enderecos: true } });
    if (!antes) throw new NotFoundError("Cliente");

    const enderecoPrincipal = antes.enderecos.find((e) => e.principal) ?? antes.enderecos[0];

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        razaoSocial: body.razaoSocial,
        nomeFantasia: body.nomeFantasia,
        cnpjCpf: body.cnpjCpf,
        inscricaoEstadual: body.inscricaoEstadual,
        email: body.email,
        telefone: body.telefone,
        enderecos: enderecoPrincipal
          ? { update: { where: { id: enderecoPrincipal.id }, data: { ...body.endereco } } }
          : { create: { ...body.endereco, principal: true } },
      },
      include: { enderecos: true },
    });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Cliente",
      entidadeId: cliente.id,
      acao: "UPDATE",
      antes,
      depois: cliente,
    });

    return reply.send(cliente);
  });

  app.patch("/:id/status", { preHandler: requirePermissao("clientes", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body);

    const antes = await prisma.cliente.findUnique({ where: { id } });
    if (!antes) throw new NotFoundError("Cliente");

    const cliente = await prisma.cliente.update({ where: { id }, data: { ativo } });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Cliente",
      entidadeId: cliente.id,
      acao: "UPDATE",
      antes,
      depois: cliente,
    });

    return reply.send(cliente);
  });

  // Exclusão real (não é o mesmo que inativar): só permitida se o cliente não
  // tiver nenhum pedido associado, para nunca apagar histórico financeiro/auditoria.
  app.delete("/:id", { preHandler: requirePermissao("clientes", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const cliente = await prisma.cliente.findUnique({ where: { id }, include: { enderecos: true } });
    if (!cliente) throw new NotFoundError("Cliente");

    const totalPedidos = await prisma.pedido.count({ where: { clienteId: id } });
    if (totalPedidos > 0) {
      throw new ConflictError(
        `Não é possível excluir "${cliente.razaoSocial}": existem ${totalPedidos} pedido(s) associado(s) a este cliente. Inative-o em vez de excluir, para preservar o histórico.`,
      );
    }

    await prisma.cliente.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: request.user.sub,
      entidade: "Cliente",
      entidadeId: cliente.id,
      acao: "DELETE",
      antes: cliente,
    });

    return reply.status(204).send();
  });
}
