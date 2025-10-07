<template>
  <section class="grid" style="gap:16px;">
    <div class="card"><h2>Admin Tables</h2><p class="muted">Search, sort, paginate (10/pg)</p></div>

    <div class="card">
      <h3>Users</h3>
      <TableLite
        :is-loading="false"
        :columns="userCols"
        :rows="userRows"
        :page-size="10"
        :sortable="true"
        :filterable="true"
        :multi-column-filter="true"
      />
    </div>

    <div class="card">
      <h3>Reviews</h3>
      <TableLite
        :is-loading="false"
        :columns="reviewCols"
        :rows="reviewRows"
        :page-size="10"
        :sortable="true"
        :filterable="true"
        :multi-column-filter="true"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import TableLite from 'vue3-table-lite'
import 'vue3-table-lite/dist/vue3-table-lite.css'
import { useReviewsStore } from '@/store/reviews'

const userCols = [
  { label: 'Email', field: 'email', filter: true, sortable: true },
  { label: 'Role', field: 'role', filter: true, sortable: true }
]
const reviewCols = [
  { label: 'Title', field: 'title', filter: true, sortable: true },
  { label: 'Rating', field: 'rating', filter: true, sortable: true },
  { label: 'Comment', field: 'comment', filter: true, sortable: false }
]

const users = JSON.parse(localStorage.getItem('users') || '[]')
const userRows = users.map((u: any) => ({ email: u.email, role: u.role }))

const reviews = useReviewsStore()
const reviewRows = reviews.items.map(r => ({ title: r.title, rating: r.rating, comment: r.comment }))
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
