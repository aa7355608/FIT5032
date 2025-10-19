<!-- src/pages/Register.vue -->
<template>
  <section class="card" style="max-width:520px; margin:32px auto;">
    <h2>Create an Account</h2>
    <p class="muted">Register with email and password.</p>

    <form @submit.prevent="onSubmit" novalidate>
      <label>
        Display Name (optional)
        <input id="name" class="input" type="text" v-model.trim="displayName" maxlength="40" />
      </label>

      <label style="margin-top:10px;">
        Email
        <input id="email" class="input" type="email" v-model.trim="email" autocomplete="email" required />
      </label>

      <label style="margin-top:10px;">
        Password
        <input id="password" class="input" type="password" v-model="password" autocomplete="new-password" required minlength="6" />
      </label>

      <label style="margin-top:10px;">
        Confirm Password
        <input id="confirm" class="input" type="password" v-model="confirm" required minlength="6" />
      </label>

      <p v-if="error" class="error" role="alert" style="margin-top:8px;">{{ error }}</p>
      <p v-if="info" class="muted" role="status" aria-live="polite">{{ info }}</p>

      <div class="row" style="gap:8px; margin-top:16px;">
        <button class="btn" :disabled="submitting">
          {{ submitting ? 'Creating…' : 'Register' }}
        </button>
        <RouterLink to="/login" class="btn ghost">Back to login</RouterLink>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const info = ref('')
const submitting = ref(false)

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function onSubmit() {
  error.value = ''
  info.value = ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = 'Please enter a valid email.'; return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'; return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'; return
  }

  submitting.value = true
  try {
    await auth.register({
      name: displayName.value || '',
      email: email.value,
      password: password.value,
    })
    info.value = 'Account created.'
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.message || 'Registration failed.'
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.input { width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; }
.btn { padding:8px 14px; border-radius:8px; background:#2563eb; color:#fff; }
.btn.ghost { background:#e2e8f0; color:#111827; text-decoration:none; display:inline-flex; align-items:center; }
.error { color:#dc2626; }
.muted { color:#6b7280; }
.card { padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff; }
.row { display:flex; align-items:center; }
</style>
