import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { usersController } from '../controllers/users.controller.ts'
import { requireAuth } from '../middlewares/auth.ts'

const sensitiveActionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

export const usersRoutes = Router()

usersRoutes.post('/register', sensitiveActionLimit, usersController.register)
usersRoutes.post('/resend-verification', sensitiveActionLimit, usersController.resendVerification)
usersRoutes.get('/verify-email', usersController.verifyEmail)
usersRoutes.post('/login', sensitiveActionLimit, usersController.login)
usersRoutes.post('/forgot-password', sensitiveActionLimit, usersController.forgotPassword)
usersRoutes.post('/reset-password', sensitiveActionLimit, usersController.resetPassword)
usersRoutes.get('/me', requireAuth, usersController.me)
usersRoutes.post('/logout', requireAuth, usersController.logout)
