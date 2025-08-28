import { defineStore } from 'pinia'

export type Role = 'user' | 'admin'
export type User = { id: string; email: string; role: Role }
type StoredUser = User & { password: string }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: '' as string
  }),
  getters: { isAuthenticated: (s) => !!s.user && !!s.token },
  actions: {
    register(email: string, password: string, role: Role = 'user') {
      const users: StoredUser[] = JSON.parse(localStorage.getItem('users') || '[]')
      if (users.find(u => u.email === email)) throw new Error('Email already registered')
      if (password.length < 8) throw new Error('Password too short')
      users.push({ id: crypto.randomUUID(), email, password, role })
      localStorage.setItem('users', JSON.stringify(users))
    },
    login(email: string, password: string) {
      const users: StoredUser[] = JSON.parse(localStorage.getItem('users') || '[]')
      const found = users.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('Invalid credentials')
      this.user = { id: found.id, email: found.email, role: found.role }
      this.token = 'demo-token'
      sessionStorage.setItem('session', JSON.stringify({ user: this.user, token: this.token }))
    },
    logout() {
      this.user = null
      this.token = ''
      sessionStorage.removeItem('session')
    },
    restore() {
      const s = sessionStorage.getItem('session')
      if (s) {
        const { user, token } = JSON.parse(s)
        this.user = user
        this.token = token
      }
    }
  }
})

