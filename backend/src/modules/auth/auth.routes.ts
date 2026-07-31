import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../shared/prisma.js";
import { AppError, TooManyRequestsError, UnauthorizedError } from "../../shared/errors.js";
import { authenticate, type JwtPayload } from "../../shared/auth.js";
import { enviarEmail } from "../../shared/email.js";
import { env } from "../../shared/env.js";

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

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

const googleSchema = z.object({
  credential: z.string().min(1),
});

const MAX_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MIN = 15;
const REENVIO_MIN_INTERVALO_MIN = 2;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type UsuarioComPerfil = {
  id: string;
  nome: string;
  email: string;
  perfilId: string;
  perfil: { nome: string; permissoes: unknown };
};

function montarRespostaLogin(app: FastifyInstance, usuario: UsuarioComPerfil, dias: "8h" | "30d") {
  const payload: JwtPayload = {
    sub: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfilId: usuario.perfilId,
    perfilNome: usuario.perfil.nome,
    permissoes: usuario.perfil.permissoes as Record<string, ("read" | "write")[]>,
  };

  return {
    token: app.jwt.sign(payload, { expiresIn: dias }),
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil.nome,
      permissoes: usuario.perfil.permissoes,
    },
  };
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

    return reply.send(montarRespostaLogin(app, usuario, lembrarMe ? "30d" : "8h"));
  });

  app.post("/google", async (request, reply) => {
    if (!googleClient) {
      throw new AppError("Login com Google não está configurado neste servidor.", 501, "GOOGLE_NAO_CONFIGURADO");
    }

    const { credential } = googleSchema.parse(request.body);

    let payloadGoogle;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
      payloadGoogle = ticket.getPayload();
    } catch {
      throw new UnauthorizedError("Não foi possível verificar sua conta Google.");
    }

    if (!payloadGoogle?.email || !payloadGoogle.email_verified) {
      throw new UnauthorizedError("Sua conta Google precisa ter um e-mail verificado.");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: payloadGoogle.email },
      include: { perfil: true },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError(
        "Esse e-mail não está cadastrado no sistema. Peça para um administrador criar seu acesso primeiro.",
      );
    }

    return reply.send(montarRespostaLogin(app, usuario, "30d"));
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
    const link = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`;

    // Envia antes de gravar no banco: se o e-mail falhar, não queremos um
    // token "gasto" ocupando a janela de reenvio sem o usuário ter recebido nada.
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

    await prisma.resetSenhaToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + env.RESET_SENHA_TOKEN_TTL_MIN * 60_000),
      },
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
