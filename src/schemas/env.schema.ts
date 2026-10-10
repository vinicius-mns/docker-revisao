import { z } from 'zod'

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
)

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().startsWith('mongodb'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  WEB_APP_URL: z.string().url().default('http://localhost:5173'),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: z.preprocess((value) => (value === '' ? undefined : value), z.string().email().optional()),
})
