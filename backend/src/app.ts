import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "./shared/env.js";
import { AppError, mensagemDuplicado } from "./shared/errors.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { clientesRoutes } from "./modules/clientes/clientes.routes.js";
import { produtosRoutes } from "./modules/produtos/produtos.routes.js";
import { dominiosRoutes } from "./modules/dominios/dominios.routes.js";
import { parametrosRoutes } from "./modules/dominios/parametros.routes.js";
import { pedidosRoutes } from "./modules/pedidos/pedidos.routes.js";
import { producaoRoutes } from "./modules/producao/producao.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes.js";
import { auditoriaRoutes } from "./modules/auditoria/auditoria.routes.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  // Restrito às origens conhecidas do frontend (configurável via CORS_ORIGIN no
  // .env) — antes aceitava "origin: true", que reflete qualquer origem.
  app.register(cors, { origin: env.CORS_ORIGINS });
  app.register(jwt, { secret: env.JWT_SECRET });

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(clientesRoutes, { prefix: "/api/clientes" });
  app.register(produtosRoutes, { prefix: "/api/produtos" });
  app.register(dominiosRoutes, { prefix: "/api/dominios" });
  app.register(parametrosRoutes, { prefix: "/api/parametros" });
  app.register(pedidosRoutes, { prefix: "/api/pedidos" });
  app.register(producaoRoutes, { prefix: "/api/producao" });
  app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  app.register(usuariosRoutes, { prefix: "/api/usuarios" });
  app.register(auditoriaRoutes, { prefix: "/api/auditoria" });

  // Usado pelo app desktop: com STATIC_DIR definido, o próprio backend também
  // serve o build do frontend (uma porta só, sem CORS entre janelas do app).
  // Em dev (npm run dev), STATIC_DIR não é definido e nada disso é registrado.
  if (env.STATIC_DIR) {
    const staticDir = path.resolve(env.STATIC_DIR);
    app.register(fastifyStatic, { root: staticDir });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith("/api")) {
        return reply.status(404).send({ error: "NOT_FOUND", message: "Rota não encontrada." });
      }
      return reply.sendFile("index.html");
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.code, message: error.message });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        issues: error.issues,
      });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply
          .status(409)
          .send({ error: "CONFLICT", message: mensagemDuplicado(error.meta?.target) });
      }
      if (error.code === "P2003") {
        return reply.status(400).send({
          error: "REFERENCIA_INVALIDA",
          message: "Um dos itens relacionados (cliente, produto, etc.) não foi encontrado.",
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({ error: "NOT_FOUND", message: "Registro não encontrado." });
      }
    }
    app.log.error(error);
    const generico = error as { statusCode?: number; code?: string; message: string };
    const statusCode =
      generico.statusCode && generico.statusCode >= 400 && generico.statusCode < 500 ? generico.statusCode : 500;
    return reply.status(statusCode).send({
      error: generico.code ?? "INTERNAL_ERROR",
      message: statusCode < 500 ? generico.message : "Erro interno do servidor.",
    });
  });

  return app;
}
