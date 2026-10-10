<script setup>
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import AucationCover from './AucationCover.vue'
import CountdownBadge from './CountdownBadge.vue'
import UserAvatar from '../../users/components/UserAvatar.vue'
import { formatRupiah, getCountdown, getHighestBid } from '../../../helpers/toolsHelper'

const props = defineProps({
  aucation: { type: Object, required: true },
  now: { type: Number, required: true },
  isOwner: { type: Boolean, default: false },
})
defineEmits(['edit', 'delete'])

const author = computed(() => props.aucation.author ?? { name: 'Pengguna', photo: null })
const countdown = computed(() => getCountdown(props.aucation.closed_at, props.now))
const highestBid = computed(() => getHighestBid(props.aucation))
const bidCount = computed(() => props.aucation.bids?.length ?? 0)

const bidLabel = computed(() => {
  if (highestBid.value) return formatRupiah(highestBid.value)
  if (bidCount.value) return `${bidCount.value} penawaran`
  return 'Belum ada'
})
</script>

<template>
  <article class="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
    <div class="relative aspect-[16/10] overflow-hidden">
      <AucationCover :cover="aucation.cover" :title="aucation.title" />
      <div class="absolute left-3 top-3">
        <CountdownBadge :countdown="countdown" />
      </div>
      <span
        v-if="isOwner"
        class="absolute right-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow"
      >
        Milikmu
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-4 p-5">
      <div>
        <RouterLink
          :to="`/aucations/${aucation.id}`"
          class="line-clamp-1 text-lg font-extrabold tracking-tight hover:text-brand-600"
        >
          {{ aucation.title }}
        </RouterLink>
        <div class="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <UserAvatar :name="author.name" :photo="author.photo" size="h-6 w-6" />
          <span class="truncate">{{ author.name }}</span>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl bg-slate-50 p-3">
          <dt class="text-xs text-slate-500">Harga awal</dt>
          <dd class="mt-0.5 font-bold">{{ formatRupiah(aucation.start_bid) }}</dd>
        </div>
        <div class="rounded-xl bg-brand-50 p-3">
          <dt class="text-xs text-brand-700">Tawaran tertinggi</dt>
          <dd class="mt-0.5 font-bold text-brand-700">{{ bidLabel }}</dd>
        </div>
      </dl>

      <div class="mt-auto flex items-center gap-2">
        <RouterLink :to="`/aucations/${aucation.id}`" class="btn-primary flex-1">Lihat Detail</RouterLink>
        <template v-if="isOwner">
          <button
            type="button"
            class="btn-secondary px-3"
            aria-label="Ubah lelang"
            @click="$emit('edit', aucation)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="btn-secondary px-3 text-rose-600"
            aria-label="Hapus lelang"
            @click="$emit('delete', aucation)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </template>
      </div>
    </div>
  </article>
</template>