import type { Request, Response } from 'express'

import { HttpError } from '../middlewares/error.ts'
import { usersRepository } from '../repositories/users.repository.ts'
import * as schemas from '../schemas/users.schema.ts'
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.ts'

const getSession = (req: Request) => {
  if (!req.auth) {
    throw new HttpError(401, 'Autenticação necessária')
  }
  return req.auth
}

export const usersController = {
  async register(req: Request, res: Response) {
    const { email, password } = schemas.registerBody.parse(req.body)
    const result = await usersRepository.register(email, password)
    await sendVerificationEmail(result.user.email, result.verificationToken)

    res.status(201).json({
      data: result.user,
      message: 'Conta criada. Verifique seu e-mail para ativá-la.',
    })
  },

  async resendVerification(req: Request, res: Response) {
    const { email } = schemas.emailBody.parse(req.body)
    const result = await usersRepository.resendVerification(email)

    if (result) {
      await sendVerificationEmail(result.email, result.token)
    }

    res.status(200).json({
      message: 'Se a conta existir e ainda não estiver verificada, enviaremos um e-mail.' 
    })
  },

  async verifyEmail(req: Request, res: Response) {
    const { token } = schemas.verifyEmailQuery.parse(req.query)
    const verified = await usersRepository.verifyEmail(token)

    if (!verified) {
      throw new HttpError(400, 'Link de verificação inválido ou expirado')
    }

    res.status(200).json({ message: 'E-mail verificado. Você já pode entrar.' })
  },

  async login(req: Request, res: Response) {
    const { email, password } = schemas.loginBody.parse(req.body)
    const data = await usersRepository.login(email, password)
    res.status(200).json({ data, message: 'Login realizado com sucesso' })
  },

  async me(req: Request, res: Response) {
    const { userId } = getSession(req)
    res.status(200).json({ data: { id: userId }, message: 'Sessão válida' })
  },

  async logout(req: Request, res: Response) {
    const { sessionToken } = getSession(req)
    await usersRepository.deleteSession(sessionToken)
    res.status(200).json({ message: 'Sessão encerrada' })
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = schemas.emailBody.parse(req.body)
    const result = await usersRepository.createPasswordReset(email)

    if (result) {
      await sendPasswordResetEmail(result.email, result.token)
    }

    res.status(200).json({ message: 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.' })
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = schemas.resetPasswordBody.parse(req.body)
    const reset = await usersRepository.resetPassword(token, password)

    if (!reset) {
      throw new HttpError(400, 'Link de redefinição inválido ou expirado')
    }

    res.status(200).json({ message: 'Senha redefinida. Entre novamente com a nova senha.' })
  },
}
