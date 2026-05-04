
import { openDB } from 'idb'
import bcrypt from 'bcryptjs'

export const dbPromise = openDB('apaxpro', 1, {
  upgrade(db) {
    const users = db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true })
    users.createIndex('email', 'email', { unique: true })

    users.add({
      email: 'admin@apaxpro.com',
      password: bcrypt.hashSync('admin123', 12),
      rol: 'ADM',
      nombre: 'Administrador',
      activo: 1
    })
  }
})
