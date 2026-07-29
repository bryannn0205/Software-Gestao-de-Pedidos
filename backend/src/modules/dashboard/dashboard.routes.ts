import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate, requirePermissao } from "../../shared/auth.js";
import { obterKpis, obterFaturamentoMensal } from "./dashboard.service.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requirePermissao("dashboard", "read"));

  app.get("/kpis", async (_request, reply) => {
    const kpis = await obterKpis();
    return reply.send(kpis);
  });

  app.get("/faturamento-mensal", async (request, reply) => {
    const { ano } = z
      .object({ ano: z.coerce.number().default(new Date().getFullYear()) })
      .parse(request.query);
    const faturamento = await obterFaturamentoMensal(ano);
    return reply.send(faturamento);
  });
}
