<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavbarComponent from '../components/NavbarComponent.vue'
import SidebarComponent from '../components/SidebarComponent.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <NavbarComponent @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

    <div class="mx-auto flex max-w-7xl">
      <SidebarComponent :open="isSidebarOpen" @close="isSidebarOpen = false" />
      <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>