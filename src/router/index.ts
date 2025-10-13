import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// Core pages
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Admin from '@/pages/Admin.vue'
import Reviews from '@/pages/Reviews.vue'

// Feature pages
import MoodTracker from '@/pages/MoodTracker.vue'
import Mindfulness from '@/pages/Mindfulness.vue'
import Resources from '@/pages/Resources.vue'
import Community from '@/pages/Community.vue'
import Profile from '@/pages/Profile.vue'
import Help from '@/pages/Help.vue'
import EmailDemo from '@/pages/EmailDemo.vue'
import AdminTables from '@/pages/AdminTables.vue'
import MapPage from '@/pages/Map.vue'
import Charts from '@/pages/Charts.vue'

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

  // Auth
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },

  // Protected (user or admin)
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/charts', component: Charts, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/mood', component: MoodTracker, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/email', component: EmailDemo, meta: { requiresAuth: true, roles: ['user','admin'] } },

  // Admin only
  { path: '/admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/tables', component: AdminTables, meta: { requiresAuth: true, roles: ['admin'] } },

  // Public sections
  { path: '/reviews', component: Reviews },
  { path: '/mindfulness', component: Mindfulness },
  { path: '/resources', component: Resources },
  { path: '/community', component: Community },
  { path: '/help', component: Help },
  { path: '/map', component: MapPage },

  { path: '/:pathMatch(.*)*', redirect: '/' }
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


