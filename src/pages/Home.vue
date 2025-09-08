<template>
  <section class="grid" style="gap:20px;">
    <header class="card">
      <h2>Welcome</h2>
      <p class="muted">Practical tools for breathing, sleep, journaling—built for youth.</p>
      <div class="row">
        <router-link class="btn" to="/register">Get Started</router-link>
        <router-link class="btn secondary" to="/reviews">See Reviews</router-link>
      </div>
    </header>

    <div class="grid cards">
      <router-link to="/mood" class="card" style="display:block;">
        <h3>Mood Tracker</h3>
        <p class="muted">Log moods & view trends</p>
      </router-link>

      <router-link to="/mindfulness" class="card" style="display:block;">
        <h3>Mindfulness & Exercises</h3>
        <p class="muted">Breathing, meditation, journaling</p>
      </router-link>

      <router-link to="/resources" class="card" style="display:block;">
        <h3>Resources Library</h3>
        <p class="muted">Articles, videos, guides</p>
      </router-link>

      <router-link to="/community" class="card" style="display:block;">
        <h3>Community Forum</h3>
        <p class="muted">Anonymous peer discussions</p>
      </router-link>

      <router-link to="/dashboard" class="card" style="display:block;">
        <h3>Dashboard</h3>
        <p class="muted">Your personalised hub</p>
      </router-link>

      <router-link to="/help" class="card" style="display:block;">
        <h3>Help & Crisis Support</h3>
        <p class="muted">24/7 lines & FAQs</p>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
