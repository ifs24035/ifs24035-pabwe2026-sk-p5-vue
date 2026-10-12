<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, LogOut, Menu, UserCircle, Users } from 'lucide-vue-next'
import UserAvatar from '../../users/components/UserAvatar.vue'
import { useAuthStore } from '../../auth/states/authStore'
import { useUsersStore } from '../../users/states/usersStore'
import { showConfirmDialog } from '../../../helpers/toolsHelper'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const users = useUsersStore()
const isMenuOpen = ref(false)

const handleLogout = async () => {
  isMenuOpen.value = false
  const confirmed = await showConfirmDialog(
    'Keluar dari akun?',
    'Kamu perlu masuk lagi untuk mengakses lelang.',
    'Ya, keluar',
  )
  if (!confirmed) return

  await auth.logout()
  router.replace('/auth/login')
}

onMounted(() => users.fetchProfile())
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        class="cursor-pointer rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
        @click="$emit('toggle-sidebar')"
      >
        <Menu class="h-5 w-5" />
      </button>

      <RouterLink to="/" class="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Logo Delcom Auction" class="h-9 w-9 rounded-xl" />
        <span class="hidden text-lg font-extrabold tracking-tight sm:block">Delcom Auction</span>
      </RouterLink>

      <div class="relative ml-auto">
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100"
          aria-haspopup="menu"
          :aria-label="users.profile ? `Menu akun ${users.profile.name}` : 'Menu akun'"
          @click="isMenuOpen = !isMenuOpen"
        >
          <UserAvatar :name="users.profile?.name" :photo="users.profile?.photo" size="h-9 w-9" />
          <span class="hidden max-w-32 truncate text-sm font-semibold sm:block">
            {{ users.profile?.name ?? 'Memuat...' }}
          </span>
          <ChevronDown class="h-4 w-4 text-slate-500" />
        </button>

        <template v-if="isMenuOpen">
          <div class="fixed inset-0 z-40" data-testid="menu-backdrop" @click="isMenuOpen = false" />
          <div class="card absolute right-0 z-50 mt-2 w-60 p-2 shadow-xl" role="menu">
            <div class="px-3 py-2">
              <p class="truncate text-sm font-bold">{{ users.profile?.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ users.profile?.email }}</p>
            </div>
            <hr class="my-1 border-slate-100" />
            <RouterLink
              to="/profile"
              class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-50"
              role="menuitem"
              @click="isMenuOpen = false"
            >
              <UserCircle class="h-4 w-4 text-slate-500" />
              Profil Saya
            </RouterLink>
            <RouterLink
              to="/users"
              class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-50"
              role="menuitem"
              @click="isMenuOpen = false"
            >
              <Users class="h-4 w-4 text-slate-500" />
              Daftar Pengguna
            </RouterLink>
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              role="menuitem"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Keluar
            </button>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>