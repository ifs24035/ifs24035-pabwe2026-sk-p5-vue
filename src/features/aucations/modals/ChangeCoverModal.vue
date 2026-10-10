<script setup>
import { ref } from 'vue'
import { ImagePlus, Loader2, Upload } from 'lucide-vue-next'
import ModalShell from '../components/ModalShell.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const MAX_COVER_SIZE = 2 * 1024 * 1024

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useAucationsStore()
const file = ref(null)
const previewUrl = ref('')

const reset = () => {
  file.value = null
  previewUrl.value = ''
}

const close = () => {
  reset()
  emit('close')
}

const handleSelect = (event) => {
  const selected = event.target.files[0]
  if (!selected) return

  if (!selected.type.startsWith('image/')) {
    showErrorDialog('File harus berupa gambar')
    return
  }
  if (selected.size > MAX_COVER_SIZE) {
    showErrorDialog('Ukuran gambar maksimal 2 MB')
    return
  }

  file.value = selected
  previewUrl.value = URL.createObjectURL(selected)
}

const handleSubmit = async () => {
  const response = await store.changeCover(props.aucation.id, file.value)
  if (response.status === 'success') {
    showSuccessDialog('Cover lelang berhasil diperbarui')
    close()
    return
  }
  showErrorDialog(response.message)
}
</script>

<template>
  <ModalShell
    :open="open"
    title="Ganti Cover"
    description="Unggah foto barang yang jelas agar lebih menarik penawar."
    @close="close"
  >
    <div class="space-y-5">
      <label
        for="cover-input"
        class="relative flex h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-brand-400 hover:bg-brand-50"
      >
        <img
          v-if="previewUrl || aucation.cover"
          :src="previewUrl || aucation.cover"
          alt="Pratinjau cover"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <template v-else>
          <ImagePlus class="h-10 w-10" />
          <span class="mt-2 text-sm font-semibold">Klik untuk memilih gambar</span>
        </template>
      </label>
      <input
        id="cover-input"
        type="file"
        accept="image/*"
        class="hidden"
        aria-label="Pilih gambar cover"
        @change="handleSelect"
      />
      <p class="text-xs text-slate-400">Format gambar (JPG, PNG, WEBP), maksimal 2 MB.</p>

      <div class="flex justify-end gap-3">
        <button type="button" class="btn-secondary" @click="close">Batal</button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!file || store.isAucationChangeCover"
          @click="handleSubmit"
        >
          <Loader2 v-if="store.isAucationChangeCover" class="h-4 w-4 animate-spin" />
          <Upload v-else class="h-4 w-4" />
          Unggah Cover
        </button>
      </div>
    </div>
  </ModalShell>
</template>