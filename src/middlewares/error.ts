import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Dados inválidos', issues: err.issues })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }

  if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
    res.status(409).json({ message: 'Registro duplicado' })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Erro interno' })
}
