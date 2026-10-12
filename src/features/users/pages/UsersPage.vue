<script setup>
import { computed, onMounted } from 'vue'
import { CalendarDays, Mail, Search, Users, X } from 'lucide-vue-next'
import UserAvatar from '../components/UserAvatar.vue'
import { useInput } from '../../../hooks/useInput'
import { useUsersStore } from '../states/usersStore'
import { formatDate, showErrorDialog } from '../../../helpers/toolsHelper'

const store = useUsersStore()
const [keyword, onKeywordChange] = useInput('')

const filteredUsers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return store.users
  return store.users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query))
})

onMounted(async () => {
  const response = await store.fetchUsers()
  if (response.status !== 'success') showErrorDialog(response.message)
})
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="rounded-2xl bg-brand-100 p-3 text-brand-600">
          <Users class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight">Daftar Pengguna</h1>
          <p class="text-sm text-slate-500">{{ store.users.length }} pengguna terdaftar di Delcom Auction</p>
        </div>
      </div>

      <div class="relative w-full sm:w-72">
        <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          class="input pl-11"
          placeholder="Cari nama atau email..."
          aria-label="Cari pengguna"
          :value="keyword"
          @input="onKeywordChange"
        />
      </div>
    </header>

    <div v-if="store.isUsers" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="users-loading">
      <div v-for="n in 6" :key="n" class="card h-24 animate-pulse bg-slate-100" />
    </div>

    <div v-else-if="filteredUsers.length === 0" class="card flex flex-col items-center gap-2 p-12 text-center">
      <Users class="h-10 w-10 text-slate-300" />
      <p class="font-semibold">Pengguna tidak ditemukan</p>
      <p class="text-sm text-slate-500">Coba kata kunci lain.</p>
    </div>

    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="item in filteredUsers" :key="item.id">
        <button
          type="button"
          class="card flex w-full cursor-pointer items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          @click="store.selectUser(item)"
        >
          <UserAvatar :name="item.name" :photo="item.photo" />
          <div class="min-w-0">
            <p class="truncate font-bold">{{ item.name }}</p>
            <p class="truncate text-sm text-slate-500">{{ item.email }}</p>
          </div>
        </button>
      </li>
    </ul>

    <div
      v-if="store.user"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Detail pengguna"
      @click.self="store.clearUser()"
    >
      <div class="card relative w-full max-w-sm p-8 text-center">
        <button
          type="button"
          class="absolute right-4 top-4 cursor-pointer rounded-lg p-1 text-slate-500 hover:text-slate-700"
          aria-label="Tutup"
          @click="store.clearUser()"
        >
          <X class="h-5 w-5" />
        </button>

        <div class="flex justify-center">
          <UserAvatar :name="store.user.name" :photo="store.user.photo" size="h-24 w-24" />
        </div>
        <h2 class="mt-4 text-xl font-extrabold">{{ store.user.name }}</h2>

        <dl class="mt-6 space-y-3 text-left text-sm">
          <div class="mt-6 space-y-3 text-left text-sm">
          <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <Mail class="h-4 w-4 text-brand-600" />
            <p>{{ store.user.email }}</p>
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <CalendarDays class="h-4 w-4 text-brand-600" />
            <p>Bergabung {{ formatDate(store.user.created_at) }}</p>
          </div>
        </div>
        </dl>
      </div>
    </div>
  </section>
</template>