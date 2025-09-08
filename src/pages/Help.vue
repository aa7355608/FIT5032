<template>
  <section class="grid" style="gap:16px; max-width:760px;">
    <div class="card">
      <h2>Help & Crisis Support</h2>
      <p class="muted">If you’re in danger or need urgent help, call 000 in Australia.</p>
    </div>

    <div class="card">
      <h3>24/7 Support</h3>
      <ul>
        <li>Lifeline: 13 11 14</li>
        <li>Kids Helpline: 1800 55 1800</li>
        <li>Beyond Blue: 1300 22 4636</li>
      </ul>
      <router-link class="btn secondary" to="/resources" style="margin-top:12px; display:inline-block;">Read coping guides</router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
