<template>
  <section class="grid" style="gap:16px; max-width:1100px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <div>
          <h2 style="margin:0;">My Profile</h2>
          <p class="muted" style="margin:.25rem 0 0 0;">Manage your account, goals, and preferences. Data is stored locally (per user) and used across the app.</p>
        </div>
        <router-link class="btn ghost" to="/dashboard">Back to Dashboard</router-link>
      </div>
    </div>

    <!-- Identity -->
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Identity</h3>
      <div class="row" style="gap:16px; align-items:flex-start; flex-wrap:wrap;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <img
            :src="previewAvatar || defaultAvatar"
            alt="Avatar"
            style="width:96px; height:96px; border-radius:999px; object-fit:cover; border:1px solid var(--border);"
          />
          <label class="btn ghost" for="avatarInput">Upload</label>
          <input id="avatarInput" type="file" accept="image/*" @change="onAvatarChange" style="display:none" />
          <button class="btn ghost" @click="removeAvatar" :disabled="!profile.avatarUrl">Remove</button>
        </div>

        <div class="grid" style="gap:10px; min-width:260px; flex:1;">
          <label>Display Name
            <input class="input" v-model.trim="profile.name" placeholder="Your name" />
          </label>

          <label>Email
            <input class="input" :value="email || 'Guest (not logged in)'" disabled />
          </label>

          <label>Bio
            <textarea class="input" rows="3" v-model.trim="profile.bio" placeholder="A short line about you"></textarea>
          </label>

          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button class="btn" @click="save">Save</button>
            <button class="btn ghost" @click="resetFromStorage">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals & Preferences -->
    <div class="card">
      <h3 style="margin:0 0 10px 0;">Goals & Preferences</h3>
      <div class="grid" style="gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <label>Daily Goal (minutes)
          <input class="input" type="number" min="0" max="240" v-model.number="profile.goalMinutes" placeholder="e.g. 10" />
        </label>

        <label>Default Practice
          <select class="input" v-model="profile.preferredMode">
            <option value="mindfulness">Mindfulness</option>
            <option value="exercise">Exercise</option>
          </select>
        </label>

        <label>Default Start Page
          <select class="input" v-model="profile.defaultStartPage">
            <option value="/">Home</option>
            <option value="/dashboard">Dashboard</option>
            <option value="/mindfulness">Mindfulness</option>
            <option value="/resources">Resources</option>
            <option value="/community">Community</option>
          </select>
        </label>

        <label>Map Travel Mode
          <select class="input" v-model="profile.mapMode">
            <option value="WALKING">Walking</option>
            <option value="BICYCLING">Cycling</option>
            <option value="DRIVING">Driving</option>
          </select>
        </label>

        <label>Theme
          <select class="input" v-model="profile.theme">
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn" @click="save">Save Preferences</button>
        <span class="muted">These preferences personalize your Dashboard, Mindfulness, Map and overall UI.</span>
      </div>
    </div>

    <!-- Activity (from sessions) -->
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">My Activity</h3>
        <div class="row" style="gap:8px;">
          <button class="btn ghost" @click="clearSessions" :disabled="sessions.length===0">Clear Sessions</button>
        </div>
      </div>

      <div class="grid" style="gap:8px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:8px;">
        <article class="card">
          <h4 style="margin:0;">Total Sessions</h4>
          <p class="big">{{ sessions.length }}</p>
          <p class="muted small">Total Minutes: {{ totalMinutes }}</p>
        </article>
        <article class="card">
          <h4 style="margin:0;">Streak</h4>
          <p class="big">{{ streakDays }} day{{ streakDays===1?'':'s' }}</p>
          <p class="muted small">Last session: {{ lastSessionText }}</p>
        </article>
      </div>

      <div v-if="sessions.length===0" class="card" style="margin-top:8px;">
        <p class="muted" style="margin:0;">No sessions yet. Start one on the Mindfulness page.</p>
      </div>
      <div v-else class="grid" style="gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:8px;">
        <article v-for="s in sessions.slice(0,8)" :key="s.id" class="card">
          <h4 style="margin:0;">{{ s.type || 'Practice' }}</h4>
          <p class="muted" style="margin:.25rem 0 6px 0;">{{ fmt(s.ts) }} • {{ s.duration || 0 }} min</p>
          <p v-if="s.notes" style="margin:0;">“{{ truncate(s.notes, 100) }}”</p>
        </article>
      </div>
    </div>

    <!-- Favorites -->
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">My Favorites</h3>
        <div class="row" style="gap:8px;">
          <router-link class="btn ghost" to="/resources">Open Library</router-link>
          <button class="btn ghost" @click="clearFavorites" :disabled="favorites.length===0">Clear Favorites</button>
        </div>
      </div>

      <div v-if="favorites.length===0" class="card" style="margin-top:8px;">
        <p class="muted" style="margin:0;">You haven't saved any resources yet.</p>
      </div>
      <ul v-else style="list-style:none; padding:0; margin:8px 0 0 0; display:grid; gap:8px;">
        <li v-for="id in favorites" :key="id" class="card">
          <div class="row" style="justify-content:space-between; align-items:center;">
            <div>
              <b>Resource</b> • <span class="muted">ID: {{ id }}</span>
              <p class="muted small" style="margin:4px 0 0 0;">Open full details in Resources.</p>
            </div>
            <router-link class="btn" to="/resources">Open</router-link>
          </div>
        </li>
      </ul>
    </div>

    <!-- Danger Zone -->
    <div class="card" style="border-left:6px solid #ef4444;">
      <h3 style="margin:0 0 8px 0;">Danger Zone</h3>
      <p class="muted">These actions remove data stored locally on this device for your account.</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <button class="btn" style="background:#ef4444;" @click="clearProfile">Clear Profile</button>
        <button class="btn ghost" @click="clearAllLocal">Clear ALL Local Data</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const email = computed(() => auth.user?.email || '')
const defaultAvatar = 'https://api.dicebear.com/7.x/thumbs/svg?seed=student'

// ---------- Helpers ----------


function readJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}
function startOfDay(ts: number){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime() }
function fmt(ts: number){
  const d = new Date(ts)
  return d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function truncate(s: string, n: number){ return (s || '').length > n ? s.slice(0,n) + '…' : (s || '') }

// ---------- Profile storage (per user) ----------
type Profile = {
  name: string
  bio?: string
  avatarUrl?: string
  goalMinutes?: number
  preferredMode?: 'mindfulness'|'exercise'
  defaultStartPage?: string
  mapMode?: 'WALKING'|'BICYCLING'|'DRIVING'
  theme?: 'auto'|'light'|'dark'
}
function keyForUser() {
  return `user_profile:${email.value || 'guest'}`
}
function loadProfile(): Profile {
  const p = readJSON<Profile>(keyForUser(), {
    name: email.value?.split('@')[0] || 'Guest',
    bio: '',
    avatarUrl: '',
    goalMinutes: 10,
    preferredMode: 'mindfulness',
    defaultStartPage: '/dashboard',
    mapMode: 'WALKING',
    theme: 'auto'
  })
  return p
}
function saveProfileToLocal(p: Profile){
  localStorage.setItem(keyForUser(), JSON.stringify(p))

  localStorage.setItem('preferred_map_mode', p.mapMode || 'WALKING')
  localStorage.setItem('preferred_practice', p.preferredMode || 'mindfulness')
  localStorage.setItem('goal_minutes', String(p.goalMinutes || 0))
}

const profile = reactive<Profile>(loadProfile())
const previewAvatar = ref<string|undefined>(profile.avatarUrl || '')

// ---------- Avatar ----------
function onAvatarChange(e: Event){
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { previewAvatar.value = String(reader.result); profile.avatarUrl = previewAvatar.value }
  reader.readAsDataURL(file)
}
function removeAvatar(){
  profile.avatarUrl = ''
  previewAvatar.value = ''
}

// ---------- Sessions / Favorites ----------
type Session = { id?: string; ts: number; duration?: number; type?: string; notes?: string }
const ses1 = readJSON<Session[]>('mind_sessions', [])
const ses2 = readJSON<Session[]>('mindfulness_sessions', [])
const ses3 = readJSON<Session[]>('exercise_sessions', [])
const sessions = computed<Session[]>(() => {
  const merged = [...ses1, ...ses2, ...ses3].filter(s => s && typeof s.ts === 'number')
  return merged
    .map((s, i) => ({ id: s.id || `s_${i}_${s.ts}`, ...s }))
    .sort((a,b) => b.ts - a.ts)
})
const totalMinutes = computed(() => sessions.value.reduce((a,s)=> a + (s.duration||0), 0))
const today0 = startOfDay(Date.now())
const streakDays = computed(() => {
  let streak = 0
  for (let i=0;i<100;i++){
    const dayTs = today0 - i*24*60*60*1000
    const count = sessions.value.filter(s => startOfDay(s.ts) === dayTs).length
    if (count > 0) streak++
    else break
  }
  return streak
})
const lastSessionText = computed(() => sessions.value[0]?.ts ? fmt(sessions.value[0].ts) : '—')

// favorites
const favorites = ref<string[]>(readJSON<string[]>('favorites', []))

// ---------- Actions ----------
function save() {
  const auth = useAuthStore()

  profile.name = (profile.name || '').trim() || (email.value?.split('@')[0] || 'Guest')
  if (profile.goalMinutes && profile.goalMinutes < 0) profile.goalMinutes = 0

  saveProfileToLocal(profile)


  auth.updateDisplayName(profile.name || '')

  alert('Profile saved ✅')
}

function resetFromStorage(){
  const p = loadProfile()
  Object.assign(profile, p)
  previewAvatar.value = profile.avatarUrl || ''
}
function clearProfile(){
  localStorage.removeItem(keyForUser())
  resetFromStorage()
  alert('Profile cleared on this device.')
}
function clearAllLocal(){
  if (confirm('This will clear ALL local data for this app on this device. Continue?')){
    localStorage.clear()
    resetFromStorage()
    alert('All local data cleared.')
  }
}
function clearSessions(){
  if (!sessions.value.length) return
  if (confirm('Clear all practice sessions stored locally?')){
    localStorage.removeItem('mind_sessions')
    localStorage.removeItem('mindfulness_sessions')
    localStorage.removeItem('exercise_sessions')

    location.reload()
  }
}
function clearFavorites(){
  if (!favorites.value.length) return
  if (confirm('Clear all saved favorites?')){
    favorites.value = []
    localStorage.setItem('favorites', JSON.stringify([]))
  }
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
.small { font-size:12px; }
.big { font-size:28px; font-weight:700; margin:2px 0 0 0; }
</style>
