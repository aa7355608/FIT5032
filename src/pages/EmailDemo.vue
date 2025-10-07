<template>
  <section class="card" style="max-width:720px; margin:auto;">
    <h2>Send Email (Demo)</h2>
    <p class="muted">Sends an email via EmailJS. Attachment is a generated CSV.</p>
    <div class="form-group">
      <label>Recipient Email</label>
      <input v-model="to" class="input" type="email" placeholder="example@mail.com" />
    </div>
    <div class="row" style="gap:8px;">
      <button class="btn" @click="send" :disabled="sending">{{ sending ? 'Sending…' : 'Send Email with Attachment' }}</button>
      <span class="muted" v-if="msg">{{ msg }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import emailjs from 'emailjs-com'
import { utils, write, WorkBook } from 'xlsx'
import { ref } from 'vue'
const to = ref('')
const sending = ref(false)
const msg = ref('')

const makeCsvBlob = () => {
  const wb: WorkBook = utils.book_new()
  const ws = utils.json_to_sheet([{ title: 'Welcome', note: 'Thanks for trying our app!' }])
  utils.book_append_sheet(wb, ws, 'Note')
  const u8 = write(wb, { type: 'array', bookType: 'csv' })
  return new Blob([u8], { type: 'text/csv' })
}

const send = async () => {
  try {
    sending.value = true
    const file = makeCsvBlob()
    const formData = new FormData()
    formData.append('to_email', to.value)
    formData.append('message', 'Hello from Youth App!')
    formData.append('attachment', file, 'welcome.csv')
    // EmailJS REST endpoint example (set your service/template keys in a backend or EmailJS SDK)
    await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID',
      { to_email: to.value, message: 'See attached CSV' },
      'YOUR_PUBLIC_KEY'
    )
    msg.value = 'Sent!'
  } catch (e: any) {
    msg.value = e.message || 'Failed'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
