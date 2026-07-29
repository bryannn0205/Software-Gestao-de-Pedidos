import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";
import { ForbiddenError, UnauthorizedError } from "./errors.js";

export type Modulo =
  | "clientes"
  | "produtos"
  | "pedidos"
  | "producao"
  | "financeiro"
  | "dashboard"
  | "admin";

export type Acao = "read" | "write";

export interface JwtPayload {
  sub: string;
  nome: string;
  email: string;
  perfilId: string;
  perfilNome: string;
  permissoes: Record<string, Acao[]>;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

// Além de validar a assinatura/expiração do token, reconsulta o usuário no banco
// a cada requisição e reconstrói `request.user` com os dados atuais. Sem isso, um
// usuário desativado (ou com o perfil/permissões trocados) continuava com acesso
// total até o token expirar — até 30 dias com "Lembrar-me" (achado da auditoria).
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: request.user.sub },
    include: { perfil: true },
  });

  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
  }

  request.user = {
    sub: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfilId: usuario.perfilId,
    perfilNome: usuario.perfil.nome,
    permissoes: usuario.perfil.permissoes as Record<string, Acao[]>,
  };
}

export function requirePermissao(modulo: Modulo, acao: Acao) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    const permissoes = request.user?.permissoes ?? {};
    const acoesDoModulo = permissoes[modulo] ?? [];
    if (!acoesDoModulo.includes(acao)) {
      throw new ForbiddenError(
        `Perfil "${request.user?.perfilNome}" não tem permissão de "${acao}" em "${modulo}".`,
      );
    }
  };
}
