import { z } from 'zod'

const token = z.string().min(32).max(256)
const email = z.string().trim().email().max(254)
const newPassword = z.string().min(6).max(128)
const currentPassword = z.string().min(1).max(128)

export const registerBody = z.object({
  email,
  password: newPassword,
})

export const loginBody = z.object({
  email,
  password: currentPassword,
})

export const emailBody = z.object({
  email,
})

export const verifyEmailQuery = z.object({
  token,
})

export const resetPasswordBody = z.object({
  token,
  password: newPassword,
})

export const legacyMigrationBody = z.object({
  email,
})
