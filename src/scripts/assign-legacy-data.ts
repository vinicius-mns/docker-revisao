import { connectDb, disconnectDb } from '../config/db.js'
import { usersRepository } from '../repositories/users.repository.js'

const email = process.argv[2]

if (!email) {
  throw new Error('Informe o e-mail de uma conta verificada: npm run migrate:legacy -- usuario@email.com')
}

try {
  await connectDb()
  const assigned = await usersRepository.assignLegacyRecordsToUser(email)
  console.log(`Registros atribuídos: ${assigned.cards} cards e ${assigned.tags} tags.`)
} finally {
  await disconnectDb()
}
