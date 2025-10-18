<template>
  <section class="grid" style="gap:16px; max-width:480px; margin-inline:auto;">
    <div class="card">
      <h2>Log In</h2>
      <p class="muted">Welcome back.</p>
    </div>

    <div class="card">
      <div class="grid" style="gap:10px;">
        <label>Email
          <input class="input" v-model.trim="email" placeholder="you@example.com" />
        </label>
        <label>Password
          <input class="input" type="password" v-model="password" placeholder="Your password" />
        </label>

        <button class="btn" @click="submit" :disabled="busy">{{ busy ? 'Logging in…' : 'Log In' }}</button>
        <p v-if="err" style="color:#b91c1c; margin:4px 0 0 0;">{{ err }}</p>
        <p class="muted" style="margin:8px 0 0 0;">
          No account? <router-link to="/register">Create one</router-link>.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const err = ref('')
const busy = ref(false)

async function submit(){
  err.value = ''
  try {
    busy.value = true
    await auth.login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (e: any) {
    err.value = e?.message || 'Login failed.'
  } finally {
    busy.value = false
  }
}
</script>
