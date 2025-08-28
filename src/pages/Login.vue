<template>
  <div class="card" style="max-width:520px; margin:0 auto;">
    <h2>Login</h2>
    <Form :validation-schema="loginSchema" @submit="onSubmit" v-slot="{ errors }">
      <div class="form-group">
        <label>Email</label>
        <Field name="email" class="input" type="email" />
        <div class="error">{{ errors.email }}</div>
      </div>
      <div class="form-group">
        <label>Password</label>
        <Field name="password" class="input" type="password" />
        <div class="error">{{ errors.password }}</div>
      </div>
      <div class="row" style="justify-content:space-between;">
        <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Signing in…' : 'Login' }}</button>
        <router-link class="btn ghost" to="/register">Need an account?</router-link>
      </div>
      <p class="error" v-if="errorMsg">{{ errorMsg }}</p>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { loginSchema } from '@/utils/validators'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const errorMsg = ref('')

const onSubmit = async (values: any) => {
  try {
    loading.value = true
    await new Promise(r => setTimeout(r, 300))
    auth.login(values.email, values.password)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
