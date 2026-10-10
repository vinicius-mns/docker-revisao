import nodemailer from 'nodemailer'

import { env } from '../config/env.js'
import { HttpError } from '../middlewares/error.js'

const APP_NAME = 'Seu App'

type EmailContent = {
  title: string
  message: string
  buttonLabel: string
  url: string
  note: string
}

const buildEmailHtml = ({ title, message, buttonLabel, url, note }: EmailContent) => `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background-color:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="background-color:#4f46e5;padding:24px 32px;color:#ffffff;font-size:20px;font-weight:bold;">
              ${APP_NAME}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${title}</h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#374151;">${message}</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:8px;">
                    <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
                      ${buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">${note}</p>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#9ca3af;word-break:break-all;">
                Se o botão não funcionar, copie e cole este endereço no navegador:<br>
                <a href="${url}" style="color:#4f46e5;">${url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;font-size:12px;color:#9ca3af;">
              Você recebeu este e-mail porque uma ação foi solicitada na sua conta em ${APP_NAME}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER && env.SMTP_PASSWORD
    ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    : undefined,
})

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  options?: { html?: string },
) => {
  if (!env.SMTP_HOST || !env.SMTP_FROM || Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    throw new HttpError(503, 'Envio de e-mail não está configurado no servidor')
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html: options?.html,
    })
  } catch (error) {
    console.error('Falha no envio de e-mail SMTP:', error)
    throw new HttpError(503, 'Não foi possível enviar o e-mail; tente novamente mais tarde')
  }
}

export const sendVerificationEmail = (email: string, token: string) => {
  const url = new URL('/users/verify-email', env.APP_URL)
  url.searchParams.set('token', token)

  return sendEmail(
    email,
    'Verifique seu e-mail',
    `Para verificar sua conta, acesse: ${url.toString()}\n\nO link expira em 24 horas.`,
    {
      html: buildEmailHtml({
        title: 'Verifique seu e-mail',
        message: 'Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo.',
        buttonLabel: 'Verificar e-mail',
        url: url.toString(),
        note: 'O link expira em 24 horas.',
      }),
    },
  )
}

export const sendPasswordResetEmail = (email: string, token: string) => {
  const url = new URL('/reset-password', env.WEB_APP_URL)
  url.searchParams.set('token', token)

  return sendEmail(
    email,
    'Redefinição de senha',
    `Para redefinir sua senha, acesse: ${url.toString()}\n\nO link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.`,
    {
      html: buildEmailHtml({
        title: 'Redefinição de senha',
        message: 'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova.',
        buttonLabel: 'Redefinir senha',
        url: url.toString(),
        note: 'O link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.',
      }),
    },
  )
}
