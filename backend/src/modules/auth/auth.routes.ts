import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "../../shared/prisma.js";
import { TooManyRequestsError, UnauthorizedError } from "../../shared/errors.js";
import { authenticate, type JwtPayload } from "../../shared/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  lembrarMe: z.boolean().optional().default(false),
});

const MAX_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MIN = 15;

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const { email, senha, lembrarMe } = loginSchema.parse(request.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { perfil: true },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoAte.getTime() - Date.now()) / 60_000);
      throw new TooManyRequestsError(
        `Muitas tentativas de login incorretas. Tente novamente em ${minutosRestantes} minuto(s).`,
      );
    }

    const senhaValida = await argon2.verify(usuario.senhaHash, senha);
    if (!senhaValida) {
      const tentativas = usuario.tentativasLogin + 1;
      const atingiuLimite = tentativas >= MAX_TENTATIVAS;
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativasLogin: atingiuLimite ? 0 : tentativas,
          bloqueadoAte: atingiuLimite ? new Date(Date.now() + DURACAO_BLOQUEIO_MIN * 60_000) : null,
        },
      });
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    if (usuario.tentativasLogin > 0 || usuario.bloqueadoAte) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasLogin: 0, bloqueadoAte: null },
      });
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfilId: usuario.perfilId,
      perfilNome: usuario.perfil.nome,
      permissoes: usuario.perfil.permissoes as Record<string, ("read" | "write")[]>,
    };

    const token = app.jwt.sign(payload, { expiresIn: lembrarMe ? "30d" : "8h" });

    return reply.send({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil.nome,
        permissoes: usuario.perfil.permissoes,
      },
    });
  });

  app.get("/me", { preHandler: authenticate }, async (request, reply) => {
    return reply.send({ usuario: request.user });
  });
}
