<template>
  <NavBar />
  <a href="#main" class="visually-hidden-focusable">Skip to main content</a>

  <main id="main" class="container">
    <router-view />
  </main>

  <footer>
    <p>© 2025 Youth Wellbeing App — Accessible & Inclusive Design</p>
  </footer>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
</script>
