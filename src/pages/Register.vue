<template>
  <div class="card" style="max-width:560px; margin:0 auto;">
    <h2>Create Account</h2>
    <Form :validation-schema="registerSchema" @submit="onSubmit" v-slot="{ errors }">
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
      <div class="form-group">
        <label>Confirm Password</label>
        <Field name="confirm" class="input" type="password" />
        <div class="error">{{ errors.confirm }}</div>
      </div>
      <div class="form-group">
        <label>Role</label>
        <Field as="select" name="role" class="input">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </Field>
        <div class="error">{{ errors.role }}</div>
      </div>
      <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Creating…' : 'Register' }}</button>
      <p class="error" v-if="errorMsg">{{ errorMsg }}</p>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { registerSchema } from '@/utils/validators'
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
    auth.register(values.email, values.password, values.role)
    auth.login(values.email, values.password)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e.message || 'Register failed'
  } finally {
    loading.value = false
  }
}
</script>
