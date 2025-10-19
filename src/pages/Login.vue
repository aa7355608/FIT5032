<!-- src/pages/Login.vue -->
<template>
  <section class="card" style="max-width:480px; margin:32px auto;">
    <h2>Login</h2>
    <p class="muted">Use your email and password to sign in.</p>

    <form @submit.prevent="onSubmit" novalidate>
      <label>
        Email
        <input
          id="email"
          class="input"
          type="email"
          v-model.trim="email"
          autocomplete="email"
          required
        />
      </label>

      <label style="margin-top:10px;">
        Password
        <input
          id="password"
          class="input"
          type="password"
          v-model="password"
          autocomplete="current-password"
          required
          minlength="6"
        />
      </label>

      <p v-if="error" class="error" role="alert" style="margin-top:8px;">{{ error }}</p>

      <div class="row" style="gap:8px; margin-top:16px;">
        <button class="btn" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Login' }}
        </button>
        <RouterLink to="/register" class="btn ghost">Create account</RouterLink>
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

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function onSubmit() {
  error.value = ''
  if (!validEmail(email.value)) { error.value = 'Please enter a valid email.'; return }
  if (!password.value || password.value.length < 6) { error.value = 'Password must be at least 6 characters.'; return }

  submitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })

    // ✅ 登录成功后跳转 dashboard
    router.push('/dashboard')

  } catch (e: any) {
    error.value = e?.message || 'Login failed.'
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
