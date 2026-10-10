import type { RequestHandler } from 'express'

import { HttpError } from './error.js'
import { usersRepository } from '../repositories/users.repository.js'

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const authorization = req.get('authorization')
  const match = authorization?.match(/^Bearer ([a-f0-9]{64})$/i)

  if (!match) {
    throw new HttpError(401, 'Token de autenticação ausente ou inválido')
  }

  const token = match[1]
  const userId = await usersRepository.authenticateSession(token)

  if (!userId) {
    throw new HttpError(401, 'Sessão inválida ou expirada')
  }

  req.auth = { userId, sessionToken: token }
  next()
}
