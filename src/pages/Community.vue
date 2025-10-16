<template>
  <section class="grid" style="gap:16px; max-width:1100px; margin-inline:auto;">
    <!-- Header -->
    <div class="card">
      <h2 style="margin:0;">Community</h2>
      <p class="muted" style="margin:.25rem 0 0 0;">Share reflections, tips, or motivation with others. Posts are stored locally on this device.</p>
    </div>

    <!-- Create Post -->
    <div class="card">
      <h3 style="margin:0;">Create a Post</h3>
      <div class="grid" style="gap:10px; margin-top:8px;">
        <label>Title
          <input class="input" v-model.trim="newPost.title" placeholder="What's on your mind?" />
        </label>
        <label>Content
          <textarea class="input" rows="4" v-model.trim="newPost.content" placeholder="Share your thoughts..."></textarea>
        </label>
        <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <label><input type="checkbox" v-model="newPost.anonymous" /> Post as Anonymous</label>
          <button class="btn" @click="createPost">Post</button>
        </div>
      </div>
    </div>

    <!-- All Posts -->
    <div v-if="posts.length===0" class="card">
      <p class="muted" style="margin:0;">No posts yet. Be the first to share something!</p>
    </div>

    <div v-else class="grid" style="gap:12px;">
      <article v-for="p in posts" :key="p.id" class="card">
        <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <h3 style="margin:0;">{{ p.title }}</h3>
          <span class="muted small">{{ fmt(p.createdAt) }}</span>
        </div>
        <p style="margin:.25rem 0 0 0;">{{ p.content }}</p>
        <p class="muted small" style="margin-top:6px;">By {{ p.author }}</p>

        <!-- Comments -->
        <div v-if="p.comments && p.comments.length" class="card" style="background:#f9fafb; margin-top:8px;">
          <p class="muted small" style="margin:0 0 4px 0;">Comments</p>
          <div v-for="(c,idx) in p.comments" :key="idx" style="border-top:1px solid #e5e7eb; padding-top:4px; margin-top:4px;">
            <p style="margin:0;">{{ c.text }}</p>
            <p class="muted small" style="margin:0;">— {{ c.author }}, {{ fmt(c.createdAt) }}</p>
          </div>
        </div>

        <!-- Add Comment -->
        <div class="row" style="gap:8px; margin-top:10px; flex-wrap:wrap;">
          <input class="input" style="flex:1;" v-model.trim="p.newComment" placeholder="Write a comment..." />
          <button class="btn ghost" @click="addComment(p)">Comment</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()


function getProfileDisplayName(): string {
  const email = auth.user?.email || 'guest'
  const key = `user_profile:${email}`
  try {
    const p = JSON.parse(localStorage.getItem(key) || '{}')
    const name = (p?.name || '').trim()
    return name || 'Anonymous'
  } catch {
    return 'Anonymous'
  }
}


type Comment = { text: string; author: string; createdAt: number }
type Post = {
  id: string
  title: string
  content: string
  author: string
  createdAt: number
  anonymous?: boolean
  comments: Comment[]
  newComment?: string
}

const posts = ref<Post[]>(JSON.parse(localStorage.getItem('community_posts') || '[]'))
const newPost = reactive({ title: '', content: '', anonymous: false })


function fmt(ts: number){
  const d = new Date(ts)
  return d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

function savePosts(){
  localStorage.setItem('community_posts', JSON.stringify(posts.value))
}

function createPost(){
  if (!newPost.title || !newPost.content) {
    alert('Please fill in both title and content.')
    return
  }
  const author = newPost.anonymous ? 'Anonymous' : getProfileDisplayName()

  posts.value.unshift({
    id: String(Date.now()),
    title: newPost.title,
    content: newPost.content,
    author,
    createdAt: Date.now(),
    anonymous: newPost.anonymous,
    comments: []
  })
  savePosts()
  newPost.title = ''
  newPost.content = ''
  newPost.anonymous = false
}

function addComment(p: Post){
  if (!p.newComment) return
  const c: Comment = {
    text: p.newComment,
    author: getProfileDisplayName(),
    createdAt: Date.now()
  }
  p.comments.push(c)
  p.newComment = ''
  savePosts()
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
.small { font-size:12px; }
</style>
