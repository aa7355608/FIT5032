<template>
  <section class="grid" style="gap:16px; max-width:820px;">
    <div class="card">
      <h2>Community Forum (Demo)</h2>
      <p class="muted">Anonymous posting demo — client-side only.</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <input v-model="title" class="input" placeholder="Topic title (max 60)" maxlength="60" />
        <button class="btn" :disabled="!title.trim()" @click="post">Post</button>
      </div>
    </div>

    <div class="grid">
      <article v-for="(t, i) in topics" :key="i" class="card">
        <h3>{{ t.title }}</h3>
        <p class="muted">#{{ i + 1 }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const title = ref('')
const topics = ref<string[]>(JSON.parse(localStorage.getItem('topics') || '[]'))

const post = () => {
  const v = title.value.trim()
  if (!v) return
  topics.value.unshift(v)
  localStorage.setItem('topics', JSON.stringify(topics.value))
  title.value = ''
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
