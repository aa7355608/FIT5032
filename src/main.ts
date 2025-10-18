// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles.css'

import { useAuthStore } from '@/store/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)


const auth = useAuthStore()
auth.hydrate()

app.mount('#app')
