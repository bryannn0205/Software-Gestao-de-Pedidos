import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  // Sem isso, uma falha de rede/SMTP deixa a requisição pendurada por minutos
  // (default do nodemailer) — o usuário via só o botão girando pra sempre.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export async function enviarEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!env.SMTP_USER) {
    // Sem SMTP configurado (ex.: ambiente de dev sem .env preenchido) — loga em
    // vez de falhar, para não travar o fluxo de quem só quer testar a rota.
    console.warn(`[email] SMTP não configurado — e-mail para ${to} não foi enviado.\nAssunto: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
}
