<template>
  <section class="grid" style="gap:16px; max-width:900px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <h2>Mindfulness & Exercises</h2>
      <p class="muted">Choose a breathing preset or customise timings. Visual cue, countdown, optional chime, and session history included.</p>
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

        <label>
          Inhale (s)
          <input class="input" type="number" min="1" v-model.number="inhale" />
        </label>
        <label>
          Hold (s)
          <input class="input" type="number" min="0" v-model.number="hold" />
        </label>
        <label>
          Exhale (s)
          <input class="input" type="number" min="1" v-model.number="exhale" />
        </label>

        <label>
          Session (min)
          <input class="input" type="number" min="1" v-model.number="minutes" />
        </label>

        <label class="row" style="gap:6px; align-items:center;">
          <input type="checkbox" v-model="chime" /> Chime
        </label>
      </div>

      <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn" @click="start" :disabled="running">Start</button>
        <button class="btn secondary" @click="togglePause" :disabled="!running">{{ paused ? 'Resume' : 'Pause' }}</button>
        <button class="btn ghost" @click="reset">Reset</button>
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
      <p class="muted">How do you feel after this practice?</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <textarea class="input" rows="3" v-model="note" maxlength="200" placeholder="e.g., Feel calmer and more focused."></textarea>
        <button class="btn" @click="saveNote" :disabled="!note.trim()">Save Note</button>
      </div>
      <p v-if="saved" class="muted" style="margin-top:6px;">Saved!</p>
    </div>

    <!-- History -->
    <div class="card">
      <h3>Session History</h3>
      <p class="muted">Stored locally on this device.</p>
      <div class="grid cards">
        <article v-for="s in history" :key="s.id" class="card">
          <h3>{{ s.name }}</h3>
          <p class="muted">{{ s.date }}</p>
          <p>Breaths: {{ s.breaths }} • Duration: {{ s.duration }}</p>
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
type Session = { id:string; name:string; date:string; breaths:number; duration:string; note?:string }

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
const phaseProgress = ref(0) // 0 ~ 1
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

function applyPreset() {
  if (presetKey.value !== 'custom') {
    const p = presets[presetKey.value]
    inhale.value = p.inhale
    hold.value = p.hold
    exhale.value = p.exhale
  }
}

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
  if (!paused.value) {
    tickPrev = performance.now()
    rafId = requestAnimationFrame(tick)
  }
}

function reset() {
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
   
    if (elapsedMs.value >= totalMs.value) {
      finishSession()
      return
    }
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
 
  const name = presetKey.value === 'custom'
    ? `Custom ${inhale.value}-${hold.value}-${exhale.value}`
    : presets[presetKey.value].name
  const d = new Date()
  const record: Session = {
    id: crypto.randomUUID(),
    name,
    date: d.toLocaleString(),
    breaths: breaths.value,
    duration: msPretty(elapsedMs.value)
  }
  history.value.unshift(record)
  localStorage.setItem('mind_sessions', JSON.stringify(history.value))
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
const leftPretty = computed(() => {
  const left = Math.max(0, totalMs.value - elapsedMs.value)
  return msPretty(left)
})

function saveNote() {
  const t = note.value.trim()
  if (!t) return
  saved.value = true

  if (history.value.length) {
    history.value[0].note = t
    localStorage.setItem('mind_sessions', JSON.stringify(history.value))
  }
  setTimeout(() => (saved.value = false), 1000)
  note.value = ''
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('mind_sessions')
}

onMounted(() => applyPreset())
onBeforeUnmount(() => cancelAnimationFrame(rafId))
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
