import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

const deriveKey = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

export const verifyPassword = async (password: string, storedHash: string) => {
  const [algorithm, saltHex, keyHex] = storedHash.split('$')

  if (
    algorithm !== 'scrypt' ||
    !saltHex ||
    !keyHex ||
    !/^[a-f0-9]+$/i.test(saltHex + keyHex) ||
    saltHex.length !== 32 ||
    keyHex.length !== KEY_LENGTH * 2
  ) {
    return false
  }

  const expectedKey = Buffer.from(keyHex, 'hex')
  if (expectedKey.length !== KEY_LENGTH) {
    return false
  }

  const actualKey = await deriveKey(password, Buffer.from(saltHex, 'hex'))
  return timingSafeEqual(expectedKey, actualKey)
}
