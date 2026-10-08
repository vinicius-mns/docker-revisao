import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'

import { env } from './config/env.js'
import { errorHandler, notFound } from './middlewares/error.js'
import { cardsRoutes } from './routes/cards.routes.js'
import { tagsRoutes } from './routes/tags.routes.js'

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

  app.use(notFound)
  app.use(errorHandler)

  return app
}
