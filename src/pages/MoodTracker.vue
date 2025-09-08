<template>
  <section class="grid" style="gap:16px; max-width:760px;">
    <div class="card">
      <h2>Mood Tracker</h2>
      <p class="muted">Daily mood check-in with notes & tags.</p>
    </div>

    <div class="card">
      <label>Mood (1=low, 5=high)</label>
      <select v-model="mood" class="input">
        <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
      </select>
      <div class="form-group" style="margin-top:12px;">
        <label>Notes (optional)</label>
        <textarea v-model="notes" class="input" rows="4" maxlength="200" placeholder="What influenced your mood today?"></textarea>
      </div>
      <button class="btn" @click="save" :disabled="saving">{{ saving ? 'Saving…' : 'Save Check-in' }}</button>
    </div>

    <div class="card">
      <h3>History (session-only demo)</h3>
      <ul>
        <li v-for="(item, i) in history" :key="i">Mood {{ item.mood }} — {{ item.notes || 'No notes' }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const mood = ref(3)
const notes = ref('')
const saving = ref(false)
const history = ref<{ mood:number; notes:string }[]>(JSON.parse(sessionStorage.getItem('moodHistory') || '[]'))

const save = async () => {
  saving.value = true
  await new Promise(r => setTimeout(r, 200))
  history.value.unshift({ mood: mood.value, notes: notes.value.trim() })
  sessionStorage.setItem('moodHistory', JSON.stringify(history.value))
  notes.value = ''
  saving.value = false
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
