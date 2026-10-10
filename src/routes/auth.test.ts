import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const emailMocks = vi.hoisted(() => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/email.js', () => emailMocks)

import { createApp } from '../app.js'
import { connectDb, disconnectDb } from '../config/db.js'
import { CardModel } from '../models/card.model.js'
import { SessionModel } from '../models/session.model.js'
import { TagModel } from '../models/tag.model.js'
import { UserModel } from '../models/user.model.js'
import { createToken, hashToken } from '../services/tokens.js'

describe('authenticated data routes', () => {
  const app = createApp()
  let mongo: MongoMemoryServer

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await connectDb(mongo.getUri())
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await Promise.all([
      CardModel.deleteMany({}),
      SessionModel.deleteMany({}),
      TagModel.deleteMany({}),
      UserModel.deleteMany({}),
    ])
  })

  afterAll(async () => {
    await disconnectDb()
    await mongo.stop()
  })

  it('requires a valid session for cards and tags', async () => {
    const cards = await request(app).get('/cards')
    const tags = await request(app).post('/tags').send([{ content: 'tag' }])

    expect(cards.status).toBe(401)
    expect(tags.status).toBe(401)
  })

  it('returns only cards owned by the authenticated user', async () => {
    const user = await UserModel.create({
      email: 'owner@example.com',
      passwordHash: 'test-hash',
      emailVerified: true,
    })
    const token = createToken()
    const ownerId = String(user._id)

    await SessionModel.create({
      userId: ownerId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60_000),
    })
    await CardModel.insertMany([
      { id: 'owned-card', ownerId, date: new Date(), timestamp: 2, content: 'Meu card', tags: [] },
      { id: 'other-card', ownerId: 'another-user', date: new Date(), timestamp: 1, content: 'Outro', tags: [] },
    ])

    const response = await request(app)
      .get('/cards')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.data.cards.map((card: { id: string }) => card.id)).toEqual(['owned-card'])
  })

  it('does not allow attaching another user tag to a card', async () => {
    const user = await UserModel.create({
      email: 'owner@example.com',
      passwordHash: 'test-hash',
      emailVerified: true,
    })
    const token = createToken()

    await SessionModel.create({
      userId: String(user._id),
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60_000),
    })
    await TagModel.create({
      id: 'private-tag',
      ownerId: 'another-user',
      content: 'Privada',
      timestamp: Date.now(),
    })

    const response = await request(app)
      .post('/cards')
      .set('Authorization', `Bearer ${token}`)
      .send([{ date: new Date().toISOString(), content: 'Novo card', tags: ['private-tag'] }])

    expect(response.status).toBe(400)
  })

  it('registers, verifies, logs in, and resets passwords only for existing accounts', async () => {
    const email = 'new-user@example.com'
    const password = 'senha-segura-de-teste-123'

    const registration = await request(app)
      .post('/users/register')
      .send({ email, password })

    expect(registration.status).toBe(201)
    expect(emailMocks.sendVerificationEmail).toHaveBeenCalledOnce()

    const verificationToken = emailMocks.sendVerificationEmail.mock.calls[0][1] as string
    const verification = await request(app).get('/users/verify-email').query({ token: verificationToken })
    expect(verification.status).toBe(200)

    const login = await request(app).post('/users/login').send({ email, password })
    expect(login.status).toBe(200)
    const oldSession = login.body.data.token as string

    const unknownEmail = await request(app)
      .post('/users/forgot-password')
      .send({ email: 'unknown@example.com' })
    expect(unknownEmail.status).toBe(200)
    expect(emailMocks.sendPasswordResetEmail).not.toHaveBeenCalled()

    const resetRequest = await request(app).post('/users/forgot-password').send({ email })
    expect(resetRequest.status).toBe(200)
    expect(emailMocks.sendPasswordResetEmail).toHaveBeenCalledOnce()

    const resetToken = emailMocks.sendPasswordResetEmail.mock.calls[0][1] as string
    const newPassword = 'nova-senha-segura-de-teste-456'
    const reset = await request(app)
      .post('/users/reset-password')
      .send({ token: resetToken, password: newPassword })
    expect(reset.status).toBe(200)

    const oldSessionResponse = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${oldSession}`)
    expect(oldSessionResponse.status).toBe(401)

    const oldPasswordLogin = await request(app).post('/users/login').send({ email, password })
    const newPasswordLogin = await request(app).post('/users/login').send({ email, password: newPassword })
    expect(oldPasswordLogin.status).toBe(401)
    expect(newPasswordLogin.status).toBe(200)
  })
})
