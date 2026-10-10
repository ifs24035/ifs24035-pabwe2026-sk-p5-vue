import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalShell from './ModalShell.vue'

const mountShell = (props = {}) =>
  mount(ModalShell, {
    props: { open: true, title: 'Judul Modal', ...props },
    slots: { default: '<p>Isi modal</p>' },
  })

describe('ModalShell', () => {
  it('tidak menampilkan apa pun saat tertutup', () => {
    const wrapper = mountShell({ open: false })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('menampilkan judul, deskripsi, dan slot saat terbuka', () => {
    const wrapper = mountShell({ description: 'Keterangan' })

    expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('Judul Modal')
    expect(wrapper.text()).toContain('Judul Modal')
    expect(wrapper.text()).toContain('Keterangan')
    expect(wrapper.text()).toContain('Isi modal')
  })

  it('tidak menampilkan deskripsi bila kosong', () => {
    const wrapper = mountShell()
    expect(wrapper.find('p.text-slate-500').exists()).toBe(false)
  })

  it('memancarkan close saat tombol tutup diklik', async () => {
    const wrapper = mountShell()
    await wrapper.get('button[aria-label="Tutup"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('memancarkan close saat latar diklik tetapi tidak saat isi diklik', async () => {
    const wrapper = mountShell()

    await wrapper.get('h2').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('[role="dialog"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('memakai kelas lebar kustom', () => {
    const wrapper = mountShell({ widthClass: 'max-w-2xl' })
    expect(wrapper.html()).toContain('max-w-2xl')
  })
})