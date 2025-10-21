<template>
  <section class="grid" style="gap:16px; max-width:1100px; margin-inline:auto;">

    <div class="card">
      <h2>Resources Library</h2>
      <p class="muted">
        Evidence-based articles, short videos, and guided exercises.
        Use filters to find what you need and save favorites.
      </p>
    </div>


    <div class="card">
      <div class="row" style="gap:12px; flex-wrap:wrap;">
        <label style="min-width:240px;">
          Search
          <input
            class="input"
            v-model.trim="query"
            placeholder="sleep, anxiety, breathing..."
            aria-label="Search resources"
          />
        </label>

        <label>
          Type
          <select class="input" v-model="type">
            <option value="">All</option>
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="exercise">Exercise</option>
          </select>
        </label>

        <label>
          Duration
          <select class="input" v-model="duration">
            <option value="">Any</option>
            <option value="short">≤ 5 min</option>
            <option value="medium">6–15 min</option>
            <option value="long">16+ min</option>
          </select>
        </label>

        <label>
          Tag
          <select class="input" v-model="tag">
            <option value="">All</option>
            <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <label>
          Sort
          <select class="input" v-model="sortBy">
            <option value="relevance">Relevance</option>
            <option value="title">Title A→Z</option>
            <option value="duration">Duration</option>
          </select>
        </label>
      </div>

      <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn" @click="resetFilters">Reset Filters</button>
      </div>
    </div>


    <div class="grid cards">
      <article
        v-for="r in paged"
        :key="r.id"
        class="card"
        role="article"
        :aria-label="r.title"
        style="display:flex; flex-direction:column; gap:10px;"
      >
        <div class="row" style="justify-content:space-between; gap:8px;">
          <h3 style="margin:0; line-height:1.25;">{{ r.title }}</h3>
          <button
            class="btn ghost"
            @click="toggleFav(r)"
            :aria-label="isFav(r.id) ? 'Remove from favorites' : 'Add to favorites'"
            :title="isFav(r.id) ? 'Remove from favorites' : 'Add to favorites'"
          >
            {{ isFav(r.id) ? '★ Saved' : '☆ Save' }}
          </button>
        </div>

        <p class="muted" style="margin:0;">{{ r.subtitle }}</p>

        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <span class="tag">{{ r.type }}</span>
          <span class="tag">{{ prettyDuration(r.duration) }}</span>
          <span v-for="t in r.tags" :key="t" class="tag">{{ t }}</span>
        </div>

        <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:auto;">
          <button class="btn" @click="openDetails(r)">Details</button>
          <a
            class="btn secondary"
            :href="r.url"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open resource in new tab"
          >Open</a>
          <router-link
            v-if="r.type==='exercise'"
            class="btn ghost"
            to="/mindfulness"
            aria-label="Start guided exercise"
          >Start Exercise</router-link>
        </div>
      </article>
      <div v-if="!paged.length" class="card">
        <p class="muted">No resources match your filters.</p>
      </div>
    </div>


    <div class="row" style="gap:8px; justify-content:flex-end;">
      <button class="btn ghost" @click="prev" :disabled="page===1">Prev</button>
      <span class="muted">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn ghost" @click="next" :disabled="page===totalPages">Next</button>
    </div>


    <div class="card" v-if="favItems.length">
      <h3>My Saved Resources ({{ favorites.length }})</h3>
      <div class="grid cards">
        <article v-for="r in favItems" :key="r.id" class="card">
          <h3 style="margin:0 0 6px 0;">{{ r.title }}</h3>
          <p class="muted" style="margin:0 0 6px 0;">{{ r.subtitle }}</p>
          <div class="row" style="gap:6px; flex-wrap:wrap;">
            <span class="tag">{{ r.type }}</span>
            <span class="tag">{{ prettyDuration(r.duration) }}</span>
            <span v-for="t in r.tags" :key="t" class="tag">{{ t }}</span>
          </div>
          <div class="row" style="gap:8px; margin-top:8px; flex-wrap:wrap;">
            <a class="btn secondary" :href="r.url" target="_blank" rel="noopener">Open</a>
            <button class="btn ghost" @click="removeFav(r.id)">Remove</button>
          </div>
        </article>
      </div>
    </div>


    <dialog ref="dlg" class="modal">
      <form method="dialog" class="card" style="max-width:720px;">
        <h3 style="margin:0 0 6px 0;">{{ active?.title }}</h3>
        <p class="muted" style="margin:0 0 12px 0;">{{ active?.subtitle }}</p>
        <div class="row" style="gap:6px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="tag">{{ active?.type }}</span>
          <span class="tag">{{ prettyDuration(active?.duration || 0) }}</span>
          <span v-for="t in (active?.tags || [])" :key="t" class="tag">{{ t }}</span>
        </div>
        <p v-if="active?.summary">{{ active?.summary }}</p>
        <ul v-if="active?.bullets?.length">
          <li v-for="(b,i) in active?.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <a class="btn" :href="active?.url" target="_blank" rel="noopener">Open</a>
          <router-link v-if="active?.type==='exercise'" to="/mindfulness" class="btn secondary">Start Exercise</router-link>
          <button class="btn ghost" value="cancel">Close</button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'

type RType = 'article'|'video'|'exercise'
type Res = {
  id: string
  title: string
  subtitle: string
  type: RType
  duration: number
  tags: string[]
  url: string
  summary?: string
  bullets?: string[]
}

const resources = ref<Res[]>([
  { id:'r1', title:'2-Min Calm Breathing', subtitle:'Quick guided breathing to reset your nervous system.', type:'exercise', duration:2, tags:['anxiety','breathing','reset'], url:'https://example.com/breathing' },
  { id:'r2', title:'Sleep Hygiene Basics', subtitle:'Practical steps to fall asleep faster and wake refreshed.', type:'article', duration:8, tags:['sleep','routine'], url:'https://example.com/sleep' },
  { id:'r3', title:'Grounding 5-4-3-2-1', subtitle:'A sensory grounding technique to reduce panic.', type:'exercise', duration:3, tags:['panic','grounding','mindfulness'], url:'https://example.com/54321' },
  { id:'r4', title:'Study Break Box Breathing', subtitle:'Use box breathing to refocus during study sessions.', type:'video', duration:5, tags:['study','focus','breathing'], url:'https://example.com/video-box' },
  { id:'r5', title:'Journaling Prompts for Stress', subtitle:'Short prompts to unload thoughts and clarify priorities.', type:'article', duration:10, tags:['journaling','stress'], url:'https://example.com/journal' },
  { id:'r6', title:'Social Support 101', subtitle:'How to ask for help and support a friend.', type:'article', duration:7, tags:['peer','support','communication'], url:'https://example.com/support' },
  { id:'r7', title:'Body Scan (5 min)', subtitle:'Relax tension from head to toe with a guided scan.', type:'exercise', duration:5, tags:['relaxation','body-scan'], url:'https://example.com/bodyscan' },
  { id:'r8', title:'Test Anxiety — What Helps', subtitle:'Short strategies for the week before an exam.', type:'video', duration:6, tags:['exam','anxiety','plan'], url:'https://example.com/test-anxiety' }
])

// Filters
const query = ref('')
const type = ref<RType|''>('')
const duration = ref<''|'short'|'medium'|'long'>('')
const tag = ref('')
const sortBy = ref<'relevance'|'title'|'duration'>('relevance')

const allTags = computed(() => {
  const set = new Set<string>()
  resources.value.forEach(r => r.tags.forEach(t => set.add(t)))
  return Array.from(set).sort()
})

function prettyDuration(mins: number) {
  if (mins <= 5) return '≤5 min'
  if (mins <= 15) return '6–15 min'
  return '16+ min'
}

function score(r: Res) {
  const q = query.value.toLowerCase()
  if (!q) return 0
  let s = 0
  if (r.title.toLowerCase().includes(q)) s += 2
  if (r.subtitle.toLowerCase().includes(q)) s += 1
  if (r.tags.some(t => t.toLowerCase().includes(q))) s += 1
  return -s
}

const filtered = computed(() => {
  return resources.value
    .filter(r => !type.value || r.type === type.value)
    .filter(r => {
      if (!duration.value) return true
      if (duration.value === 'short') return r.duration <= 5
      if (duration.value === 'medium') return r.duration >= 6 && r.duration <= 15
      return r.duration >= 16
    })
    .filter(r => !tag.value || r.tags.includes(tag.value))
    .filter(r => {
      const q = query.value.trim().toLowerCase()
      if (!q) return true
      return r.title.toLowerCase().includes(q)
          || r.subtitle.toLowerCase().includes(q)
          || r.tags.some(t => t.toLowerCase().includes(q))
    })
    .sort((a,b) => {
      if (sortBy.value === 'title') return a.title.localeCompare(b.title)
      if (sortBy.value === 'duration') return a.duration - b.duration
      return score(a) - score(b)
    })
})

// Pagination
const page = ref(1)
const pageSize = 9
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
function prev(){ if (page.value > 1) page.value-- }
function next(){ if (page.value < totalPages.value) page.value++ }
watchEffect(() => { page.value = 1 })

function resetFilters() {
  query.value = ''
  type.value = ''
  duration.value = ''
  tag.value = ''
  sortBy.value = 'relevance'
}

// Favorites
const favorites = ref<string[]>(JSON.parse(localStorage.getItem('favorites') || '[]'))
function saveFavs(){ localStorage.setItem('favorites', JSON.stringify(favorites.value)) }
function isFav(id: string){ return favorites.value.includes(id) }
function toggleFav(r: Res){
  if (isFav(r.id)) favorites.value = favorites.value.filter(x => x !== r.id)
  else favorites.value.unshift(r.id)
  saveFavs()
}
function removeFav(id: string){
  favorites.value = favorites.value.filter(x => x !== id)
  saveFavs()
}
const favItems = computed(() =>
  favorites.value
    .map(id => resources.value.find(r => r.id===id) || null)
    .filter((x): x is Res => !!x)
)

// Details modal
const dlg = ref<HTMLDialogElement|null>(null)
const active = ref<Res|null>(null)
function openDetails(r: Res){
  active.value = r
  dlg.value?.showModal()
}
onMounted(() => {
  dlg.value?.addEventListener('keydown', (e: any) => {
    if (e.key === 'Escape') dlg.value?.close()
  })
})
</script>

<style scoped>
.muted { color:#9fb6cc; }
.tag {
  display:inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e9f2ff;
  color: #1e40af;
  font-size: 12px;
  border: 1px solid #cfe3ff;
}
.modal::backdrop { background: rgba(0,0,0,0.4); }
.modal { border: none; padding: 0; background: transparent; }
</style>
