import { prisma } from "./prisma.js";

interface RegistrarAuditoriaParams {
  usuarioId?: string | null;
  entidade: string;
  entidadeId: string;
  acao: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  antes?: unknown;
  depois?: unknown;
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  await prisma.auditLog.create({
    data: {
      usuarioId: params.usuarioId ?? null,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      acao: params.acao,
      antes: params.antes === undefined ? undefined : (params.antes as any),
      depois: params.depois === undefined ? undefined : (params.depois as any),
    },
  });
}
