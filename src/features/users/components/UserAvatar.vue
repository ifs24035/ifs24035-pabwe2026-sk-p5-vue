<script setup>
defineProps({
  name: { type: String, default: '' },
  photo: { type: String, default: null },
  size: { type: String, default: 'h-12 w-12' },
})
</script>

<template>
  <img
    v-if="photo"
    :src="photo"
    :alt="name"
    :class="[size, 'shrink-0 rounded-full object-cover ring-2 ring-white']"
  />
  <div
    v-else
    :class="[
      size,
      'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 font-bold text-white',
    ]"
    aria-hidden="true"
  >
    {{ (name || '?').charAt(0).toUpperCase() }}
  </div>
</template>