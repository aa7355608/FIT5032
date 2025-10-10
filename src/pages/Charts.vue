<template>
  <section class="card">
    <h2>Mood Trends (from Firestore)</h2>
    <canvas id="moodChart" height="120"></canvas>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, Title, CategoryScale
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'moods'))
  const docs = snapshot.docs.map(d => d.data() as any)
  const labels = docs.map(d => d.day)
  const data = docs.map(d => d.mood)

  new Chart(document.getElementById('moodChart') as HTMLCanvasElement, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Mood Score', data, borderColor: '#2563eb', fill: false }]
    },
    options: { responsive: true }
  })
})
</script>

<style scoped>
canvas { width: 100%; }
</style>
