<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Resources Library</h2>
      <p class="muted">Evidence-based tips and mini-guides.</p>
    </div>

    <div class="grid cards">
      <router-link to="/mindfulness" class="card" style="display:block;">
        <h3>Breathing for Anxiety</h3><p>Start a 2-minute session</p>
      </router-link>
      <router-link to="/mindfulness" class="card" style="display:block;">
        <h3>Sleep Hygiene</h3><p>Wind-down routine at night</p>
      </router-link>
      <router-link to="/mood" class="card" style="display:block;">
        <h3>Journaling Prompts</h3><p>Track thoughts & patterns</p>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
