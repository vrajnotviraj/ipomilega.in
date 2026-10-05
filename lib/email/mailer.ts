import 'server-only';
import nodemailer, { Transporter } from 'nodemailer';

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

const env = (name: string) => process.env[name]?.trim() ?? '';

const globalWithMailer = global as typeof globalThis & { _mailer?: Transporter | null };

/** One SMTP transport per process, or null when SMTP isn't configured (local dev without credentials). */
function transport(): Transporter | null {
  if (globalWithMailer._mailer !== undefined) return globalWithMailer._mailer;
  const host = env('SMTP_HOST');
  const port = Number(env('SMTP_PORT')) || 587;
  globalWithMailer._mailer = host
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASSWORD') } : undefined,
        connectionTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;
  return globalWithMailer._mailer;
}

/** "r***@gmail.com", so logs never hold a full address. */
const maskEmail = (email: string) => email.replace(/^(.)[^@]*/, '$1***');

/** Sends one mail. Returns false without sending when SMTP isn't configured; throws when the server refuses it. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const mailer = transport();
  if (!mailer) {
    console.info(`[email] SMTP is not configured, so "${mail.subject}" to ${maskEmail(mail.to)} was not sent`);
    return false;
  }
  await mailer.sendMail({
    from: env('EMAIL_FROM') || 'IPO Milega <hello@ipomilega.in>',
    replyTo: env('EMAIL_REPLY_TO') || undefined,
    ...mail,
  });
  return true;
}
