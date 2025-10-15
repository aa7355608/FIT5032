<template>
  <section class="grid" style="gap:16px; max-width:1100px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <h2>Need Help?</h2>
      <p class="muted">You’re not alone. Pick what you need right now — immediate support, quick answers, or evidence-based resources.</p>
    </div>

    <!-- 1) Crisis / Emergency -->
    <div class="card" style="border-left: 6px solid #ef4444;">
      <div class="row" style="justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <div>
          <h3 style="margin:0;">Immediate Support (Australia)</h3>
          <p class="muted" style="margin:.25rem 0 0 0;">
            <span v-if="isNight">It’s late — 24/7 lines are available now.</span>
            <span v-else>24/7 phone support. If you’re in danger, call 000.</span>
          </p>
        </div>
        <a class="btn" href="tel:000" aria-label="Call 000 Emergency">🚨 Call 000</a>
      </div>

      <div class="grid" style="gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:10px;">
        <article class="card">
          <h4 style="margin:0;">Lifeline</h4>
          <p class="muted" style="margin:.25rem 0 8px 0;">Crisis support & suicide prevention</p>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <a class="btn" href="tel:131114">📞 13 11 14</a>
            <a class="btn ghost" href="https://www.lifeline.org.au/" target="_blank" rel="noopener">Website</a>
          </div>
        </article>

        <article class="card">
          <h4 style="margin:0;">Beyond Blue</h4>
          <p class="muted" style="margin:.25rem 0 8px 0;">Anxiety & depression support</p>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <a class="btn" href="tel:1300224636">📞 1300 22 4636</a>
            <a class="btn ghost" href="https://www.beyondblue.org.au/" target="_blank" rel="noopener">Website</a>
          </div>
        </article>

        <article class="card">
          <h4 style="margin:0;">Kids Helpline</h4>
          <p class="muted" style="margin:.25rem 0 8px 0;">For ages 5–25 (youth-specific)</p>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <a class="btn" href="tel:1800551800">📞 1800 55 1800</a>
            <a class="btn ghost" href="https://kidshelpline.com.au/" target="_blank" rel="noopener">Website</a>
          </div>
        </article>
      </div>
      <p class="muted" style="margin-top:10px;">If you’re outside Australia, contact your local emergency number.</p>
    </div>

    <!-- 2) FAQ / Quick Answers -->
    <div class="card">
      <div class="row" style="gap:10px; align-items:center; flex-wrap:wrap;">
        <h3 style="margin:0;">Quick Answers</h3>
        <div class="spacer"></div>
        <label style="min-width:260px;">
          Search FAQ
          <input class="input" v-model.trim="faqQuery" placeholder="sleep, anxiety, study..." aria-label="Search FAQs" />
        </label>
      </div>

      <div v-if="!filteredFaqs.length" class="card" style="margin-top:10px;">
        <p class="muted" style="margin:0;">No results. Try another keyword.</p>
      </div>

      <div class="grid" style="gap:10px; margin-top:10px;">
        <details v-for="f in filteredFaqs" :key="f.id" class="card">
          <summary style="cursor:pointer; font-weight:600;">{{ f.q }}</summary>
          <div style="margin-top:8px;">
            <p style="white-space:pre-wrap; margin:0 0 6px 0;">{{ f.a }}</p>
            <div class="row" style="gap:6px; flex-wrap:wrap;">
              <span class="tag" v-for="t in f.tags" :key="t">{{ t }}</span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- 4) Curated Resources -->
    <div class="card">
      <div class="row" style="gap:10px; align-items:center; flex-wrap:wrap;">
        <h3 style="margin:0;">Helpful Resources</h3>
        <router-link class="btn ghost" to="/resources">Open Full Library</router-link>
      </div>

      <div class="grid" style="gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:10px;">
        <article v-for="r in curated" :key="r.id" class="card" style="display:flex; flex-direction:column; gap:8px;">
          <h4 style="margin:0;">{{ r.title }}</h4>
          <p class="muted" style="margin:0;">{{ r.subtitle }}</p>
          <div class="row" style="gap:6px; flex-wrap:wrap;">
            <span class="tag" v-for="t in r.tags" :key="t">{{ t }}</span>
          </div>
          <div class="row" style="gap:8px; margin-top:auto; flex-wrap:wrap;">
            <router-link v-if="r.to" class="btn" :to="r.to">Open</router-link>
            <a v-else class="btn" :href="r.url" target="_blank" rel="noopener">Open</a>
            <button class="btn ghost" @click="togglePin(r.id)">{{ isPinned(r.id) ? '★ Pinned' : '☆ Pin' }}</button>
          </div>
        </article>
      </div>

      <div v-if="pinnedItems.length" class="card" style="margin-top:10px;">
        <h4 style="margin:0;">My Pinned</h4>
        <div class="grid" style="gap:10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top:10px;">
          <article v-for="r in pinnedItems" :key="r.id" class="card">
            <h4 style="margin:0;">{{ r.title }}</h4>
            <p class="muted" style="margin:0 0 8px 0;">{{ r.subtitle }}</p>
            <div class="row" style="gap:8px; flex-wrap:wrap;">
              <router-link v-if="r.to" class="btn" :to="r.to">Open</router-link>
              <a v-else class="btn" :href="r.url" target="_blank" rel="noopener">Open</a>
              <button class="btn ghost" @click="togglePin(r.id)">Unpin</button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// -------- 1) Crisis: day/night hint --------
const hour = new Date().getHours()
const isNight = hour >= 20 || hour < 7

// -------- 2) FAQ data & search --------
type Faq = { id: string, q: string, a: string, tags: string[] }
const faqs = ref<Faq[]>([
  { id:'f1', q:'How to calm exam anxiety quickly?', a:'Try a 2–3 minute breathing cycle (inhale 4s, hold 4s, exhale 4s) and grounding 5-4-3-2-1. Break tasks into 25-minute blocks (Pomodoro).', tags:['anxiety','exam','breathing'] },
  { id:'f2', q:'I can’t sleep — what helps tonight?', a:'Avoid screens 60 minutes before bed, keep lights warm/dim, try a 5-minute body scan, keep the room cool and dark. If you wake up, do quiet reading until sleepy.', tags:['sleep','routine'] },
  { id:'f3', q:'Feeling low — how do I get unstuck?', a:'Do one tiny action (shower, short walk, hydrate). Message a trusted friend. Plan a 10-minute pleasant activity. If thoughts feel unsafe, call a crisis line above.', tags:['mood','depression','support'] },
  { id:'f4', q:'How to help a friend who is struggling?', a:'Listen without fixing, validate feelings, avoid judgement, ask what would help right now, offer to go together to support services.', tags:['peer','support','listen'] }
])
const faqQuery = ref('')
const filteredFaqs = computed(() => {
  const q = faqQuery.value.trim().toLowerCase()
  if (!q) return faqs.value
  return faqs.value.filter(f =>
    f.q.toLowerCase().includes(q) ||
    f.a.toLowerCase().includes(q) ||
    f.tags.some(t => t.includes(q))
  )
})

// -------- 4) Curated resource shortcuts --------
type Curated = { id: string, title: string, subtitle: string, tags: string[], url?: string, to?: string }
const curated = ref<Curated[]>([
  { id:'c1', title:'2-min Calm Breathing', subtitle:'Quick guided breathing to reset.', tags:['exercise','anxiety'], to:'/mindfulness' },
  { id:'c2', title:'Sleep Hygiene Basics', subtitle:'Set your evening routine tonight.', tags:['sleep','routine'], to:'/resources' },
  { id:'c3', title:'Grounding 5-4-3-2-1', subtitle:'Reduce panic via senses.', tags:['panic','grounding'], to:'/mindfulness' },
  { id:'c4', title:'Beyond Blue — Learn', subtitle:'Evidence-based articles.', tags:['learn','external'], url:'https://www.beyondblue.org.au/' }
])

// Pin (persist locally)
const PIN_KEY = 'help_pins'
const pins = ref<string[]>(JSON.parse(localStorage.getItem(PIN_KEY) || '[]'))
const savePins = () => localStorage.setItem(PIN_KEY, JSON.stringify(pins.value))
const isPinned = (id: string) => pins.value.includes(id)
const togglePin = (id: string) => {
  if (isPinned(id)) pins.value = pins.value.filter(x => x !== id)
  else pins.value.unshift(id)
  savePins()
}
const pinnedItems = computed(() => pins.value.map(id => curated.value.find(r => r.id===id)).filter(Boolean) as Curated[])
</script>

<style scoped>
.muted { color:#9fb6cc; }
.tag {
  display:inline-block; padding:2px 8px; border-radius:999px;
  background:#e9f2ff; color:#1e40af; font-size:12px; border:1px solid #cfe3ff;
}
</style>
