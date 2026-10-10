<script setup>
import { watch } from 'vue'
import ModalShell from '../components/ModalShell.vue'
import AucationForm from '../components/AucationForm.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useAucationsStore()

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) store.clearErrors()
  },
)

const handleSubmit = async (payload) => {
  const response = await store.changeAucation(props.aucation.id, payload)
  if (response.status === 'success') {
    showSuccessDialog('Data lelang berhasil diperbarui')
    emit('close')
    return
  }
  showErrorDialog(response.message)
}
</script>

<template>
  <ModalShell
    :open="open"
    title="Ubah Lelang"
    description="Perbarui informasi barang lelangmu."
    width-class="max-w-2xl"
    @close="emit('close')"
  >
    <AucationForm
      :initial="aucation"
      :errors="store.errors"
      :loading="store.isAucationChange"
      submit-label="Simpan Perubahan"
      @submit="handleSubmit"
      @cancel="emit('close')"
    />
  </ModalShell>
</template>