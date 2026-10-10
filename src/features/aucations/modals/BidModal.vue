<script setup>
import { computed, ref, watch } from 'vue'
import { HandCoins, Loader2 } from 'lucide-vue-next'
import ModalShell from '../components/ModalShell.vue'
import { useInput } from '../../../hooks/useInput'
import { useAucationsStore } from '../states/aucationsStore'
import { formatRupiah, getHighestBid, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const QUICK_STEPS = [10000, 50000, 100000]

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useAucationsStore()
const [bid, onBidChange, resetBid] = useInput('')
const clientError = ref('')

const highestBid = computed(() => getHighestBid(props.aucation))
const baseline = computed(() => highestBid.value || props.aucation.start_bid)
const bidError = computed(() => clientError.value || store.errors.bid?.[0])

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      store.clearErrors()
      clientError.value = ''
    }
  },
)

const close = () => {
  resetBid()
  emit('close')
}

const validate = (amount) => {
  if (!(amount > 0)) return 'Masukkan nominal penawaran'
  if (highestBid.value > 0 && amount <= highestBid.value) {
    return `Penawaran harus lebih tinggi dari ${formatRupiah(highestBid.value)}`
  }
  if (highestBid.value === 0 && amount < props.aucation.start_bid) {
    return `Penawaran minimal ${formatRupiah(props.aucation.start_bid)}`
  }
  return ''
}

const handleSubmit = async () => {
  const amount = Number(bid.value)
  clientError.value = validate(amount)
  if (clientError.value) return

  const response = await store.addBid(props.aucation.id, amount)
  if (response.status === 'success') {
    showSuccessDialog('Penawaranmu berhasil dikirim')
    close()
    return
  }
  showErrorDialog(response.message)
}
</script>

<template>
  <ModalShell :open="open" :title="`Tawar: ${aucation.title}`" description="Pilih nominal yang kamu yakini menang." @close="close">
    <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl bg-slate-50 p-3">
          <dt class="text-xs text-slate-500">Harga awal</dt>
          <dd class="mt-0.5 font-bold">{{ formatRupiah(aucation.start_bid) }}</dd>
        </div>
        <div class="rounded-xl bg-brand-50 p-3">
          <dt class="text-xs text-brand-700">Tawaran tertinggi</dt>
          <dd class="mt-0.5 font-bold text-brand-700">
            {{ highestBid ? formatRupiah(highestBid) : 'Belum ada' }}
          </dd>
        </div>
      </dl>

      <div>
        <label for="bid-amount" class="mb-1.5 block text-sm font-semibold">Nominal Penawaran (Rp)</label>
        <input
          id="bid-amount"
          type="number"
          min="1"
          step="1000"
          inputmode="numeric"
          class="input"
          :value="bid"
          @input="onBidChange"
        />
        <p v-if="bidError" class="mt-1.5 text-xs text-rose-600">{{ bidError }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="step in QUICK_STEPS"
          :key="step"
          type="button"
          class="cursor-pointer rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          @click="onBidChange(String(baseline + step))"
        >
          + {{ formatRupiah(step) }}
        </button>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-secondary" @click="close">Batal</button>
        <button type="submit" class="btn-primary" :disabled="store.isBidAdd">
          <Loader2 v-if="store.isBidAdd" class="h-4 w-4 animate-spin" />
          <HandCoins v-else class="h-4 w-4" />
          Kirim Penawaran
        </button>
      </div>
    </form>
  </ModalShell>
</template>