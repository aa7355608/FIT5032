<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Admin</h2>
      <p class="muted">Only admins can see this page. Use it to moderate content or manage data.</p>
    </div>
    <div class="card">
      <h3>Safety Notes</h3>
      <ul>
        <li>Never render unsanitised HTML from users.</li>
        <li>Limit input lengths; validate on client (and server in real app).</li>
        <li>Use HTTP‑only cookies & server hashing in production.</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
