
import { dbPromise } from '../db/db'
import bcrypt from 'bcryptjs'

export async function login(email: string, password: string) {
  const db = await dbPromise
  const user = await db.getFromIndex('usuarios', 'email', email)

  if (!user) throw new Error('CREDENCIALES_INVALIDAS')

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) throw new Error('CREDENCIALES_INVALIDAS')

  return user
}
