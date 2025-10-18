// src/store/auth.ts
import { defineStore } from 'pinia'

type Role = 'user' | 'admin'
type StoredUser = { email: string; password: string; name?: string; role: Role; createdAt: number }
type Session = { email: string; name?: string; role: Role; displayName?: string }

const USERS_KEY = 'users'
const AUTH_KEY = 'auth_session'

function readUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}
function writeUsers(arr: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null as Session | null,
  }),
  actions: {
    hydrate() {

      if (!localStorage.getItem(USERS_KEY)) writeUsers([])
      try {
        const raw = localStorage.getItem(AUTH_KEY)
        if (raw) {
          const u = JSON.parse(raw) as Session
          this.isAuthenticated = true
          this.user = u
        }
      } catch {/* ignore */}
    },

    register(payload: { name: string; email: string; password: string; role?: Role }) {
      const name = (payload.name || '').trim()
      const email = (payload.email || '').trim().toLowerCase()
      const password = (payload.password || '').trim()
      const role: Role = payload.role || 'user'

      if (!email || !password) throw new Error('Email and password are required.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email format.')
      if (password.length < 6) throw new Error('Password must be at least 6 characters.')

      const users = readUsers()
      if (users.some((u) => u.email === email)) throw new Error('Email already registered.')

      users.push({ email, password, name, role, createdAt: Date.now() })
      writeUsers(users)


      const session: Session = { email, name, role, displayName: name || email.split('@')[0] }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      this.isAuthenticated = true
      this.user = session


      const pk = `user_profile:${email}`
      const prof = { ...(JSON.parse(localStorage.getItem(pk) || '{}')), name: name || email.split('@')[0] }
      localStorage.setItem(pk, JSON.stringify(prof))
    },

    login(payload: { email: string; password: string }) {
      const email = (payload.email || '').trim().toLowerCase()
      const password = (payload.password || '').trim()
      const u = readUsers().find((x) => x.email === email && x.password === password)
      if (!u) throw new Error('Invalid email or password.')
      const session: Session = { email: u.email, name: u.name, role: u.role || 'user', displayName: u.name || email.split('@')[0] }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      this.isAuthenticated = true
      this.user = session
    },

    logout() {
      localStorage.removeItem(AUTH_KEY)
      this.isAuthenticated = false
      this.user = null
    },


    updateDisplayName(name: string) {
      if (!this.user) return
      this.user.displayName = (name || '').trim() || this.user.email.split('@')[0]
      localStorage.setItem(AUTH_KEY, JSON.stringify(this.user))
      const users = readUsers()
      const u = users.find((x) => x.email === this.user!.email)
      if (u) { u.name = this.user.displayName!; writeUsers(users) }
    }
  }
})
