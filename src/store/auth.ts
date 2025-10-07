import { defineStore } from 'pinia'
import { auth as fbAuth } from '@/firebase/config'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'

export type Role = 'user' | 'admin'
export type User = { id: string; email: string; role: Role }
type StoredUser = User & { password: string }

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null as User | null, token: '' as string }),
  getters: { isAuthenticated: (s) => !!s.user && !!s.token },
  actions: {
    async register(email: string, password: string, role: Role = 'user') {
      // Firebase primary
      await createUserWithEmailAndPassword(fbAuth, email, password)
      // Store role locally (simple demo mapping)
      const users: StoredUser[] = JSON.parse(localStorage.getItem('users') || '[]')
      users.push({ id: email, email, password: '***', role })
      localStorage.setItem('users', JSON.stringify(users))
      await this.login(email, password)
    },
    async login(email: string, password: string) {
      await signInWithEmailAndPassword(fbAuth, email, password)
      // Look up role from local mapping (or Firestore in a real app)
      const users: StoredUser[] = JSON.parse(localStorage.getItem('users') || '[]')
      const found = users.find(u => u.email === email) || { role: 'user' }
      this.user = { id: email, email, role: found.role as Role }
      this.token = 'firebase-session'
      sessionStorage.setItem('session', JSON.stringify({ user: this.user, token: this.token }))
    },
    async logout() {
      await signOut(fbAuth)
      this.user = null; this.token = ''
      sessionStorage.removeItem('session')
    },
    restore() {
      const s = sessionStorage.getItem('session')
      if (s) { const { user, token } = JSON.parse(s); this.user = user; this.token = token }
    }
  }
})
