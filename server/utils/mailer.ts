import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let transporter: Transporter | null | undefined

/**
 * Transporte SMTP a partir de las variables NUXT_SMTP_* (runtimeConfig).
 * Devuelve null si no hay SMTP configurado (el envío se omite sin romper nada).
 */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter
  const config = useRuntimeConfig()
  const host = config.smtpHost
  if (!host || host === 'localhost' || host === 'smtp.example.com' || !config.smtpUser) {
    transporter = null
    return transporter
  }
  const port = Number(config.smtpPort) || 587
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  })
  return transporter
}

export interface MailInput {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

/**
 * Envía un correo. Nunca lanza: registra el error y devuelve false, para que un
 * fallo de correo no interrumpa el flujo principal (p. ej. crear un pedido).
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const t = getTransporter()
  if (!t) {
    console.warn('[mailer] SMTP no configurado (NUXT_SMTP_*): se omite el correo', input.subject)
    return false
  }
  try {
    const config = useRuntimeConfig()
    await t.sendMail({
      from: config.smtpFrom || config.smtpUser,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    })
    return true
  } catch (err) {
    console.error('[mailer] Error al enviar correo:', (err as Error).message)
    return false
  }
}

/** Escapa texto para insertarlo en HTML de correo. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
