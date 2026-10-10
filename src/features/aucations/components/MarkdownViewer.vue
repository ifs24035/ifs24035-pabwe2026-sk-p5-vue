<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

const props = defineProps({
  value: { type: String, default: '' },
})

const root = ref(null)
let viewer = null

onMounted(() => {
  viewer = new Viewer({ el: root.value, initialValue: props.value })
})

watch(
  () => props.value,
  (value) => viewer.setMarkdown(value),
)

onBeforeUnmount(() => viewer.destroy())
</script>

<template>
  <div ref="root" />
</template>