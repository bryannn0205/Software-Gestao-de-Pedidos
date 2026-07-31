import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";
import { prisma } from "../../shared/prisma.js";
import { AppError, TooManyRequestsError, UnauthorizedError } from "../../shared/errors.js";
import { authenticate, type JwtPayload } from "../../shared/auth.js";
import { enviarEmail } from "../../shared/email.js";
import { env } from "../../shared/env.js";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  lembrarMe: z.boolean().optional().default(false),
});

const esqueciSenhaSchema = z.object({
  email: z.string().email(),
});

const redefinirSenhaSchema = z.object({
  token: z.string().min(1),
  novaSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

const MAX_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MIN = 15;
const REENVIO_MIN_INTERVALO_MIN = 2;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

  app.post("/esqueci-senha", async (request, reply) => {
    const { email } = esqueciSenhaSchema.parse(request.body);

    // Mensagem genérica sempre — não revela se o e-mail existe na base.
    const mensagem = "Se esse e-mail existir na nossa base, enviamos um link de redefinição de senha.";

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) {
      return reply.send({ message: mensagem });
    }

    const ultimoToken = await prisma.resetSenhaToken.findFirst({
      where: { usuarioId: usuario.id },
      orderBy: { criadoEm: "desc" },
    });
    if (ultimoToken && Date.now() - ultimoToken.criadoEm.getTime() < REENVIO_MIN_INTERVALO_MIN * 60_000) {
      throw new TooManyRequestsError("Aguarde alguns minutos antes de solicitar um novo link.");
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.resetSenhaToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + env.RESET_SENHA_TOKEN_TTL_MIN * 60_000),
      },
    });

    const link = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`;
    await enviarEmail({
      to: usuario.email,
      subject: "Redefinição de senha — Extrusaick Polímeros",
      html: `
        <p>Olá, ${usuario.nome}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo (válido por ${env.RESET_SENHA_TOKEN_TTL_MIN} minutos):</p>
        <p><a href="${link}">${link}</a></p>
        <p>Se você não solicitou isso, ignore este e-mail — sua senha continua a mesma.</p>
      `,
    });

    return reply.send({ message: mensagem });
  });

  app.post("/redefinir-senha", async (request, reply) => {
    const { token, novaSenha } = redefinirSenhaSchema.parse(request.body);

    const resetToken = await prisma.resetSenhaToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!resetToken || resetToken.usadoEm || resetToken.expiraEm < new Date()) {
      throw new AppError("Link de redefinição inválido ou expirado. Solicite um novo.", 400, "TOKEN_INVALIDO");
    }

    const senhaHash = await argon2.hash(novaSenha);
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: resetToken.usuarioId },
        data: { senhaHash, tentativasLogin: 0, bloqueadoAte: null },
      }),
      prisma.resetSenhaToken.update({
        where: { id: resetToken.id },
        data: { usadoEm: new Date() },
      }),
    ]);

    return reply.send({ message: "Senha redefinida com sucesso." });
  });
}
