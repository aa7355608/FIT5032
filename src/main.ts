import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles.css'
import { useAuthStore } from './store/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

/ restore session
const auth = useAuthStore()
auth.restore()

app.mount('#app')
