
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useAuth } from './store/auth.store'

export default function App(){
  const user = useAuth(s=>s.user)
  return user ? <Dashboard/> : <Login/>
}
