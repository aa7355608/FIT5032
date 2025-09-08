<template>
  <section class="grid" style="gap:16px; max-width:760px;">
    <div class="card">
      <h2>Mindfulness & Exercises</h2>
      <p class="muted">Quick calm practices you can use anytime.</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <button class="btn" @click="start('Breathing 4-4-4')">Breathing 4-4-4</button>
        <button class="btn" @click="start('Box Breathing 4-4-4-4')">Box Breathing</button>
        <button class="btn" @click="start('Body Scan 2 min')">Body Scan</button>
      </div>
    </div>

    <div v-if="current" class="card">
      <h3>{{ current }}</h3>
      <p class="muted">Follow on-screen prompts. This is a simple demo; you can replace with audio later.</p>
      <ol>
        <li v-for="(step, i) in steps" :key="i">{{ step }}</li>
      </ol>
      <button class="btn secondary" @click="current=''">Done</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const current = ref('')
const steps = ref<string[]>([])
const start = (mode: string) => {
  current.value = mode
  steps.value = [
    'Sit comfortably and relax your shoulders.',
    'Inhale through nose (4s).',
    'Hold (4s).',
    'Exhale through mouth (4s).',
    'Repeat for 5 cycles.'
  ]
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
