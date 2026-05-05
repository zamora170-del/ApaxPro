
import { create } from 'zustand'

export const useAuth = create(set => ({
  user: null,
  login: (u:any) => set({ user: u }),
  logout: () => set({ user: null })
}))
