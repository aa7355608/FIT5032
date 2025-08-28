import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Admin from '@/pages/Admin.vue'
import Reviews from '@/pages/Reviews.vue'
import { useAuthStore } from '@/store/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Array<'user' | 'admin'>
    guestOnly?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/reviews', component: Reviews },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.guestOnly && auth.isAuthenticated) return { path: '/dashboard' }
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { path: '/login' }
  if (to.meta.roles) {
    const ok = to.meta.roles.includes(auth.user?.role || 'user')
    if (!ok) return { path: '/' }
  }
})

export default router

