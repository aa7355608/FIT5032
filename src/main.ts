import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@/assets/styles.css'
import { useAuthStore } from '@/store/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 👉 restore session BEFORE installing/using the router
const auth = useAuthStore()
auth.restore()

app.use(router)

// wait for the initial navigation to finish (no guard loops)
router.isReady().then(() => {
  app.mount('#app')
})

// optional: register SW (offline)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
