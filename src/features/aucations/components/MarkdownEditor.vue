<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: String, default: '260px' },
  placeholder: { type: String, default: 'Tulis deskripsi barang...' },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
let editor = null

onMounted(() => {
  editor = new Editor({
    el: root.value,
    height: props.height,
    initialEditType: 'wysiwyg',
    previewStyle: 'tab',
    initialValue: props.modelValue,
    placeholder: props.placeholder,
    usageStatistics: false,
  })
  editor.on('change', () => emit('update:modelValue', editor.getMarkdown()))
})

watch(
  () => props.modelValue,
  (value) => {
    if (value !== editor.getMarkdown()) editor.setMarkdown(value)
  },
)

onBeforeUnmount(() => editor.destroy())
</script>

<template>
  <div ref="root" />
</template>