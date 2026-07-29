import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "../../shared/prisma.js";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { NotFoundError, ConflictError } from "../../shared/errors.js";

const usuarioSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  perfilId: z.string().uuid(),
});

const usuarioUpdateSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  perfilId: z.string().uuid(),
});

const perfilSchema = z.object({
  nome: z.string().min(1),
  permissoes: z.record(z.array(z.enum(["read", "write"]))),
});

function temAdminWrite(permissoes: unknown): boolean {
  const admin = (permissoes as Record<string, string[]> | null)?.admin ?? [];
  return admin.includes("write");
}

// Conta quantos usuários ativos (fora do `excluirUsuarioId`) ainda teriam acesso de
// administrador. Usado para impedir que o sistema fique sem nenhum admin ativo.
async function contarAdminsAtivos(excluirUsuarioId?: string): Promise<number> {
  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true, ...(excluirUsuarioId ? { id: { not: excluirUsuarioId } } : {}) },
    include: { perfil: true },
  });
  return usuarios.filter((u) => temAdminWrite(u.perfil.permissoes)).length;
}

export async function usuariosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requirePermissao("admin", "read"));

  app.get("/", async (_request, reply) => {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, ativo: true, criadoEm: true, perfil: true },
      orderBy: { nome: "asc" },
    });
    return reply.send(usuarios);
  });

  app.post("/", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const body = usuarioSchema.parse(request.body);

    const existente = await prisma.usuario.findUnique({ where: { email: body.email } });
    if (existente) throw new ConflictError("Já existe um usuário com este e-mail.");

    const senhaHash = await argon2.hash(body.senha);
    const usuario = await prisma.usuario.create({
      data: { nome: body.nome, email: body.email, senhaHash, perfilId: body.perfilId },
      select: { id: true, nome: true, email: true, ativo: true, criadoEm: true, perfil: true },
    });

    return reply.status(201).send(usuario);
  });

  app.put("/:id", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = usuarioUpdateSchema.parse(request.body);

    const existente = await prisma.usuario.findUnique({ where: { id }, include: { perfil: true } });
    if (!existente) throw new NotFoundError("Usuário");

    if (existente.ativo && temAdminWrite(existente.perfil.permissoes) && body.perfilId !== existente.perfilId) {
      const novoPerfil = await prisma.perfil.findUnique({ where: { id: body.perfilId } });
      const novoTemAdminWrite = novoPerfil ? temAdminWrite(novoPerfil.permissoes) : false;
      if (!novoTemAdminWrite && (await contarAdminsAtivos(existente.id)) === 0) {
        throw new ConflictError(
          "Não é possível remover a permissão de administrador do único usuário administrador ativo do sistema.",
        );
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: body,
      select: { id: true, nome: true, email: true, ativo: true, criadoEm: true, perfil: true },
    });

    return reply.send(usuario);
  });

  app.patch("/:id/senha", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { senha } = z.object({ senha: z.string().min(8) }).parse(request.body);

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) throw new NotFoundError("Usuário");

    const senhaHash = await argon2.hash(senha);
    await prisma.usuario.update({ where: { id }, data: { senhaHash } });

    return reply.status(204).send();
  });

  app.patch("/:id/status", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body);

    const existente = await prisma.usuario.findUnique({ where: { id }, include: { perfil: true } });
    if (!existente) throw new NotFoundError("Usuário");

    if (!ativo && temAdminWrite(existente.perfil.permissoes) && (await contarAdminsAtivos(existente.id)) === 0) {
      throw new ConflictError("Não é possível inativar o único usuário administrador ativo do sistema.");
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { ativo },
      select: { id: true, nome: true, email: true, ativo: true, criadoEm: true, perfil: true },
    });

    return reply.send(usuario);
  });

  app.get("/perfis", async (_request, reply) => {
    const perfis = await prisma.perfil.findMany({ orderBy: { nome: "asc" } });
    return reply.send(perfis);
  });

  app.post("/perfis", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const body = perfilSchema.parse(request.body);
    const perfil = await prisma.perfil.create({ data: body });
    return reply.status(201).send(perfil);
  });

  app.put("/perfis/:id", { preHandler: requirePermissao("admin", "write") }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = perfilSchema.parse(request.body);

    const existente = await prisma.perfil.findUnique({ where: { id } });
    if (!existente) throw new NotFoundError("Perfil");

    if (temAdminWrite(existente.permissoes) && !temAdminWrite(body.permissoes)) {
      const usuariosNestePerfil = await prisma.usuario.count({ where: { perfilId: id, ativo: true } });
      const totalAdminsAtivos = await contarAdminsAtivos();
      if (usuariosNestePerfil > 0 && totalAdminsAtivos - usuariosNestePerfil <= 0) {
        throw new ConflictError(
          "Não é possível remover a permissão de administrador deste perfil: nenhum usuário ativo ficaria com acesso de administrador.",
        );
      }
    }

    const perfil = await prisma.perfil.update({ where: { id }, data: body });
    return reply.send(perfil);
  });
}
