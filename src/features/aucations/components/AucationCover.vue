<script setup>
import { Gavel } from 'lucide-vue-next'

defineProps({
  cover: { type: String, default: null },
  title: { type: String, default: '' },
})
</script>

<template>
  <img
    v-if="cover"
    :src="cover"
    :alt="title"
    loading="lazy"
    decoding="async"
    class="h-full w-full object-cover"
  />
  <div
    v-else
    class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-purple-100 text-brand-300"
    role="img"
    :aria-label="`Tanpa cover untuk ${title}`"
  >
    <Gavel class="h-12 w-12" />
  </div>
</template>