<script setup>
import { ref } from 'vue'
import { Loader2, Save } from 'lucide-vue-next'
import MarkdownEditor from './MarkdownEditor.vue'
import { useInput } from '../../../hooks/useInput'
import { formatRupiah, toApiDateTime, toInputDateTime } from '../../../helpers/toolsHelper'

const props = defineProps({
  initial: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Simpan' },
})
const emit = defineEmits(['submit', 'cancel'])

const [title, onTitleChange] = useInput(props.initial.title ?? '')
const [description, onDescriptionChange] = useInput(props.initial.description ?? '')
const [startBid, onStartBidChange] = useInput(
  props.initial.start_bid ? String(props.initial.start_bid) : '',
)
const [closedAt, onClosedAtChange] = useInput(toInputDateTime(props.initial.closed_at))

const clientErrors = ref({})

const errorOf = (field) => clientErrors.value[field] ?? props.errors[field]?.[0]

const handleSubmit = () => {
  const errors = {}
  if (!title.value.trim()) errors.title = 'Judul wajib diisi'
  if (!description.value.trim()) errors.description = 'Deskripsi wajib diisi'
  if (!(Number(startBid.value) > 0)) errors.start_bid = 'Harga awal harus lebih dari 0'
  if (!closedAt.value) {
    errors.closed_at = 'Batas waktu wajib diisi'
  } else if (new Date(closedAt.value).getTime() <= Date.now()) {
    errors.closed_at = 'Batas waktu harus di masa depan'
  }

  clientErrors.value = errors
  if (Object.keys(errors).length > 0) return

  emit('submit', {
    title: title.value.trim(),
    description: description.value,
    startBid: Number(startBid.value),
    closedAt: toApiDateTime(closedAt.value),
  })
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <div>
      <label for="aucation-title" class="mb-1.5 block text-sm font-semibold">Judul Barang</label>
      <input
        id="aucation-title"
        type="text"
        class="input"
        placeholder="Contoh: Keyboard Gaming RGB"
        :value="title"
        @input="onTitleChange"
      />
      <p v-if="errorOf('title')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('title') }}</p>
    </div>

    <div>
      <span class="mb-1.5 block text-sm font-semibold">Deskripsi</span>
      <MarkdownEditor :model-value="description" @update:model-value="onDescriptionChange" />
      <p v-if="errorOf('description')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('description') }}</p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label for="aucation-start-bid" class="mb-1.5 block text-sm font-semibold">Harga Awal (Rp)</label>
        <input
          id="aucation-start-bid"
          type="number"
          min="1"
          step="1000"
          inputmode="numeric"
          class="input"
          placeholder="200000"
          :value="startBid"
          @input="onStartBidChange"
        />
        <p class="mt-1.5 text-xs text-slate-400">{{ formatRupiah(startBid) }}</p>
        <p v-if="errorOf('start_bid')" class="mt-1 text-xs text-rose-600">{{ errorOf('start_bid') }}</p>
      </div>

      <div>
        <label for="aucation-closed-at" class="mb-1.5 block text-sm font-semibold">Batas Waktu</label>
        <input
          id="aucation-closed-at"
          type="datetime-local"
          class="input"
          :value="closedAt"
          @input="onClosedAtChange"
        />
        <p v-if="errorOf('closed_at')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('closed_at') }}</p>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button type="button" class="btn-secondary" @click="emit('cancel')">Batal</button>
      <button type="submit" class="btn-primary" :disabled="loading">
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <Save v-else class="h-4 w-4" />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>