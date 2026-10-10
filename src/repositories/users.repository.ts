import { HttpError } from '../middlewares/error.ts'
import { CardModel } from '../models/card.model.ts'
import { SessionModel } from '../models/session.model.ts'
import { TagModel } from '../models/tag.model.ts'
import { UserModel } from '../models/user.model.ts'
import { hashPassword, verifyPassword } from '../services/password.ts'
import { createToken, hashToken } from '../services/tokens.ts'

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const issueVerificationToken = async (userId: string) => {
  const token = createToken()
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    },
  )
  return token
}

export const usersRepository = {
  async register(email: string, password: string) {
    const user = await UserModel.create({
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      emailVerified: false,
    })

    return {
      user: { id: String(user._id), email: user.email },
      verificationToken: await issueVerificationToken(String(user._id)),
    }
  },

  async resendVerification(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase(), emailVerified: false })
    if (!user) {
      return null
    }

    return {
      email: user.email,
      token: await issueVerificationToken(String(user._id)),
    }
  },

  async verifyEmail(token: string) {
    const result = await UserModel.updateOne(
      {
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: { $gt: new Date() },
        emailVerified: false,
      },
      {
        $set: { emailVerified: true },
        $unset: {
          emailVerificationTokenHash: 1,
          emailVerificationExpiresAt: 1,
        },
      },
    )

    return result.modifiedCount === 1
  },

  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash')

    if (!user) {
      await hashPassword(password)
      throw new HttpError(401, 'E-mail ou senha inválidos')
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, 'E-mail ou senha inválidos')
    }

    if (!user.emailVerified) {
      throw new HttpError(403, 'Verifique seu e-mail antes de entrar')
    }

    const token = createToken()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await SessionModel.create({
      userId: String(user._id),
      tokenHash: hashToken(token),
      expiresAt,
    })

    return {
      token,
      expiresAt,
      user: { id: String(user._id), email: user.email },
    }
  },

  async createPasswordReset(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      return null
    }

    const token = createToken()
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
        },
      },
    )

    return { email: user.email, token }
  },

  async resetPassword(token: string, password: string) {
    const user = await UserModel.findOneAndUpdate(
      {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: { passwordHash: await hashPassword(password) },
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
      },
      { new: false, projection: { _id: 1 } },
    )

    if (!user) {
      return false
    }

    await SessionModel.deleteMany({ userId: String(user._id) })

    return true
  },

  async authenticateSession(token: string) {
    const session = await SessionModel.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    })

    if (!session) {
      return null
    }

    const user = await UserModel.findOne({ _id: session.userId, emailVerified: true })
    return user ? String(user._id) : null
  },

  async deleteSession(token: string) {
    const result = await SessionModel.deleteOne({ tokenHash: hashToken(token) })
    return result.deletedCount === 1
  },

  async assignLegacyRecordsToUser(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase(), emailVerified: true })
    if (!user) {
      throw new HttpError(404, 'Usuário verificado não encontrado')
    }

    const userId = String(user._id)
    const [cards, tags] = await Promise.all([
      CardModel.updateMany({ ownerId: { $exists: false } }, { $set: { ownerId: userId } }),
      TagModel.updateMany({ ownerId: { $exists: false } }, { $set: { ownerId: userId } }),
    ])

    return { cards: cards.modifiedCount, tags: tags.modifiedCount }
  },
}
