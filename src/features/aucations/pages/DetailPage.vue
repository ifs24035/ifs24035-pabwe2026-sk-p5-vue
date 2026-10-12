<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  CalendarClock,
  HandCoins,
  ImagePlus,
  Pencil,
  SearchX,
  Trash2,
  Trophy,
  Undo2,
} from 'lucide-vue-next'
import AucationCover from '../components/AucationCover.vue'
import CountdownBadge from '../components/CountdownBadge.vue'
import BidModal from '../modals/BidModal.vue'
import ChangeModal from '../modals/ChangeModal.vue'
import ChangeCoverModal from '../modals/ChangeCoverModal.vue'
import UserAvatar from '../../users/components/UserAvatar.vue'
import { useNow } from '../../../hooks/useNow'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '../../users/states/usersStore'
import { notifyResponse } from '../../../helpers/notifyHelper'
import {
  formatDate,
  formatRupiah,
  getCountdown,
  getHighestBid,
  showConfirmDialog,
} from '../../../helpers/toolsHelper'

// Viewer Markdown berukuran besar, jadi dimuat terpisah dari halaman
const MarkdownViewer = defineAsyncComponent(() => import('../components/MarkdownViewer.vue'))

const route = useRoute()
const router = useRouter()
const store = useAucationsStore()
const users = useUsersStore()
const now = useNow()

const isChangeOpen = ref(false)
const isCoverOpen = ref(false)
const isBidOpen = ref(false)

const countdown = computed(() => getCountdown(store.aucation?.closed_at, now.value))
const highestBid = computed(() => getHighestBid(store.aucation))
const sortedBids = computed(() => [...(store.aucation?.bids ?? [])].sort((a, b) => b.bid - a.bid))
const myBid = computed(() => store.aucation?.my_bid ?? null)
const isOwner = computed(
  () => Boolean(users.profile?.id) && users.profile.id === store.aucation?.user_id,
)
const canBid = computed(() => !isOwner.value && !countdown.value.closed)

watch(
  () => route.params.aucationId,
  (id) => {
    if (id) store.fetchAucation(id)
  },
  { immediate: true },
)

onMounted(() => {
  if (!users.profile) users.fetchProfile()
})

const handleDelete = async () => {
  const confirmed = await showConfirmDialog(
    'Hapus lelang ini?',
    'Lelang beserta cover dan penawarannya akan dihapus permanen.',
    'Ya, hapus',
  )
  if (!confirmed) return

  const response = await store.deleteAucation(store.aucation.id)
  if (notifyResponse(response, 'Lelang berhasil dihapus')) router.replace('/')
}

const handleDeleteBid = async () => {
  const confirmed = await showConfirmDialog(
    'Batalkan penawaran?',
    'Penawaranmu pada lelang ini akan dihapus.',
    'Ya, batalkan',
  )
  if (!confirmed) return

  const response = await store.deleteBid(store.aucation.id)
  notifyResponse(response, 'Penawaran berhasil dibatalkan')
}
</script>

<template>
  <section class="space-y-6">
    <RouterLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600">
      <ArrowLeft class="h-4 w-4" />
      Kembali ke Dashboard
    </RouterLink>

    <div v-if="store.isAucation" class="grid gap-6 lg:grid-cols-5" data-testid="detail-loading">
      <h1 class="sr-only">Memuat detail lelang</h1>
      <div class="card h-96 animate-pulse bg-slate-100 lg:col-span-3" />
      <div class="card h-96 animate-pulse bg-slate-100 lg:col-span-2" />
    </div>

    <div v-else-if="!store.aucation" class="card flex flex-col items-center gap-2 p-12 text-center">
      <SearchX class="h-12 w-12 text-slate-300" />
      <h1 class="text-lg font-bold">Lelang tidak ditemukan</h1>
      <p class="text-sm text-slate-500">Lelang mungkin sudah dihapus atau alamatnya salah.</p>
    </div>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Kolom kiri: cover + deskripsi -->
        <div class="space-y-6 lg:col-span-3">
          <div class="card overflow-hidden">
            <div class="relative aspect-[16/10]">
              <AucationCover :cover="store.aucation.cover" :title="store.aucation.title" />
              <button
                v-if="isOwner"
                type="button"
                class="btn absolute bottom-4 right-4 bg-white/90 text-slate-700 shadow-lg backdrop-blur hover:bg-white"
                @click="isCoverOpen = true"
              >
                <ImagePlus class="h-4 w-4" />
                Ganti Cover
              </button>
            </div>

            <div class="space-y-4 p-6">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <h1 class="text-2xl font-extrabold tracking-tight">{{ store.aucation.title }}</h1>
                <CountdownBadge :countdown="countdown" />
              </div>

              <div class="flex items-center gap-3">
                <UserAvatar
                  :name="store.aucation.author.name"
                  :photo="store.aucation.author.photo"
                  size="h-10 w-10"
                />
                <div>
                  <p class="text-sm font-bold">{{ store.aucation.author.name }}</p>
                  <p class="text-xs text-slate-500">Pemilik barang</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h2 class="mb-4 text-lg font-bold">Deskripsi Barang</h2>
            <MarkdownViewer :value="store.aucation.description" />
          </div>
        </div>

        <!-- Kolom kanan: harga, aksi, riwayat -->
        <div class="space-y-6 lg:col-span-2">
          <div class="card space-y-5 p-6 lg:sticky lg:top-24">
            <dl class="space-y-3 text-sm">
              <div class="rounded-2xl bg-slate-50 p-4">
                <dt class="text-xs text-slate-500">Harga awal</dt>
                <dd class="mt-0.5 text-lg font-bold">{{ formatRupiah(store.aucation.start_bid) }}</dd>
              </div>
              <div class="rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 p-4 text-white">
                <dt class="text-xs text-brand-100">
                  {{ countdown.closed ? 'Penawaran akhir' : 'Tawaran tertinggi' }}
                </dt>
                <dd class="mt-0.5 text-2xl font-extrabold">
                  {{ highestBid ? formatRupiah(highestBid) : 'Belum ada tawaran' }}
                </dd>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <dt class="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarClock class="h-4 w-4 text-brand-600" />
                  Ditutup pada
                </dt>
                <dd class="mt-0.5 font-semibold">{{ formatDate(store.aucation.closed_at) }}</dd>
              </div>
              <div v-if="myBid" class="rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <dt class="text-xs text-brand-700">Penawaranmu</dt>
                <dd class="mt-0.5 font-bold text-brand-700">{{ formatRupiah(myBid.bid) }}</dd>
              </div>
            </dl>

            <div class="space-y-3">
              <template v-if="isOwner">
                <button type="button" class="btn-primary w-full" @click="isChangeOpen = true">
                  <Pencil class="h-4 w-4" />
                  Ubah Lelang
                </button>
                <button type="button" class="btn-danger w-full" :disabled="store.isAucationDelete" @click="handleDelete">
                  <Trash2 class="h-4 w-4" />
                  Hapus Lelang
                </button>
              </template>

              <template v-else-if="canBid">
                <button type="button" class="btn-primary w-full" @click="isBidOpen = true">
                  <HandCoins class="h-4 w-4" />
                  {{ myBid ? 'Perbarui Penawaran' : 'Ajukan Penawaran' }}
                </button>
                <button
                  v-if="myBid"
                  type="button"
                  class="btn-secondary w-full"
                  :disabled="store.isBidDelete"
                  @click="handleDeleteBid"
                >
                  <Undo2 class="h-4 w-4" />
                  Batalkan Penawaran
                </button>
              </template>

              <p v-else class="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">
                Lelang ini sudah ditutup.
              </p>
            </div>
          </div>

          <div class="card p-6">
            <h2 class="flex items-center gap-2 text-lg font-bold">
              <Trophy class="h-5 w-5 text-brand-600" />
              Riwayat Penawaran
              <span class="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {{ sortedBids.length }}
              </span>
            </h2>

            <p v-if="sortedBids.length === 0" class="mt-4 text-sm text-slate-500">
              Belum ada yang menawar. Jadilah yang pertama!
            </p>

            <ol v-else class="mt-4 space-y-3">
              <li
                v-for="(item, index) in sortedBids"
                :key="item.id"
                :class="[
                  'flex items-center gap-3 rounded-2xl p-3',
                  index === 0 ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-slate-50',
                ]"
              >
                <span
                  :class="[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    index === 0 ? 'bg-brand-600 text-white' : 'bg-white text-slate-500',
                  ]"
                >
                  {{ index + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-bold">{{ formatRupiah(item.bid) }}</p>
                  <p class="text-xs text-slate-500">{{ formatDate(item.created_at) }}</p>
                </div>
                <span
                  v-if="myBid && myBid.id === item.id"
                  class="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white"
                >
                  Kamu
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <ChangeModal :open="isChangeOpen" :aucation="store.aucation" @close="isChangeOpen = false" />
      <ChangeCoverModal :open="isCoverOpen" :aucation="store.aucation" @close="isCoverOpen = false" />
      <BidModal :open="isBidOpen" :aucation="store.aucation" @close="isBidOpen = false" />
    </template>
  </section>
</template>