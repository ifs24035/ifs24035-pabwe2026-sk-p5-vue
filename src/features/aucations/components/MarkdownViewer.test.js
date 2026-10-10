import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import MarkdownViewer from './MarkdownViewer.vue'

describe('MarkdownViewer', () => {
  beforeEach(() => {
    Viewer.instances.length = 0
  })

  it('membuat viewer dengan nilai awal', () => {
    mount(MarkdownViewer, { props: { value: '# Judul' } })
    expect(Viewer.instances[0].options.initialValue).toBe('# Judul')
  })

  it('memakai string kosong secara default', () => {
    mount(MarkdownViewer)
    expect(Viewer.instances[0].options.initialValue).toBe('')
  })

  it('memperbarui isi saat props berubah', async () => {
    const wrapper = mount(MarkdownViewer, { props: { value: 'lama' } })

    await wrapper.setProps({ value: 'baru' })

    expect(Viewer.instances[0].markdown).toBe('baru')
  })

  it('menghancurkan viewer saat komponen dilepas', () => {
    const wrapper = mount(MarkdownViewer)
    const [viewer] = Viewer.instances

    wrapper.unmount()

    expect(viewer.destroy).toHaveBeenCalled()
  })
})