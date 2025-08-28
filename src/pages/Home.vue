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
      <article v-for="p in list" :key="p.id" class="card">
        <h3>{{ p.name }}</h3>
        <p class="muted">{{ p.category.toUpperCase() }}</p>
        <p>{{ p.summary }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getProducts, type Product } from '@/data/products'
const list = ref<Product[]>([])
onMounted(async () => { list.value = await getProducts() })
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
