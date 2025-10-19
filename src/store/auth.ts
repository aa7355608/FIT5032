import { defineStore } from 'pinia'
import { auth, db } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

type Role = 'user' | 'admin'
type Session = { email: string; name?: string; role: Role; displayName?: string; uid?: string }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null as Session | null,
    _inited: false,
  }),
  actions: {
    hydrate() {
      if (this._inited) return
      this._inited = true
      onAuthStateChanged(auth, async (u) => {
        if (!u) { this.isAuthenticated = false; this.user = null; return }
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)
        const role = (snap.exists() ? (snap.data().role as Role) : 'user') || 'user'
        this.isAuthenticated = true
        this.user = {
          uid: u.uid,
          email: u.email || '',
          name: u.displayName || u.email?.split('@')[0] || 'Guest',
          displayName: u.displayName || u.email?.split('@')[0] || 'Guest',
          role,
        }
      })
    },
    async register(payload: { name: string; email: string; password: string; role?: Role }) {
      const name = (payload.name || '').trim()
      const email = (payload.email || '').trim().toLowerCase()
      const password = (payload.password || '').trim()
      if (!email || !password) throw new Error('Email and password are required.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email format.')
      if (password.length < 6) throw new Error('Password must be at least 6 characters.')
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      const displayName = name || email.split('@')[0]
      if (displayName) await updateProfile(user, { displayName })
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: 'user' as Role,
        createdAt: Date.now(),
        displayName,
      })
    },
    async login(payload: { email: string; password: string }) {
      const email = (payload.email || '').trim().toLowerCase()
      const password = (payload.password || '').trim()
      if (!email || !password) throw new Error('Email and password are required.')
      await signInWithEmailAndPassword(auth, email, password)
    },
    async logout() {
      await signOut(auth)
      this.isAuthenticated = false
      this.user = null
    },
    async updateDisplayName(name: string) {
      if (!this.user?.uid) return
      const newName = (name || '').trim() || this.user.email.split('@')[0]
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: newName })
      await updateDoc(doc(db, 'users', this.user.uid), { displayName: newName })
      this.user.displayName = newName
      this.user.name = newName
    },
  },
})
