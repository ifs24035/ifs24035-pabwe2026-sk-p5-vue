import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Editor from '@toast-ui/editor'
import MarkdownEditor from './MarkdownEditor.vue'

describe('MarkdownEditor', () => {
  beforeEach(() => {
    Editor.instances.length = 0
  })

  it('membuat editor dengan nilai awal dan opsi bawaan', () => {
    mount(MarkdownEditor, { props: { modelValue: '# Halo' } })
    const [editor] = Editor.instances

    expect(editor.options.initialValue).toBe('# Halo')
    expect(editor.options.height).toBe('260px')
    expect(editor.options.placeholder).toBe('Tulis deskripsi barang...')
  })

  it('memakai nilai default saat props tidak diberikan', () => {
    mount(MarkdownEditor)
    expect(Editor.instances[0].options.initialValue).toBe('')
  })

  it('memancarkan update:modelValue saat isi editor berubah', () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: '' } })

    Editor.instances[0].type('**tebal**')

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['**tebal**'])
  })

  it('menyinkronkan editor saat modelValue berubah dari luar', async () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: 'awal' } })
    const [editor] = Editor.instances

    await wrapper.setProps({ modelValue: 'dari luar' })

    expect(editor.getMarkdown()).toBe('dari luar')
  })

  it('tidak mengubah editor bila nilai sudah sama', async () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: 'awal' } })
    const [editor] = Editor.instances
    editor.markdown = 'baru'

    await wrapper.setProps({ modelValue: 'baru' })

    expect(editor.getMarkdown()).toBe('baru')
  })

  it('menghancurkan editor saat komponen dilepas', () => {
    const wrapper = mount(MarkdownEditor)
    const [editor] = Editor.instances

    wrapper.unmount()

    expect(editor.destroy).toHaveBeenCalled()
  })
})