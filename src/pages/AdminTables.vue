<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Admin Tables</h2>
      <p class="muted">Search by column • Sort • 10 rows per page</p>
    </div>

    <SimpleTable
      title="Users"
      :columns="userCols"
      :rows="userRows"
      :page-size="10"
    />

    <SimpleTable
      title="Reviews"
      :columns="reviewCols"
      :rows="reviewRows"
      :page-size="10"
    />
  </section>
</template>

<script setup lang="ts">
import SimpleTable from '@/components/SimpleTable.vue'
import { useReviewsStore } from '@/store/reviews'


const users = JSON.parse(localStorage.getItem('users') || '[]')
const userCols = [
  { label: 'Email', field: 'email' },
  { label: 'Role', field: 'role' }
]
const userRows = users.map((u: any) => ({ email: u.email, role: u.role }))


const reviews = useReviewsStore()
const reviewCols = [
  { label: 'Title', field: 'title' },
  { label: 'Rating', field: 'rating' },
  { label: 'Comment', field: 'comment' }
]
const reviewRows = reviews.items.map(r => ({ title: r.title, rating: r.rating, comment: r.comment }))
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>

