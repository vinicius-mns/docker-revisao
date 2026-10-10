import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from './password.js'

describe('password hashing', () => {
  it('stores passwords using scrypt and verifies the original password', async () => {
    const hash = await hashPassword('senha-segura-de-teste-123')

    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('senha-segura-de-teste-123', hash)).toBe(true)
    expect(await verifyPassword('outra-senha-invalida', hash)).toBe(false)
  })

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('senha-segura-de-teste-123', 'bcrypt$invalido')).resolves.toBe(false)
  })
})
