<template>
  <section class="grid" style="gap:16px; max-width:900px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <h2>Mindfulness & Exercises</h2>
      <p class="muted">Breathing presets, custom timings, visual guide, countdown, chime, and robust session history.</p>
    </div>

    <!-- Controls -->
    <div class="card">
      <div class="row" style="gap:10px; flex-wrap:wrap;">
        <label>
          Preset
          <select v-model="presetKey" class="input" @change="applyPreset">
            <option v-for="(p,key) in presets" :key="key" :value="key">{{ p.name }}</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label>Inhale (s)<input class="input" type="number" min="1" v-model.number="inhale" /></label>
        <label>Hold (s)<input class="input" type="number" min="0" v-model.number="hold" /></label>
        <label>Exhale (s)<input class="input" type="number" min="1" v-model.number="exhale" /></label>
        <label>Session (min)<input class="input" type="number" min="1" v-model.number="minutes" /></label>

        <label class="row" style="gap:6px; align-items:center;">
          <input type="checkbox" v-model="chime" /> Chime
        </label>
      </div>

      <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn" @click="start" :disabled="running">Start</button>
        <button class="btn secondary" @click="togglePause" :disabled="!running">{{ paused ? 'Resume' : 'Pause' }}</button>
        <button class="btn ghost" @click="endAndSave" :disabled="!running && elapsedMs===0">End & Save</button>
        <button class="btn ghost" @click="reset" :disabled="!running && elapsedMs===0">Reset</button>
      </div>
    </div>

    <!-- Visualiser -->
    <div class="card" style="text-align:center;">
      <BreathCircle :phase="phase" :remaining="phaseRemaining" :progress="phaseProgress" />
      <div class="row" style="gap:16px; justify-content:center; margin-top:12px;">
        <span class="muted">Breaths: <b>{{ breaths }}</b></span>
        <span class="muted">Elapsed: <b>{{ elapsedPretty }}</b></span>
        <span class="muted">Left: <b>{{ leftPretty }}</b></span>
      </div>
    </div>

    <!-- Notes -->
    <div class="card">
      <h3>Quick Reflection (optional)</h3>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <textarea class="input" rows="3" v-model="note" maxlength="200" placeholder="e.g., Feel calmer and more focused."></textarea>
        <button class="btn" @click="saveNote" :disabled="!history.length || !note.trim()">Save Note</button>
      </div>
      <p v-if="saved" class="muted" style="margin-top:6px;">Saved!</p>
    </div>

    <!-- History -->
    <div class="card">
      <h3>Session History</h3>
      <p class="muted">Stored locally on this device (completed or aborted).</p>
      <div class="grid cards">
        <article v-for="s in history" :key="s.id" class="card">
          <h3>{{ s.name }}</h3>
          <p class="muted">{{ s.date }} • <b>{{ s.status }}</b></p>
          <p>Breaths: {{ s.breaths }} • Duration: {{ s.duration }}</p>
          <p class="muted">Pattern: {{ s.pattern }} • Target: {{ s.target }}</p>
          <p v-if="s.note">“{{ s.note }}”</p>
        </article>
      </div>
      <div class="row" style="justify-content:flex-end; margin-top:10px;">
        <button class="btn ghost" @click="clearHistory" :disabled="!history.length">Clear History</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, computed } from 'vue'
import BreathCircle from '@/components/BreathCircle.vue'

type Phase = 'inhale'|'hold'|'exhale'|'idle'
type Status = 'completed'|'aborted'
type Session = {
  id: string
  name: string
  date: string
  breaths: number
  duration: string
  pattern: string         // e.g. 4-4-4
  target: string          // e.g. 3min
  chime: boolean
  status: Status
  note?: string
}

const presets: Record<string, { name:string; inhale:number; hold:number; exhale:number }> = {
  box:       { name: 'Box Breathing (4-4-4-4)', inhale: 4, hold: 4, exhale: 4 },
  fourSeven: { name: '4-7-8 (Relax)',           inhale: 4, hold: 7, exhale: 8 },
  coherence: { name: 'Coherence 5-0-5',         inhale: 5, hold: 0, exhale: 5 },
}

const presetKey = ref<keyof typeof presets | 'custom'>('box')
const inhale = ref(4)
const hold = ref(4)
const exhale = ref(4)
const minutes = ref(3)
const chime = ref(true)

const phase = ref<Phase>('idle')
const phaseRemaining = ref(0)
const phaseProgress = ref(0)
const breaths = ref(0)
const running = ref(false)
const paused = ref(false)
const startTime = ref<number | null>(null)
const elapsedMs = ref(0)
const totalMs = computed(() => minutes.value * 60 * 1000)

const note = ref('')
const saved = ref(false)
const history = ref<Session[]>(JSON.parse(localStorage.getItem('mind_sessions') || '[]'))

let rafId = 0
let tickPrev = 0
let phaseTotal = 0

function persistHistory() {
  localStorage.setItem('mind_sessions', JSON.stringify(history.value))
}

function applyPreset() {
  if (presetKey.value !== 'custom') {
    const p = presets[presetKey.value]
    inhale.value = p.inhale
    hold.value = p.hold
    exhale.value = p.exhale
  }
}

function patternStr() { return `${inhale.value}-${hold.value}-${exhale.value}` }
function targetStr() { return `${minutes.value}min` }

function start() {
  if (running.value) return
  applyPreset()
  breaths.value = 0
  elapsedMs.value = 0
  startTime.value = performance.now()
  running.value = true
  paused.value = false
  startPhase('inhale', inhale.value)
  tickPrev = performance.now()
  rafId = requestAnimationFrame(tick)
}

function togglePause() {
  if (!running.value) return
  paused.value = !paused.value
  if (!paused.value) { tickPrev = performance.now(); rafId = requestAnimationFrame(tick) }
}

function saveSession(status: Status) {
  // 不重复保存：若总时长与呼吸为 0 则忽略
  if (elapsedMs.value <= 0 && breaths.value <= 0) return
  const name = presetKey.value === 'custom'
    ? `Custom ${patternStr()}`
    : presets[presetKey.value].name
  const d = new Date()
  const record: Session = {
    id: crypto.randomUUID(),
    name,
    date: d.toLocaleString(),
    breaths: breaths.value,
    duration: msPretty(elapsedMs.value),
    pattern: patternStr(),
    target: targetStr(),
    chime: chime.value,
    status
  }
  history.value.unshift(record)
  persistHistory()
}

function endAndSave() {
  // 手动结束并保存为 completed
  running.value = false
  paused.value = false
  phase.value = 'idle'
  phaseRemaining.value = 0
  phaseProgress.value = 0
  cancelAnimationFrame(rafId)
  saveSession('completed')
}

function reset() {
  // 若已有进度，则保存为 aborted
  if (elapsedMs.value > 0 || breaths.value > 0) saveSession('aborted')
  running.value = false
  paused.value = false
  phase.value = 'idle'
  phaseRemaining.value = 0
  phaseProgress.value = 0
  breaths.value = 0
  elapsedMs.value = 0
  startTime.value = null
  cancelAnimationFrame(rafId)
}

function startPhase(next: Phase, seconds: number) {
  phase.value = next
  phaseTotal = Math.max(1, seconds)
  phaseRemaining.value = phaseTotal
  phaseProgress.value = 0
  if (chime.value && next !== 'idle') beep(220, 0.05)
}

function nextPhase() {
  if (phase.value === 'inhale') {
    if (hold.value > 0) startPhase('hold', hold.value)
    else startPhase('exhale', exhale.value)
    return
  }
  if (phase.value === 'hold') { startPhase('exhale', exhale.value); return }
  if (phase.value === 'exhale') {
    breaths.value++
    if (elapsedMs.value >= totalMs.value) { finishSession(); return }
    startPhase('inhale', inhale.value)
  }
}

function finishSession() {
  running.value = false
  paused.value = false
  phase.value = 'idle'
  phaseRemaining.value = 0
  phaseProgress.value = 0
  cancelAnimationFrame(rafId)
  saveSession('completed')    // ✅ 结束时保存为 completed
}

function tick(now: number) {
  if (!running.value || paused.value) return
  const delta = Math.max(0, now - tickPrev)
  tickPrev = now
  elapsedMs.value += delta

  phaseProgress.value = Math.min(1, phaseProgress.value + delta / (phaseTotal * 1000))
  const remaining = Math.ceil((1 - phaseProgress.value) * phaseTotal)
  phaseRemaining.value = remaining

  if (phaseProgress.value >= 1) nextPhase()
  if (running.value && !paused.value) rafId = requestAnimationFrame(tick)
}

function beep(freq = 440, duration = 0.08) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = freq
    o.type = 'sine'
    const now = ctx.currentTime
    g.gain.setValueAtTime(0.001, now)
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    o.start(now); o.stop(now + duration)
  } catch {}
}

function msPretty(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

const elapsedPretty = computed(() => msPretty(elapsedMs.value))
const leftPretty = computed(() => msPretty(Math.max(0, totalMs.value - elapsedMs.value)))

function saveNote() {
  const t = note.value.trim()
  if (!t || !history.value.length) return
  history.value[0].note = t
  persistHistory()
  saved.value = true
  setTimeout(() => (saved.value = false), 1000)
  note.value = ''
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('mind_sessions')
}

// 离开页面或切路由时，如果有进度，自动保存为 aborted
function autoSaveOnLeave() {
  if (running.value || elapsedMs.value > 0 || breaths.value > 0) {
    saveSession('aborted')
  }
}

onMounted(() => {
  applyPreset()
  window.addEventListener('beforeunload', autoSaveOnLeave)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', autoSaveOnLeave)
  autoSaveOnLeave()
})
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
