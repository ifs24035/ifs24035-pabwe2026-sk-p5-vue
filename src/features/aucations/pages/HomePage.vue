<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Search, SearchX, Trash2 } from 'lucide-vue-next'
import AucationCard from '../components/AucationCard.vue'
import AddModal from '../modals/AddModal.vue'
import ChangeModal from '../modals/ChangeModal.vue'
import { useInput } from '../../../hooks/useInput'
import { useNow } from '../../../hooks/useNow'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '../../users/states/usersStore'
import { notifyResponse } from '../../../helpers/notifyHelper'
import { getCountdown, showConfirmDialog, showErrorDialog } from '../../../helpers/toolsHelper'

// Catatan: pada API, is_closed=1 => sudah ditutup, is_closed=0 => masih berlangsung
const TABS = [
  { key: 'all', label: 'Semua Lelang', filters: {} },
  { key: 'mine', label: 'Lelang Saya', filters: { isMe: true } },
  { key: 'open', label: 'Lelang Berlangsung', filters: { isClosed: 0 } },
  { key: 'closed', label: 'Lelang Ditutup', filters: { isClosed: 1 } },
]

const route = useRoute()
const router = useRouter()
const store = useAucationsStore()
const users = useUsersStore()
const now = useNow()
const [keyword, onKeywordChange] = useInput('')

const isAddOpen = ref(false)
const isChangeOpen = ref(false)
const selected = ref(null)

const activeTab = computed(() => TABS.find((tab) => tab.key === route.query.tab) ?? TABS[0])

const filteredAucations = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return store.aucations
  return store.aucations.filter((item) =>
    `${item.title} ${item.description}`.toLowerCase().includes(query),
  )
})

const openCount = computed(
  () => filteredAucations.value.filter((item) => !getCountdown(item.closed_at, now.value).closed).length,
)
const closedCount = computed(() => filteredAucations.value.length - openCount.value)

const isOwner = (item) => Boolean(users.profile?.id) && users.profile.id === item.user_id

const loadAucations = async () => {
  if (route.path !== '/') return

  const response = await store.fetchAucations(activeTab.value.filters)
  if (response.status !== 'success') showErrorDialog(response.message)
}

watch(activeTab, loadAucations, { immediate: true })

const selectTab = (tab) => {
  router.replace({ path: '/', query: tab.key === 'all' ? {} : { tab: tab.key } })
}

const openChange = (item) => {
  selected.value = item
  isChangeOpen.value = true
}

const handleDelete = async (item) => {
  const confirmed = await showConfirmDialog(
    'Hapus lelang ini?',
    `"${item.title}" akan dihapus permanen.`,
    'Ya, hapus',
  )
  if (!confirmed) return

  const response = await store.deleteAucation(item.id)
  notifyResponse(response, 'Lelang berhasil dihapus')
}

const handleDeleteAll = async () => {
  const confirmed = await showConfirmDialog(
    'Hapus semua lelang milikmu?',
    'Semua lelang beserta cover dan penawarannya akan dihapus permanen.',
    'Ya, hapus semua',
  )
  if (!confirmed) return

  const response = await store.deleteAllAucations()
  notifyResponse(response, 'Semua lelang milikmu berhasil dihapus')
}
</script>

<template>
  <section class="space-y-6">
    <header
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-purple-600 p-6 text-white shadow-xl shadow-brand-500/20 sm:p-8"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

      <div class="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight">Dashboard Lelang</h1>
          <p class="mt-1 max-w-lg text-sm text-brand-100">
            Temukan barang incaranmu atau pasang barangmu sendiri untuk dilelang.
          </p>
        </div>
        <button type="button" class="btn bg-white text-brand-700 shadow-lg hover:bg-brand-50" @click="isAddOpen = true">
          <Plus class="h-4 w-4" />
          Buat Lelang
        </button>
      </div>

      <dl class="relative mt-6 grid grid-cols-3 gap-3 text-center">
        <div class="rounded-2xl bg-white/10 p-3 backdrop-blur">
          <dt class="text-xs text-brand-100">Ditampilkan</dt>
          <dd class="text-2xl font-extrabold">{{ filteredAucations.length }}</dd>
        </div>
        <div class="rounded-2xl bg-white/10 p-3 backdrop-blur">
          <dt class="text-xs text-brand-100">Berlangsung</dt>
          <dd class="text-2xl font-extrabold">{{ openCount }}</dd>
        </div>
        <div class="rounded-2xl bg-white/10 p-3 backdrop-blur">
          <dt class="text-xs text-brand-100">Ditutup</dt>
          <dd class="text-2xl font-extrabold">{{ closedCount }}</dd>
        </div>
      </dl>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex gap-2 overflow-x-auto pb-1" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab.key === tab.key"
          :class="[
            'cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
            activeTab.key === tab.key
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-100',
          ]"
          @click="selectTab(tab)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="relative w-full sm:w-72">
        <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          class="input pl-11"
          placeholder="Cari judul atau deskripsi..."
          aria-label="Cari lelang"
          :value="keyword"
          @input="onKeywordChange"
        />
      </div>
    </div>

    <div v-if="activeTab.key === 'mine' && store.aucations.length > 0" class="flex justify-end">
      <button type="button" class="btn-secondary text-rose-600" :disabled="store.isAucationDeleteAll" @click="handleDeleteAll">
        <Trash2 class="h-4 w-4" />
        Hapus Semua Lelang Saya
      </button>
    </div>

    <div v-if="store.isAucation" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" data-testid="aucations-loading">
      <div v-for="n in 6" :key="n" class="card h-80 animate-pulse bg-slate-200" />
    </div>

    <div v-else-if="filteredAucations.length === 0" class="card flex flex-col items-center gap-2 p-12 text-center">
      <SearchX class="h-12 w-12 text-slate-300" />
      <p class="text-lg font-bold">Lelang tidak ditemukan</p>
      <p class="text-sm text-slate-500">Coba ganti tab atau kata kunci pencarian.</p>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <AucationCard
        v-for="item in filteredAucations"
        :key="item.id"
        :aucation="item"
        :now="now"
        :is-owner="isOwner(item)"
        @edit="openChange"
        @delete="handleDelete"
      />
    </div>

    <AddModal :open="isAddOpen" @close="isAddOpen = false" />
    <ChangeModal v-if="selected" :open="isChangeOpen" :aucation="selected" @close="isChangeOpen = false" />
  </section>
</template>