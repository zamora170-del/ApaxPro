
import { useState } from 'react'
import { login } from '../services/auth.service'
import { useAuth } from '../store/auth.store'

export default function Login() {
  const setUser = useAuth(s => s.login)

  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  const handle = async () => {
    try {
      const user = await login(email,password)
      setUser(user)
    } catch {
      alert('Credenciales incorrectas')
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="card">
        <input placeholder="email" onChange={e=>setEmail(e.target.value)}/>
        <input type="password" onChange={e=>setPassword(e.target.value)}/>
        <button onClick={handle}>Ingresar</button>
      </div>
    </div>
  )
}
