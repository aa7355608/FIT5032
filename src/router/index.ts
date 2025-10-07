import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Admin from '@/pages/Admin.vue'
import Reviews from '@/pages/Reviews.vue'


import Mindfulness from '@/pages/Mindfulness.vue'
import Resources from '@/pages/Resources.vue'
import Community from '@/pages/Community.vue'
import Profile from '@/pages/Profile.vue'
import Help from '@/pages/Help.vue'
import MoodTracker from '@/pages/MoodTracker.vue'

import { useAuthStore } from '@/store/auth'
import EmailDemo from '@/pages/EmailDemo.vue'
import AdminTables from '@/pages/AdminTables.vue'
import MapPage from '@/pages/Map.vue'
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
  { path: '/admin/tables', component: AdminTables, meta: { requiresAuth: true, roles: ['admin'] } },

  
  { path: '/mood', component: MoodTracker, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/mindfulness', component: Mindfulness },
  { path: '/resources', component: Resources },
  { path: '/community', component: Community },
  { path: '/profile', component: Profile, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/help', component: Help },

  { path: '/reviews', component: Reviews },
  { path: '/:pathMatch(.*)*', redirect: '/' }
  { path: '/email', component: EmailDemo, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/map', component: MapPage },
]

const router = createRouter({ history: createWebHistory(), routes })

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
