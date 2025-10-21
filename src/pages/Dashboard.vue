<template>
  <section class="grid" style="gap:16px; max-width:1200px; margin-inline:auto;">
    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <div>
          <h2 style="margin:0;">Welcome back{{ userName ? `, ${userName}` : '' }} 👋</h2>
          <p class="muted" style="margin:.25rem 0 0 0;">
            Keep small steps. Your streak is <b>{{ streakDays }}</b> day{{ streakDays===1?'':'s' }}.
          </p>
        </div>
        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <router-link class="btn" to="/mindfulness">Continue Practice</router-link>
          <router-link class="btn secondary" to="/resources">Browse Resources</router-link>
        </div>
      </div>
    </div>

    <div class="grid" style="gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
      <article class="card kpi">
        <h3>Sessions</h3>
        <p class="big">{{ totalSessions }}</p>
        <p class="muted small">Last 7 days: {{ sessions7d }}</p>
      </article>
      <article class="card kpi">
        <h3>Minutes Practiced</h3>
        <p class="big">{{ totalDurationPretty }}</p>
        <p class="muted small">Avg / session: {{ avgPerSessionPretty }}</p>
      </article>
      <article class="card kpi">
        <h3>Favorites</h3>
        <p class="big">{{ favoritesCount }}</p>
        <p class="muted small">Resources you saved</p>
      </article>
      <article class="card kpi">
        <h3>Community</h3>
        <p class="big">{{ postsCount }}</p>
        <p class="muted small">Posts created</p>
      </article>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Last 7 Days Activity</h3>
        <span class="muted small">Sessions per day</span>
      </div>
      <div class="row" style="gap:8px; align-items:flex-end; margin-top:10px;">
        <div v-for="d in last7" :key="d.label" class="bar">
          <div class="bar-fill" :style="{ height: Math.max(4, d.count * 16) + 'px' }"></div>
          <div class="bar-label">{{ d.label }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Recent Sessions</h3>
        <router-link class="btn ghost" to="/mindfulness">New Session</router-link>
      </div>
      <div v-if="recentSessions.length===0" class="card" style="margin-top:8px;">
        <p class="muted" style="margin:0;">No sessions yet. Try a 2-min breathing exercise to get started.</p>
      </div>
      <div v-else class="grid" style="gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:8px;">
        <article v-for="s in recentSessions" :key="s.id" class="card">
          <h4 style="margin:0;">{{ s.type || 'Practice' }}</h4>
          <p class="muted" style="margin:.25rem 0 6px 0;">
            {{ formatDateTime(s.ts) }} • {{ s.duration || 0 }} min
          </p>
          <p v-if="s.notes" style="margin:0;">“{{ truncate(s.notes, 100) }}”</p>
        </article>
      </div>
    </div>

    <div class="card">
      <h3 style="margin:0 0 8px 0;">Quick Actions</h3>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <router-link class="btn" to="/reviews">Leave a Review</router-link>
        <router-link class="btn" to="/community">Share to Community</router-link>
        <router-link class="btn" to="/profile">Update Profile</router-link>
        <router-link class="btn" to="/map">Plan a Walk</router-link>
        <router-link class="btn" to="/help">Need Help</router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()

function getProfileDisplayName(): string {
  const email = auth.user?.email || 'guest'
  try {
    const p = JSON.parse(localStorage.getItem(`user_profile:${email}`) || '{}')
    const name = (p?.name || '').trim()
    if (name) return name
  } catch {}
  return (auth.user as any)?.displayName || (auth.user?.email?.split('@')[0] || '')
}

const userName = computed(() => getProfileDisplayName())

function readJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

type Session = { id?: string; ts: number; duration?: number; type?: string; notes?: string }
const ses1 = readJSON<Session[]>('mind_sessions', [])
const ses2 = readJSON<Session[]>('mindfulness_sessions', [])
const ses3 = readJSON<Session[]>('exercise_sessions', [])
const sessions = computed<Session[]>(() => {
  const merged = [...ses1, ...ses2, ...ses3].filter(s => s && typeof s.ts === 'number')
  return merged.map((s, i) => ({ id: s.id || `s_${i}_${s.ts}`, ...s })).sort((a,b) => b.ts - a.ts)
})

const favorites = readJSON<string[]>('favorites', [])
const favoritesCount = favorites.length

type Post = { id: string; createdAt: number }
const posts = readJSON<Post[]>('community_posts', [])
const postsCount = posts.length

const totalSessions = computed(() => sessions.value.length)
const totalMinutes = computed(() => sessions.value.reduce((a,s)=> a + (s.duration||0), 0))
const avgMinutes = computed(() => totalSessions.value ? Math.round(totalMinutes.value / totalSessions.value) : 0)


function minutesToHHMM(mins: number): string {
  const total = Math.max(0, Math.round(mins))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
const totalDurationPretty = computed(() => minutesToHHMM(totalMinutes.value))
const avgPerSessionPretty = computed(() => {
  const n = totalSessions.value
  if (!n) return '0m'
  const avg = totalMinutes.value / n
  const h = Math.floor(avg / 60)
  const m = Math.round(avg % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
})
// =====================

function startOfDay(ts: number){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime() }
const today0 = startOfDay(Date.now())
const last7 = computed(() => {
  const arr: { label: string, dayTs: number, count: number }[] = []
  for (let i=6;i>=0;i--){
    const dayTs = today0 - i*24*60*60*1000
    const label = new Date(dayTs).toLocaleDateString(undefined, { weekday:'short' })
    const count = sessions.value.filter(s => startOfDay(s.ts) === dayTs).length
    arr.push({ label, dayTs, count })
  }
  return arr
})
const sessions7d = computed(() => last7.value.reduce((a,x)=>a+x.count,0))
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
const recentSessions = computed(() => sessions.value.slice(0, 6))

function formatDateTime(ts: number){
  const d = new Date(ts)
  return d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function truncate(s: string, n: number){ return (s || '').length > n ? s.slice(0,n) + '…' : (s || '') }
</script>

<style scoped>
.muted { color:#9fb6cc; }
.small { font-size: 12px; }
.kpi .big { font-size: 28px; font-weight: 700; margin: 2px 0 0 0; }
.bar { width: 36px; text-align: center; }
.bar-fill { width: 100%; background:#2563eb; border-radius: 6px 6px 0 0; transition: height .3s; }
.bar-label { font-size: 12px; margin-top: 4px; color:#9fb6cc; }
</style>
