import { createApp } from './app.ts'
import { env } from './config/env.ts'
import { connectDb, disconnectDb } from './config/db.ts'

try {
  await connectDb()
} catch (err) {
  console.error('Falha ao conectar no MongoDB:', err)
  process.exit(1)
}

const server = createApp().listen(env.PORT, () => {
  console.log(`API rodando na porta ${env.PORT}`)
})

const shutdown = async () => {
  server.close()
  await disconnectDb()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
