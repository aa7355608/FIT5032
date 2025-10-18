<template>
  <section class="grid" style="gap:16px; max-width:480px; margin-inline:auto;">
    <div class="card">
      <h2>Create Account</h2>
      <p class="muted">Register to save your progress and post in Community.</p>
    </div>

    <div class="card">
      <div class="grid" style="gap:10px;">
        <label>Display Name
          <input class="input" v-model.trim="name" placeholder="Your name (optional)" />
        </label>
        <label>Email
          <input class="input" v-model.trim="email" placeholder="you@example.com" />
        </label>
        <label>Password
          <input class="input" type="password" v-model="password" placeholder="At least 6 characters" />
        </label>
        <label>Role
          <select class="input" v-model="role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <button class="btn" @click="submit" :disabled="busy">{{ busy ? 'Registering…' : 'Register' }}</button>
        <p v-if="err" style="color:#b91c1c; margin:4px 0 0 0;">{{ err }}</p>
        <p class="muted" style="margin:8px 0 0 0;">
          Already have an account? <router-link to="/login">Log in</router-link>.
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

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'user'|'admin'>('user')
const err = ref('')
const busy = ref(false)

async function submit(){
  err.value = ''
  try {
    busy.value = true
    await auth.register({ name: name.value, email: email.value, password: password.value, role: role.value })
    router.push('/dashboard')
  } catch (e: any) {
    err.value = e?.message || 'Registration failed.'
  } finally {
    busy.value = false
  }
}
</script>
