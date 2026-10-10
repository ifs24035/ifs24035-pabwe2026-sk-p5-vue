<script setup>
import { watch } from 'vue'
import ModalShell from '../components/ModalShell.vue'
import AucationForm from '../components/AucationForm.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const props = defineProps({
  open: { type: Boolean, default: false },
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
  const response = await store.addAucation(payload)
  if (response.status === 'success') {
    showSuccessDialog('Lelang berhasil dibuat')
    emit('close')
    return
  }
  showErrorDialog(response.message)
}
</script>

<template>
  <ModalShell
    :open="open"
    title="Buat Lelang Baru"
    description="Isi detail barang yang akan kamu lelang."
    width-class="max-w-2xl"
    @close="emit('close')"
  >
    <AucationForm
      :errors="store.errors"
      :loading="store.isAucationAdd"
      submit-label="Buat Lelang"
      @submit="handleSubmit"
      @cancel="emit('close')"
    />
  </ModalShell>
</template>