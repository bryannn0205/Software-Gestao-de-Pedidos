import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória."),
  // 32+ caracteres força um valor aleatório de verdade — 8 caracteres (mínimo antigo)
  // é fraco para assinar tokens e permitia deixar o valor de exemplo do .env.
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter ao menos 32 caracteres (use um valor aleatório forte)."),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Quando definida, o backend também serve o build do frontend (index.html +
  // assets) a partir dessa pasta — usado pelo app desktop, que roda tudo numa
  // porta só. Em dev (npm run dev), fica sem valor e nada muda.
  STATIC_DIR: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  CORS_ORIGINS: parsed.CORS_ORIGIN.split(",").map((origem) => origem.trim()),
};
