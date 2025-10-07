<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Reviews</h2>
      <div class="row" style="justify-content:space-between;">
        <StarRating :avg="reviews.average" :count="reviews.count" />
        <span class="muted">Aggregate rating from user submissions</span>
      </div>
    </div>

    <div class="card" style="max-width:700px;">
      <h3>Write a Review</h3>
      <Form :validation-schema="reviewSchema" @submit="submit" v-slot="{ errors }">
        <div class="form-group">
          <label>Title</label>
          <Field name="title" class="input" maxlength="80" />
          <div class="error">{{ errors.title }}</div>
        </div>
        <div class="form-group">
          <label>Rating (1-5)</label>
          <Field name="rating" as="select" class="input">
            <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
          </Field>
          <div class="error">{{ errors.rating }}</div>
        </div>
        <div class="form-group">
          <label>Comment (optional)</label>
          <Field name="comment" as="textarea" class="input" rows="4" maxlength="500" />
          <div class="error">{{ errors.comment }}</div>
        </div>
        <button class="btn" type="submit" :disabled="submitting">{{ submitting ? 'Submitting…' : 'Submit' }}</button>
      </Form>
    </div>

    <div class="grid cards">
      <article v-for="r in reviews.items" :key="r.id" class="card">
        <h3>{{ r.title }} • {{ r.rating }}★</h3>
        <p>{{ r.comment }}</p>
      </article>
    </div>
    
    <div class="row" style="gap:8px; margin-top:12px;">
  <button class="btn secondary" @click="exportCsv">Export CSV</button>
  <button class="btn secondary" @click="exportPdf">Export PDF</button>
</div>

  </section>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { reviewSchema } from '@/utils/validators'
import { useReviewsStore } from '@/store/reviews'
import { useAuthStore } from '@/store/auth'
import StarRating from '@/components/StarRating.vue'
import { ref } from 'vue'
import { utils, writeFile } from 'xlsx'

const exportCsv = () => {
  const rows = reviews.items.map(r => ({
    Title: r.title,
    Rating: r.rating,
    Comment: r.comment
  }))
  const wb = utils.book_new()
  const ws = utils.json_to_sheet(rows)
  utils.book_append_sheet(wb, ws, 'Reviews')
  writeFile(wb, 'reviews.csv')
}

const exportPdf = async () => {
  const { default: jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  pdf.text('Youth Wellbeing Reviews', 14, 16)
  reviews.items.forEach((r, i) => {
    pdf.text(`${i + 1}. ${r.title} — ${r.rating}★`, 14, 28 + i * 8)
  })
  pdf.save('reviews.pdf')
}

const reviews = useReviewsStore()
const auth = useAuthStore()
const submitting = ref(false)

const submit = async (values: any) => {
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 200))
    reviews.add({
      id: crypto.randomUUID(),
      userId: auth.user?.id || 'anon',
      rating: Number(values.rating),
      title: values.title.trim(),
      comment: (values.comment || '').trim()
    })
  } finally {
    submitting.value = false
  }
}
</script>
