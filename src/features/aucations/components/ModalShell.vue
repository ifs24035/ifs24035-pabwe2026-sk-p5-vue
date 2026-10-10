<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  widthClass: { type: String, default: 'max-w-lg' },
})
defineEmits(['close'])
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @click.self="$emit('close')"
  >
    <div :class="['card relative my-8 w-full p-6 sm:p-8', widthClass]">
      <button
        type="button"
        class="absolute right-4 top-4 cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-600"
        aria-label="Tutup"
        @click="$emit('close')"
      >
        <X class="h-5 w-5" />
      </button>

      <h2 class="pr-8 text-xl font-extrabold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>

      <div class="mt-6">
        <slot />
      </div>
    </div>
  </div>
</template>