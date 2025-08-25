<template>
  <div class="app">
    <NavBar />
    <main class="container">
      <router-view />
    </main>
    <footer class="footer">© 2025 Youth Wellbeing</footer>
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>
