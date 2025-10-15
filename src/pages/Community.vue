<template>
  <section class="grid" style="gap:16px; max-width:1100px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <h2>Community</h2>
      <p class="muted">
        Share tips, questions, and encouragement. You can post anonymously.
        Please be kind and avoid personal information.
      </p>
    </div>

    <!-- Create Post -->
    <div class="card">
      <h3>Create a Post</h3>
      <div class="grid" style="gap:10px;">
        <label>Title
          <input class="input" v-model.trim="newPost.title" maxlength="80" placeholder="Short, clear title" />
        </label>

        <label>Content
          <textarea class="input" rows="4" v-model.trim="newPost.content" maxlength="600"
            placeholder="What helped you? What are you struggling with? (max 600 chars)"></textarea>
        </label>

        <label>Tags (comma separated)
          <input class="input" v-model.trim="newPost.tags" placeholder="e.g. study, anxiety, sleep" />
        </label>

        <div class="row" style="gap:10px; flex-wrap:wrap;">
          <label class="row" style="gap:6px; align-items:center;">
            <input type="checkbox" v-model="newPost.anonymous" /> Post as anonymous
          </label>
          <button class="btn" @click="submitPost" :disabled="submitting">
            {{ submitting ? 'Posting…' : 'Post' }}
          </button>
          <button class="btn ghost" @click="resetForm" :disabled="submitting">Reset</button>
          <span class="muted" v-if="postError">{{ postError }}</span>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="card">
      <div class="row" style="gap:10px; flex-wrap:wrap;">
        <label style="min-width:240px;">Search
          <input class="input" v-model.trim="query" placeholder="search title, content, tags…" />
        </label>

        <label>Tag
          <select class="input" v-model="tag">
            <option value="">All</option>
            <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <label>Sort
          <select class="input" v-model="sortBy">
            <option value="new">Newest</option>
            <option value="top">Top (votes)</option>
          </select>
        </label>

        <div class="spacer"></div>
        <button class="btn ghost" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- List -->
    <div class="grid cards">
      <article v-for="p in paged" :key="p.id" class="card" role="article" :aria-label="p.title">
        <div class="row" style="justify-content:space-between; gap:8px; align-items:flex-start;">
          <div>
            <h3 style="margin:0">{{ p.title }}</h3>
            <p class="muted" style="margin:4px 0 8px 0;">
              by <b>{{ p.author }}</b> • {{ timeAgo(p.createdAt) }} • {{ p.votes }} votes
              <span v-if="p.reports>0" title="reports"> • ⚑ {{ p.reports }}</span>
            </p>
            <p style="white-space:pre-wrap; margin:0" v-html="p.content"></p>
            <div class="row" style="gap:6px; flex-wrap:wrap; margin-top:8px;">
              <span class="tag" v-for="t in p.tags" :key="t">{{ t }}</span>
            </div>
          </div>

          <div class="row" style="gap:6px;">
            <button class="btn ghost" @click="vote(p.id, +1)" :disabled="hasVoted(p.id)" aria-label="Upvote">▲</button>
            <button class="btn ghost" @click="vote(p.id, -1)" :disabled="hasVoted(p.id)" aria-label="Downvote">▼</button>
            <button class="btn secondary" @click="report(p.id)" :disabled="reported.has(p.id)" title="Report">Report</button>
            <button v-if="isAdmin" class="btn ghost" @click="toggleHide(p.id)">{{ hidden.has(p.id) ? 'Unhide' : 'Hide' }}</button>
          </div>
        </div>

        <!-- Comments -->
        <details style="margin-top:10px;">
          <summary>Comments ({{ p.comments.length }})</summary>
          <ul style="list-style:none; padding:0; margin:8px 0 0 0;">
            <li v-for="c in p.comments" :key="c.id" style="border-top:1px solid var(--border); padding-top:8px; margin-top:8px;">
              <p style="margin:0; white-space:pre-wrap;" v-html="c.content"></p>
              <p class="muted" style="margin:4px 0 0 0;">— {{ c.author }} • {{ timeAgo(c.createdAt) }}</p>
            </li>
          </ul>

          <!-- Add comment -->
          <div class="row" style="gap:8px; flex-wrap:wrap; margin-top:8px;">
            <input class="input" v-model.trim="commentDraft[p.id]" :placeholder="`Comment on ${p.title}`" maxlength="300" style="flex:1; min-width:200px;" />
            <button class="btn" @click="addComment(p.id)">Comment</button>
          </div>
        </details>
      </article>

      <div v-if="!paged.length" class="card">
        <p class="muted">No posts match your filters.</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="row" style="gap:8px; justify-content:flex-end;">
      <button class="btn ghost" @click="prev" :disabled="page===1">Prev</button>
      <span class="muted">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn ghost" @click="next" :disabled="page===totalPages">Next</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useAuthStore } from '@/store/auth'
import { sanitizeText } from '@/utils/sanitize'

type Comment = {
  id: string
  content: string   // already sanitized & with newlines preserved
  author: string
  createdAt: number
}
type Post = {
  id: string
  title: string     // sanitized
  content: string   // sanitized & with newlines preserved
  tags: string[]
  author: string
  createdAt: number
  votes: number
  voters: string[]  // ids (local device or user id)
  reports: number
  comments: Comment[]
}

// ---- State & persistence ----
const auth = useAuthStore()
const STORAGE_KEY = 'community_posts'
const HIDDEN_KEY = 'community_hidden'
const REPORTED_KEY = 'community_reported'
const posts = ref<Post[]>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
const hidden = ref<Set<string>>(new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')))
const reported = ref<Set<string>>(new Set(JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]')))

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value)) }
function saveHidden() { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden.value])) }
function saveReported() { localStorage.setItem(REPORTED_KEY, JSON.stringify([...reported.value])) }

// ---- New Post form ----
const newPost = reactive({ title: '', content: '', tags: '', anonymous: true })
const submitting = ref(false)
const postError = ref('')

// simple profanity guard (optional, lightweight)
const blocked = ['shit','fuck','idiot','bitch']

function submitPost() {
  postError.value = ''
  const title = sanitizeText(newPost.title)
  const content = sanitizeText(newPost.content).replace(/\n/g, '<br>')
  const tags = newPost.tags
    .split(',')
    .map(t => sanitizeText(t).toLowerCase())
    .map(t => t.replace(/\s+/g, ''))
    .filter(Boolean)
    .slice(0, 5)

  if (title.length < 4) { postError.value = 'Title too short (≥4 chars).'; return }
  if (content.length < 10) { postError.value = 'Content too short (≥10 chars).'; return }
  if (blocked.some(b => (newPost.title + ' ' + newPost.content).toLowerCase().includes(b))) {
    postError.value = 'Please keep the language respectful.'; return
  }

  submitting.value = true
  const author = newPost.anonymous ? 'Anonymous' : (auth.user?.email || 'Anonymous')
  const p: Post = {
    id: crypto.randomUUID(),
    title, content, tags, author,
    createdAt: Date.now(),
    votes: 0,
    voters: [],
    reports: 0,
    comments: []
  }
  posts.value.unshift(p)
  save()
  resetForm()
  submitting.value = false
}

function resetForm() {
  newPost.title = ''
  newPost.content = ''
  newPost.tags = ''
  newPost.anonymous = true
}

// ---- List / Filters / Sort / Pagination ----
const query = ref('')
const tag = ref('')
const sortBy = ref<'new'|'top'>('new')

const allTags = computed(() => {
  const s = new Set<string>()
  posts.value.forEach(p => p.tags.forEach(t => s.add(t)))
  return Array.from(s).sort()
})

const visible = computed(() =>
  posts.value.filter(p => !hidden.value.has(p.id) && p.reports < 5) // auto-hide when 5+ reports
)

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  return visible.value
    .filter(p => !tag.value || p.tags.includes(tag.value))
    .filter(p => {
      if (!q) return true
      return p.title.toLowerCase().includes(q)
          || p.content.toLowerCase().includes(q)
          || p.tags.some(t => t.includes(q))
          || p.author.toLowerCase().includes(q)
    })
    .sort((a,b) => {
      if (sortBy.value === 'top') return b.votes - a.votes || b.createdAt - a.createdAt
      return b.createdAt - a.createdAt
    })
})

const page = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
watchEffect(() => { page.value = 1 })

function clearFilters() {
  query.value = ''
  tag.value = ''
  sortBy.value = 'new'
}
function prev(){ if (page.value > 1) page.value-- }
function next(){ if (page.value < totalPages.value) page.value++ }

// ---- Interactions ----
const commentDraft = reactive<Record<string, string>>({})

function userKey() {
  // stable id per device/user for voting
  const localId = localStorage.getItem('community_uid') || (() => {
    const id = crypto.randomUUID(); localStorage.setItem('community_uid', id); return id
  })()
  // if logged in, combine with email to avoid duplicate votes across devices
  return (auth.user?.email || 'guest') + '::' + localId
}

function hasVoted(postId: string) {
  const key = userKey()
  const p = posts.value.find(x => x.id === postId)
  return p ? p.voters.includes(key) : false
}

function vote(postId: string, delta: 1 | -1) {
  const key = userKey()
  const p = posts.value.find(x => x.id === postId)
  if (!p || p.voters.includes(key)) return
  p.votes += delta
  p.voters.push(key)
  save()
}

function report(postId: string) {
  const p = posts.value.find(x => x.id === postId)
  if (!p) return
  if (!reported.value.has(postId)) {
    p.reports += 1
    reported.value.add(postId)
    saveReported(); save()
  }
}

const isAdmin = computed(() => auth.user?.role === 'admin')
function toggleHide(postId: string) {
  if (!isAdmin.value) return
  if (hidden.value.has(postId)) hidden.value.delete(postId)
  else hidden.value.add(postId)
  saveHidden()
}

function addComment(postId: string) {
  const raw = (commentDraft[postId] || '').trim()
  if (!raw) return
  const p = posts.value.find(x => x.id === postId)
  if (!p) return
  const c: Comment = {
    id: crypto.randomUUID(),
    content: sanitizeText(raw).replace(/\n/g, '<br>'),
    author: auth.user?.email || 'Guest',
    createdAt: Date.now()
  }
  p.comments.push(c)
  commentDraft[postId] = ''
  save()
}

// ---- Utils ----
function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
.tag {
  display:inline-block; padding:2px 8px; border-radius:999px;
  background:#e9f2ff; color:#1e40af; font-size:12px; border:1px solid #cfe3ff;
}
details > summary { cursor: pointer; }
</style>
