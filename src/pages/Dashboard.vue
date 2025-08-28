<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Hello, {{ auth.user?.email }}</h2>
      <p class="muted">Quick links & your weekly wellbeing overview.</p>
    </div>

    <div class="card">
      <h3>Mood Overview</h3>
      <p class="muted">Demo placeholder – plug your chart lib later.</p>
      <div class="row"><StarRating :avg="reviews.average" :count="reviews.count" /></div>
    </div>

    <div class="grid cards">
      <router-link to="/reviews" class="card">
        <h3>Write a Review</h3><p>Share feedback and rate tools you used.</p>
      </router-link>
      <div class="card"><h3>Breathing</h3><p>2–5 min calm breathing session</p></div>
      <div class="card"><h3>Sleep Routine</h3><p>Wind-down checklist</p></div>
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
