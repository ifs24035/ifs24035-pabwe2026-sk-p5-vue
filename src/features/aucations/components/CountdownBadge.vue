<script setup>
import { Clock, Lock } from 'lucide-vue-next'

defineProps({
  countdown: { type: Object, required: true },
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm',
      countdown.closed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700',
    ]"
  >
    <Lock v-if="countdown.closed" class="h-3 w-3" />
    <Clock v-else class="h-3 w-3" />
    {{ countdown.label }}
  </span>
</template>