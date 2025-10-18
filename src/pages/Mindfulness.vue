<template>
  <section class="grid" style="gap:16px; max-width:1200px; margin-inline:auto;">
    <div class="card">
      <h2>Mindfulness & Exercises</h2>
      <p class="muted">Breathing presets, custom timings, visual guide, countdown, chime, session history, and inline charts.</p>
    </div>

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

    <div class="card" style="text-align:center;">
      <BreathCircle :phase="phase" :remaining="phaseRemaining" :progress="phaseProgress" />
      <div class="row" style="gap:16px; justify-content:center; margin-top:12px;">
        <span class="muted">Breaths: <b>{{ breaths }}</b></span>
        <span class="muted">Elapsed: <b>{{ elapsedPretty }}</b></span>
        <span class="muted">Left: <b>{{ leftPretty }}</b></span>
      </div>
    </div>

    <div class="card">
      <h3>Quick Reflection (optional)</h3>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <textarea class="input" rows="3" v-model="note" maxlength="200" placeholder="e.g., Feel calmer and more focused."></textarea>
        <button class="btn" @click="saveNote" :disabled="!history.length || !note.trim()">Save Note</button>
      </div>
      <p v-if="saved" class="muted" style="margin-top:6px;">Saved!</p>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h3 style="margin:0;">Insights</h3>
        <span class="muted small">Charts update automatically when sessions are saved.</span>
      </div>

      <div v-if="sessionsForCharts.length === 0" class="card" style="margin-top:8px;">
        <p class="muted" style="margin:0;">No data yet. Finish a session to see charts.</p>
      </div>

      <template v-else>
        <div class="card" style="margin-top:8px;">
          <div class="row" style="justify-content:space-between; align-items:center;">
            <h4 style="margin:0;">Last 30 Days — Minutes per Day</h4>
            <span class="muted small">Hover points</span>
          </div>
          <div class="chart-wrap">
            <svg :viewBox="`0 0 ${vw} ${vh}`" class="chart-svg" @mouseleave="tooltip.show = false">
              <defs>
                <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-opacity="0.25"/>
                  <stop offset="100%" stop-opacity="0"/>
                </linearGradient>
              </defs>

              <line :x1="pad" :y1="pad" :x2="pad" :y2="vh-pad" class="axis"/>
              <line :x1="pad" :y1="vh-pad" :x2="vw-pad" :y2="vh-pad" class="axis"/>

              <template v-for="(g, gi) in yTicks" :key="'gy'+gi">
                <line :x1="pad" :x2="vw-pad" :y1="yScale(g)" :y2="yScale(g)" class="grid"/>
                <text :x="pad-6" :y="yScale(g)+4" class="tick" text-anchor="end">{{ g }}</text>
              </template>

              <template v-for="(d, i) in d30" :key="'dx'+i">
                <text v-if="i % tickEvery === 0" :x="xScale(i)" :y="vh-pad+14" class="tick" text-anchor="middle">
                  {{ shortDate(d.dayTs) }}
                </text>
              </template>

              <path :d="linePath" class="line"/>
              <path :d="areaPath" class="area" fill="url(#gradFill)"/>

              <g v-for="(d,i) in d30" :key="'pt'+i">
                <circle
                  :cx="xScale(i)"
                  :cy="yScale(d.minutes)"
                  r="3.5"
                  class="point"
                  @mouseenter="showTip(xScale(i), yScale(d.minutes), `${fmtDate(d.dayTs)} • ${d.minutes} min`)"
                />
              </g>

              <foreignObject v-if="tooltip.show" :x="tooltip.x+8" :y="tooltip.y-28" width="200" height="30">
                <div class="tip">{{ tooltip.text }}</div>
              </foreignObject>
            </svg>
          </div>
        </div>

        <div class="card" style="margin-top:8px;">
          <div class="row" style="justify-content:space-between; align-items:center;">
            <h4 style="margin:0;">Minutes by Weekday</h4>
            <span class="muted small">Hover bars</span>
          </div>
          <div class="chart-wrap">
            <svg :viewBox="`0 0 ${vw} ${vh}`" class="chart-svg" @mouseleave="tooltip.show = false">
              <line :x1="pad" :y1="pad" :x2="pad" :y2="vh-pad" class="axis"/>
              <line :x1="pad" :y1="vh-pad" :x2="vw-pad" :y2="vh-pad" class="axis"/>

              <template v-for="(g, gi) in yTicksBar" :key="'bgy'+gi">
                <line :x1="pad" :x2="vw-pad" :y1="yScaleBar(g)" :y2="yScaleBar(g)" class="grid"/>
                <text :x="pad-6" :y="yScaleBar(g)+4" class="tick" text-anchor="end">{{ g }}</text>
              </template>

              <g v-for="(b, i) in byWeekday" :key="'bar'+i">
                <rect
                  :x="xBand(i)"
                  :y="yScaleBar(b.minutes)"
                  :width="bandWidth"
                  :height="Math.max(0, vh-pad - yScaleBar(b.minutes))"
                  class="bar-rect"
                  @mouseenter="showTip(xBand(i)+bandWidth/2, yScaleBar(b.minutes), `${b.label}: ${b.minutes} min`)"
                />
                <text :x="xBand(i)+bandWidth/2" :y="vh-pad+14" class="tick" text-anchor="middle">{{ b.label }}</text>
              </g>

              <foreignObject v-if="tooltip.show" :x="tooltip.x+8" :y="tooltip.y-28" width="200" height="30">
                <div class="tip">{{ tooltip.text }}</div>
              </foreignObject>
            </svg>
          </div>
        </div>

        <div class="card" style="margin-top:8px;">
          <div class="row" style="justify-content:space-between; align-items:center;">
            <h4 style="margin:0;">Sessions by Type</h4>
            <span class="muted small">Hover slices</span>
          </div>
          <div class="chart-wrap">
            <svg :viewBox="`0 0 360 220`" class="chart-svg" @mouseleave="tooltip.show = false">
              <template v-if="isFullDonut">
                <g transform="translate(110,110)">
                  <circle cx="0" cy="0" r="80" :fill="palette(0)"/>
                  <circle cx="0" cy="0" r="50" fill="#fff"/>
                </g>
                <g transform="translate(230,40)">
                  <rect width="12" height="12" :fill="palette(0)"/>
                  <text x="18" y="10" class="tick">{{ typeCounts[0].label }} (100%)</text>
                </g>
              </template>

              <template v-else>
                <g transform="translate(110,110)">
                  <template v-for="(s, i) in donutArcs" :key="'arc'+i">
                    <path
                      :d="describeDonut(0,0,80,50, s.start, s.end)"
                      class="donut-slice"
                      :fill="palette(i)"
                      :style="{ opacity: 0.95 }"
                      @mouseenter="showTip(120, 20, `${s.label}: ${s.value} (${s.pct.toFixed(0)}%)`)"
                    />
                  </template>
                  <circle cx="0" cy="0" r="50" fill="#fff"/>
                </g>

                <g transform="translate(230,40)">
                  <template v-for="(s, i) in donutArcs" :key="'leg'+i">
                    <rect :y="i*22" width="12" height="12" :fill="palette(i)"/>
                    <text :y="i*22 + 10" x="18" class="tick">{{ s.label }}</text>
                  </template>
                </g>
              </template>

              <foreignObject v-if="tooltip.show" :x="tooltip.x" :y="tooltip.y" width="200" height="30">
                <div class="tip">{{ tooltip.text }}</div>
              </foreignObject>
            </svg>
          </div>
        </div>
      </template>
    </div>

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
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import BreathCircle from '@/components/BreathCircle.vue'

type Phase = 'inhale'|'hold'|'exhale'|'idle'
type Status = 'completed'|'aborted'
type Session = {
  id: string
  ts: number
  name: string
  date: string
  breaths: number
  duration: string
  durationMs: number
  pattern: string
  target: string
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
const history = ref<Session[]>(parseSessions(localStorage.getItem('mind_sessions')))

let rafId = 0
let tickPrev = 0
let phaseTotal = 0

function parseSessions(raw: string | null): Session[] {
  try {
    const arr = JSON.parse(raw || '[]') as any[]
    return arr.map((s, i) => {
      const ts = typeof s.ts === 'number' ? s.ts : Date.parse(s.date || '') || Date.now()
      const durationMs = typeof s.durationMs === 'number' ? s.durationMs : parseDurationString(s.duration || '0:00')
      return {
        id: s.id || `s_${i}_${ts}`,
        ts,
        name: s.name || 'Practice',
        date: s.date || new Date(ts).toLocaleString(),
        breaths: Number(s.breaths) || 0,
        duration: s.duration || msPretty(durationMs),
        durationMs,
        pattern: s.pattern || '',
        target: s.target || '',
        chime: !!s.chime,
        status: (s.status === 'completed' ? 'completed' : 'aborted') as Status,
        note: s.note || ''
      }
    }).sort((a,b) => b.ts - a.ts)
  } catch { return [] }
}

function persistHistory() {
  localStorage.setItem('mind_sessions', JSON.stringify(history.value))
  window.dispatchEvent(new Event('sessions-updated'))
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
  const d = new Date()
  const name = presetKey.value === 'custom' ? `Custom ${patternStr()}` : presets[presetKey.value].name
  const record: Session = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    name,
    date: d.toLocaleString(),
    breaths: breaths.value,
    duration: msPretty(elapsedMs.value),
    durationMs: elapsedMs.value,
    pattern: patternStr(),
    target: targetStr(),
    chime: chime.value,
    status
  }
  history.value.unshift(record)
  persistHistory()
}

function endAndSave() {
  running.value = false
  paused.value = false
  phase.value = 'idle'
  phaseRemaining.value = 0
  phaseProgress.value = 0
  cancelAnimationFrame(rafId)
  saveSession('completed')
}

function reset() {
  saveSession('aborted')
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
  saveSession('completed')
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

function parseDurationString(s: string): number {
  const m = String(s || '').match(/^(\d+):([0-5]\d)$/)
  if (!m) return 0
  return Number(m[1]) * 60_000 + Number(m[2]) * 1000
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
  window.dispatchEvent(new Event('sessions-updated'))
}

function autoSaveOnLeave() {
  saveSession('aborted')
}

onMounted(() => {
  applyPreset()
  window.addEventListener('beforeunload', autoSaveOnLeave)
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === 'mind_sessions') {
      history.value = parseSessions(localStorage.getItem('mind_sessions'))
    }
  }
  window.addEventListener('storage', onStorage)
  const onCustom = () => { history.value = parseSessions(localStorage.getItem('mind_sessions')) }
  window.addEventListener('sessions-updated', onCustom)
  cleanupFns.push(() => window.removeEventListener('beforeunload', autoSaveOnLeave))
  cleanupFns.push(() => window.removeEventListener('storage', onStorage))
  cleanupFns.push(() => window.removeEventListener('sessions-updated', onCustom))
})
const cleanupFns: Array<() => void> = []
onBeforeUnmount(() => {
  cleanupFns.forEach(fn => fn())
  autoSaveOnLeave()
})

const vw = 800
const vh = 300
const pad = 40
function startOfDay(ts: number){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime() }

const sessionsForCharts = computed(() => {
  return history.value
    .map(s => ({ ts: s.ts, durationMs: s.durationMs, type: 'mindfulness', name: s.name, pattern: s.pattern }))
    .filter(s => typeof s.ts === 'number' && typeof s.durationMs === 'number')
})

const now0 = computed(() => startOfDay(Date.now()))
const days = 30

const d30 = computed(() => {
  const arr: { dayTs: number; minutes: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dayTs = now0.value - i*24*60*60*1000
    const minutes = sessionsForCharts.value
      .filter(s => startOfDay(s.ts) === dayTs)
      .reduce((a,s)=> a + Math.round(s.durationMs/60000), 0)
    arr.push({ dayTs, minutes })
  }
  return arr
})

const maxY = computed(() => Math.max(30, ...d30.value.map(d => d.minutes)))
const yTicks = computed(() => {
  const step = Math.ceil(maxY.value / 4)
  return [0, step, step*2, step*3, step*4]
})
const tickEvery = 5

function xScale(i: number){ const w = vw - pad*2; return pad + (i/(days-1))*w }
function yScale(v: number){ const h = vh - pad*2; const r = (v / Math.max(1,maxY.value)); return (vh - pad) - r*h }

const linePath = computed(() => {
  if (!d30.value.length) return ''
  return d30.value.map((d, i) => `${i===0?'M':'L'} ${xScale(i)},${yScale(d.minutes)}`).join(' ')
})
const areaPath = computed(() => {
  if (!d30.value.length) return ''
  const first = `M ${xScale(0)},${yScale(d30.value[0].minutes)}`
  const lines = d30.value.map((d,i)=> `L ${xScale(i)},${yScale(d.minutes)}`).join(' ')
  const close = `L ${xScale(days-1)},${vh-pad} L ${xScale(0)},${vh-pad} Z`
  return [first, lines, close].join(' ')
})

const byWeekday = computed(() => {
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const sums = new Array(7).fill(0)
  for (const s of sessionsForCharts.value) {
    const d = new Date(s.ts).getDay()
    sums[d] += Math.round(s.durationMs/60000)
  }
  return labels.map((l,i)=> ({ label:l, minutes:sums[i] }))
})
const maxBar = computed(()=> Math.max(30, ...byWeekday.value.map(b=>b.minutes)))
const yTicksBar = computed(()=> {
  const step = Math.ceil(maxBar.value/4)
  return [0, step, step*2, step*3, step*4]
})
function yScaleBar(v: number){ const h = vh - pad*2; const r = (v / Math.max(1,maxBar.value)); return (vh - pad) - r*h }
const bandWidth = 50
function xBand(i: number){ const total = vw - pad*2; const gap = (total - bandWidth*7)/6; return pad + i*(bandWidth+gap) }

function typeLabelFromSessionName(name: string, pattern: string): string {
  if (!name) return 'Mindfulness'
  if (name.startsWith('Box')) return 'Box'
  if (name.startsWith('4-7-8')) return '4-7-8'
  if (name.startsWith('Coherence')) return 'Coherence'
  if (name.startsWith('Custom')) return pattern ? `Custom ${pattern}` : 'Custom'
  return 'Mindfulness'
}

const typeCounts = computed(() => {
  const map = new Map<string, number>()
  for (const s of history.value) {
    const key = typeLabelFromSessionName(String(s.name || ''), String(s.pattern || ''))
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
})

const donutArcs = computed(() => {
  const total = typeCounts.value.reduce((a, x) => a + x.value, 0)
  if (!total) return []
  let angle = 0
  return typeCounts.value.map((seg, i) => {
    const sweep = (seg.value / total) * 360
    const start = angle
    let end = angle + sweep
    if (end - start >= 360) end = start + 359.999
    angle = end
    return { ...seg, start, end, pct: (seg.value / total) * 100, i }
  })
})

const isFullDonut = computed(() => typeCounts.value.length === 1 && donutArcs.value.length === 1 && Math.abs(donutArcs.value[0].pct - 100) < 0.001)

function polarToCartesian(cx:number, cy:number, r:number, deg:number){
  const rad = (deg-90) * Math.PI/180
  return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) }
}
function describeDonut(cx:number, cy:number, rOuter:number, rInner:number, start:number, end:number){
  const large = (end - start) > 180 ? 1 : 0
  const sOuter = polarToCartesian(cx, cy, rOuter, end)
  const eOuter = polarToCartesian(cx, cy, rOuter, start)
  const sInner = polarToCartesian(cx, cy, rInner, start)
  const eInner = polarToCartesian(cx, cy, rInner, end)
  return [
    'M', sOuter.x, sOuter.y,
    'A', rOuter, rOuter, 0, large, 0, eOuter.x, eOuter.y,
    'L', sInner.x, sInner.y,
    'A', rInner, rInner, 0, large, 1, eInner.x, eInner.y,
    'Z'
  ].join(' ')
}

function palette(i:number){
  const hue = (i * 57) % 360
  return `hsl(${hue} 65% 50%)`
}

function shortDate(ts:number){
  const d = new Date(ts)
  const m = d.toLocaleDateString(undefined, { month:'short' })
  const dd = d.getDate()
  return `${m} ${dd}`
}
function fmtDate(ts:number){
  return new Date(ts).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })
}

const tooltip = ref<{show:boolean; x:number; y:number; text:string}>({ show:false, x:0, y:0, text:'' })
function showTip(x:number, y:number, text:string){
  tooltip.value = { show: true, x, y, text }
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
.small { font-size:12px; }
.chart-wrap { width:100%; overflow-x:auto; }
.chart-svg { width:100%; height:auto; display:block; }
.axis { stroke:#cbd5e1; stroke-width:1; }
.grid { stroke:#e5e7eb; stroke-width:1; }
.tick { fill:#64748b; font-size:12px; }
.line { fill:none; stroke:#2563eb; stroke-width:2; }
.area { stroke:none; fill:#2563eb; }
.point { fill:#2563eb; cursor:pointer; }
.bar-rect { fill:#2563eb; opacity:.9; cursor:pointer; }
.donut-slice { cursor:pointer; }
.legend-box { fill:#2563eb; }
.tip {
  background: #111827; color:#fff; font-size:12px; padding:4px 8px;
  border-radius:6px; pointer-events:none; white-space:nowrap;
}
</style>
