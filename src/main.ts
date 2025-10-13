import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles.css'  

import { useAuthStore } from '@/store/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)


const auth = useAuthStore()
auth.restore()

app.use(router)


router.isReady().then(() => app.mount('#app'))

