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
import { jsPDF } from 'jspdf' 

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

const exportPdf = () => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' }) 
  const left = 40
  const top = 40
  const lineGap = 14
  const pageBottom = 820   
  const wrapWidth = 520    

 
  pdf.setFontSize(16)
  pdf.setFont(undefined, 'bold')
  pdf.text('Youth Wellbeing Reviews', left, top)

  let y = top + 24
  pdf.setFontSize(12)

  const rows = reviews.items.length
    ? reviews.items
    : [{ title: 'No reviews yet', rating: '-', comment: '—' }]

  rows.forEach((r, i) => {
    
    const head = `${i + 1}. ${r.title} — ${r.rating}★`
    if (y > pageBottom) { pdf.addPage(); y = top }
    pdf.setFont(undefined, 'bold'); pdf.text(head, left, y); y += 18

    
    pdf.setFont(undefined, 'normal')
    const text = r.comment && r.comment.trim() ? r.comment.trim() : '-'
    const lines = pdf.splitTextToSize(text, wrapWidth)

    lines.forEach(line => {
      if (y > pageBottom) { pdf.addPage(); y = top }
      pdf.text(line, left, y); y += lineGap
    })

    y += 10 
    if (y > pageBottom) { pdf.addPage(); y = top }
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
