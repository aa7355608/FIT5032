<template>
  <div class="app">
    <NavBar />
    <a href="#main" class="visually-hidden-focusable">Skip to content</a>
<main id="main" class="container"> <!-- already present -->

    <main class="container">
      <router-view />
    </main>
    <footer class="footer">© 2025 Youth Wellbeing</footer>
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>
