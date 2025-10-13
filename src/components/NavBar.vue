<template>
  <nav class="nav">
    <router-link to="/" style="font-weight:700;">🌿 Youth Wellbeing</router-link>
    <div class="spacer"></div>

    <!-- Public -->
    <router-link class="btn ghost" to="/">Home</router-link>
    <router-link class="btn ghost" to="/reviews">Reviews</router-link>
    <router-link class="btn ghost" to="/mindfulness">Mindfulness</router-link>
    <router-link class="btn ghost" to="/resources">Resources</router-link>
    <router-link class="btn ghost" to="/community">Community</router-link>
    <router-link class="btn ghost" to="/map">Map</router-link>
    <router-link class="btn ghost" to="/help">Help</router-link>

    <!-- Authed -->
    <router-link v-if="isAuthed" class="btn ghost" to="/dashboard">Dashboard</router-link>
    <router-link v-if="isAuthed" class="btn ghost" to="/profile">Profile</router-link>
    <router-link v-if="isAuthed" class="btn ghost" to="/charts">Charts</router-link>
    <router-link v-if="isAuthed" class="btn ghost" to="/email">Email</router-link>

    <!-- Admin -->
    <router-link v-if="isAdmin" class="btn ghost" to="/admin">Admin</router-link>
    <router-link v-if="isAdmin" class="btn ghost" to="/admin/tables">Admin Tables</router-link>

    <!-- Auth buttons -->
    <router-link v-if="!isAuthed" class="btn" to="/login">Login</router-link>
    <router-link v-if="!isAuthed" class="btn secondary" to="/register">Register</router-link>
    <button v-else class="btn secondary" @click="logout">Logout</button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()
const isAuthed = computed(() => auth.isAuthenticated)
const isAdmin = computed(() => auth.user?.role === 'admin')
const logout = () => auth.logout()
</script>


