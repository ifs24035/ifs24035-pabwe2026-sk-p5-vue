<script setup>
import { Gavel, LayoutDashboard, UserCircle, Users, X } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

defineProps({
  open: { type: Boolean, default: false },
})
defineEmits(['close'])

const route = useRoute()

const items = [
  {
    label: 'Dashboard Lelang',
    icon: LayoutDashboard,
    to: '/',
    isActive: (r) => r.path.startsWith('/aucations') || (r.path === '/' && r.query.tab !== 'mine'),
  },
  {
    label: 'Lelang Saya',
    icon: Gavel,
    to: { path: '/', query: { tab: 'mine' } },
    isActive: (r) => r.path === '/' && r.query.tab === 'mine',
  },
  { label: 'Daftar Pengguna', icon: Users, to: '/users', isActive: (r) => r.path === '/users' },
  { label: 'Profil Saya', icon: UserCircle, to: '/profile', isActive: (r) => r.path === '/profile' },
]
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" data-testid="sidebar-overlay" @click="$emit('close')" />

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-slate-200 bg-white p-4 transition-transform',
      'lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Navigasi utama"
  >
    <div class="mb-4 flex items-center justify-between lg:hidden">
      <span class="font-extrabold">Menu</span>
      <button
        type="button"
        class="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        aria-label="Tutup menu"
        @click="$emit('close')"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="space-y-1">
      <RouterLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        :class="[
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
          item.isActive(route)
            ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/30'
            : 'text-slate-600 hover:bg-slate-100',
        ]"
      >
        <component :is="item.icon" class="h-4 w-4" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>