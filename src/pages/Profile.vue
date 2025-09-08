<template>
  <section class="grid" style="gap:16px; max-width:760px;">
    <div class="card">
      <h2>Profile & Settings</h2>
      <p class="muted">Manage basic preferences (client-side demo).</p>
    </div>

    <div class="card">
      <label>Display Name</label>
      <input v-model="displayName" class="input" maxlength="40" placeholder="Your name" />
      <div class="form-group" style="margin-top:12px;">
        <label>Notifications</label>
        <select v-model="notify" class="input">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="off">Off</option>
        </select>
      </div>
      <button class="btn" @click="save">Save</button>
      <p class="muted" v-if="saved" style="margin-top:8px;">Saved!</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const displayName = ref(localStorage.getItem('displayName') || '')
const notify = ref(localStorage.getItem('notify') || 'daily')
const saved = ref(false)
const save = () => {
  localStorage.setItem('displayName', displayName.value.trim())
  localStorage.setItem('notify', String(notify.value))
  saved.value = true
  setTimeout(() => (saved.value = false), 1200)
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
