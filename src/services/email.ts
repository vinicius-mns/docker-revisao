import nodemailer from 'nodemailer'

import { env } from '../config/env.js'
import { HttpError } from '../middlewares/error.js'

const sendEmail = async (to: string, subject: string, text: string) => {
  if (!env.SMTP_HOST || !env.SMTP_FROM || Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    throw new HttpError(503, 'Envio de e-mail não está configurado no servidor')
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASSWORD
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  })

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
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
  )
}

export const sendPasswordResetEmail = (email: string, token: string) => {
  const url = new URL('/reset-password', env.WEB_APP_URL)
  url.searchParams.set('token', token)

  return sendEmail(
    email,
    'Redefinição de senha',
    `Para redefinir sua senha, acesse: ${url.toString()}\n\nO link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.`,
  )
}
