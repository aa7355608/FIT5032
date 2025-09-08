<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Hello, {{ auth.user?.email }}</h2>
      <p class="muted">Quick links & your weekly wellbeing overview.</p>
    </div>

    <div class="card">
      <h3>Mood Overview</h3>
      <p class="muted">Demo placeholder – plug your chart lib later.</p>
      <div class="row">
        <StarRating :avg="reviews.average" :count="reviews.count" />
        <router-link class="btn secondary" to="/reviews">Write a Review</router-link>
      </div>
    </div>

    <div class="grid cards">
      <router-link to="/mood" class="card" style="display:block;">
        <h3>Mood Tracker</h3><p>Log & view trends</p>
      </router-link>
      <router-link to="/mindfulness" class="card" style="display:block;">
        <h3>Breathing / Meditation</h3><p>2–5 min calm sessions</p>
      </router-link>
      <router-link to="/resources" class="card" style="display:block;">
        <h3>Sleep Routine</h3><p>Wind-down checklist</p>
      </router-link>
      <router-link to="/community" class="card" style="display:block;">
        <h3>Community</h3><p>Anonymous tips from peers</p>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useReviewsStore } from '@/store/reviews'
import StarRating from '@/components/StarRating.vue'
const auth = useAuthStore()
const reviews = useReviewsStore()
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
