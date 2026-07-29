export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "BAD_REQUEST",
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(entidade: string) {
    super(`${entidade} não encontrado(a).`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Credenciais inválidas.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Você não tem permissão para esta ação.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

/**
 * Traduz o campo/constraint reportado pelo Prisma num erro P2002 (violação de
 * unicidade) para uma mensagem amigável. Sem isso, duplicidade em qualquer
 * tabela vira um 500 genérico "Erro interno do servidor" (achado da auditoria).
 */
export function mensagemDuplicado(target: unknown): string {
  const campos = Array.isArray(target) ? target.join(",") : String(target ?? "");

  if (campos.includes("cnpj")) return "Já existe um cliente cadastrado com este CNPJ/CPF.";
  if (campos.includes("email")) return "Já existe um usuário com este e-mail.";
  if (campos.includes("nome")) return "Já existe um perfil com este nome.";
  if (campos.includes("tipo") && campos.includes("valor")) {
    return "Este valor já existe para este tipo de domínio.";
  }
  if (campos.includes("numero")) return "Número de pedido já utilizado.";
  if (campos.includes("codigo")) return "Código de produto já utilizado.";
  return "Já existe um registro com essas informações.";
}
