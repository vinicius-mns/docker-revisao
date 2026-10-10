import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'

import { env } from './config/env.ts'
import { errorHandler, notFound } from './middlewares/error.ts'
import { cardsRoutes } from './routes/cards.routes.ts'
import { tagsRoutes } from './routes/tags.routes.ts'
import { usersRoutes } from './routes/users.routes.ts'

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
    }),
  )

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/cards', cardsRoutes)
  app.use('/tags', tagsRoutes)
  app.use('/users', usersRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
