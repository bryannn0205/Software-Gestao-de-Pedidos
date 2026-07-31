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
  // URL do frontend usada para montar o link enviado no e-mail de redefinição
  // de senha (ex.: "http://localhost:5173/redefinir-senha?token=...").
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  // Credenciais SMTP para envio de e-mail (reset de senha). Com Gmail, use uma
  // "senha de app" (myaccount.google.com/apppasswords) — nunca a senha normal.
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Remetente exibido nos e-mails. Sem valor, usa o próprio SMTP_USER.
  SMTP_FROM: z.string().optional(),
  // Validade do link de redefinição de senha, em minutos.
  RESET_SENHA_TOKEN_TTL_MIN: z.coerce.number().default(60),
  // Client ID do Google Cloud Console (console.cloud.google.com > APIs e
  // Serviços > Credenciais) — usado para validar o token do "Entrar com
  // Google". Sem essa variável, a rota /auth/google fica desabilitada.
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  CORS_ORIGINS: parsed.CORS_ORIGIN.split(",").map((origem) => origem.trim()),
  SMTP_FROM: parsed.SMTP_FROM || parsed.SMTP_USER,
};
