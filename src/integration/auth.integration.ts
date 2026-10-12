import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createApp } from '../app.ts'
import { connectDb, disconnectDb } from '../config/db.ts'
import { SessionModel } from '../models/session.model.ts'
import { UserModel } from '../models/user.model.ts'

type MailpitMessageSummary = {
  ID: string
  To?: { Address: string }[]
  Subject: string
}

type MailpitMessage = MailpitMessageSummary & {
  Text?: string
  HTML?: string
}

type ApiResponseBody = {
  data?: {
    email?: string
    token?: string
  }
}

const mongoTestUri = process.env.MONGODB_TEST_URI
const mailpitApiUrl = process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:8025'
const testEmail = `integration-${randomUUID()}@example.test`
const password = 'senha-segura-de-integracao-123'
let apiUrl: string
let server: Server

const assertSafeIntegrationConfig = () => {
  if (!mongoTestUri) {
    throw new Error('Defina MONGODB_TEST_URI em .env.integration para um banco exclusivo de testes.')
  }

  let databaseName: string
  try {
    const uri = new URL(mongoTestUri)
    if (uri.protocol !== 'mongodb:' && uri.protocol !== 'mongodb+srv:') {
      throw new Error()
    }
    databaseName = decodeURIComponent(uri.pathname.slice(1))
  } catch {
    throw new Error('MONGODB_TEST_URI precisa ser uma URI MongoDB válida.')
  }

  if (!/[-_.]test$/i.test(databaseName)) {
    throw new Error('MONGODB_TEST_URI deve apontar para um banco exclusivo com nome terminado em _test.')
  }

  const smtpHost = process.env.SMTP_HOST?.toLowerCase()
  if (!smtpHost || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(smtpHost)) {
    throw new Error('SMTP_HOST deve apontar para o Mailpit local (127.0.0.1). Nenhum e-mail será enviado.')
  }

  if (Number(process.env.SMTP_PORT) !== 1025 || process.env.SMTP_SECURE !== 'false') {
    throw new Error('Configure SMTP_PORT=1025 e SMTP_SECURE=false para usar o Mailpit local.')
  }

  if (process.env.SMTP_USER || process.env.SMTP_PASSWORD) {
    throw new Error('Remova SMTP_USER e SMTP_PASSWORD dos testes para impedir autenticação em um SMTP real.')
  }

  if (!process.env.SMTP_FROM?.toLowerCase().endsWith('@example.test')) {
    throw new Error('Configure SMTP_FROM com um endereço @example.test para os testes.')
  }

  let mailpitHost: string
  try {
    const url = new URL(mailpitApiUrl)
    if (url.protocol !== 'http:') {
      throw new Error()
    }
    mailpitHost = url.hostname.toLowerCase()
  } catch {
    throw new Error('MAILPIT_API_URL deve ser o endereço HTTP local do Mailpit.')
  }

  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(mailpitHost)) {
    throw new Error('MAILPIT_API_URL deve apontar para o Mailpit local.')
  }
}

const requestApi = async (path: string, init?: RequestInit) => {
  const response = await fetch(new URL(path, apiUrl), init)
  return { response, body: await response.json() as ApiResponseBody }
}

const readMailpitJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, mailpitApiUrl))
  if (!response.ok) {
    throw new Error(`Mailpit respondeu ${response.status} para ${path}.`)
  }
  return response.json() as Promise<T>
}

const waitForEmail = async (subject: string): Promise<MailpitMessage> => {
  const deadline = Date.now() + 10_000

  while (Date.now() < deadline) {
    const result = await readMailpitJson<{ messages: MailpitMessageSummary[] }>(
      '/api/v1/messages?limit=100',
    )
    const summary = result.messages.find((message) =>
      message.Subject === subject
      && message.To?.some((recipient) => recipient.Address.toLowerCase() === testEmail),
    )

    if (summary) {
      return readMailpitJson<MailpitMessage>(`/api/v1/message/${encodeURIComponent(summary.ID)}`)
    }

    await delay(100)
  }

  throw new Error(`O e-mail "${subject}" para ${testEmail} não chegou ao Mailpit em 10 segundos.`)
}

const tokenFromEmail = (message: MailpitMessage) => {
  const content = `${message.Text ?? ''}\n${message.HTML ?? ''}`
  const token = content.match(/[?&]token=([a-f\d]{64})/i)?.[1]
  if (!token) {
    throw new Error(`O e-mail "${message.Subject}" não contém um token válido.`)
  }
  return token
}

describe('fluxo integrado por HTTP com MongoDB e e-mail', () => {
  beforeAll(async () => {
    assertSafeIntegrationConfig()
    await readMailpitJson('/api/v1/messages?limit=1')
    await connectDb(mongoTestUri)

    server = createServer(createApp())
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Não foi possível iniciar o servidor HTTP de integração.')
    }
    apiUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    const user = await UserModel.findOne({ email: testEmail }).select('_id')
    if (user) {
      const userId = String(user._id)
      await Promise.all([
        SessionModel.deleteMany({ userId }),
        UserModel.deleteOne({ _id: user._id }),
      ])
    }
  })

  afterAll(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    }
    await disconnectDb()
  })

  it('cria a conta, confirma o e-mail e redefine a senha usando mensagens reais', async () => {
    const registration = await requestApi('/users/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password }),
    })

    expect(registration.response.status).toBe(201)
    expect(registration.body.data?.email).toBe(testEmail)

    const createdUser = await UserModel.findOne({ email: testEmail })
    expect(createdUser?.emailVerified).toBe(false)

    const verificationEmail = await waitForEmail('Verifique seu e-mail')
    expect(verificationEmail.To?.some((recipient) => recipient.Address.toLowerCase() === testEmail)).toBe(true)
    const verification = await requestApi(
      `/users/verify-email?token=${encodeURIComponent(tokenFromEmail(verificationEmail))}`,
    )

    expect(verification.response.status).toBe(200)
    expect((await UserModel.findOne({ email: testEmail }))?.emailVerified).toBe(true)

    const login = await requestApi('/users/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password }),
    })
    expect(login.response.status).toBe(200)
    const sessionToken = login.body.data?.token
    if (!sessionToken) {
      throw new Error('A resposta de login não incluiu o token de sessão.')
    }

    const resetRequest = await requestApi('/users/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    expect(resetRequest.response.status).toBe(200)

    const resetEmail = await waitForEmail('Redefinição de senha')
    expect(resetEmail.To?.some((recipient) => recipient.Address.toLowerCase() === testEmail)).toBe(true)
    const newPassword = 'nova-senha-de-integracao-456'
    const reset = await requestApi('/users/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: tokenFromEmail(resetEmail),
        password: newPassword,
      }),
    })
    expect(reset.response.status).toBe(200)

    const oldSession = await requestApi('/users/me', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    expect(oldSession.response.status).toBe(401)

    const newLogin = await requestApi('/users/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    })
    expect(newLogin.response.status).toBe(200)
  })
})
