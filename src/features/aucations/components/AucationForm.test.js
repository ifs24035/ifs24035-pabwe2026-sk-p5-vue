import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Editor from '@toast-ui/editor'
import AucationForm from './AucationForm.vue'

const mountForm = (props = {}) => mount(AucationForm, { props })
const lastEditor = () => Editor.instances.at(-1)

const fill = async (wrapper, { title = 'Keyboard', description = 'Mulus', startBid = '200000', closedAt = '2999-01-01T10:00' } = {}) => {
  await wrapper.get('#aucation-title').setValue(title)
  lastEditor().type(description)
  await wrapper.get('#aucation-start-bid').setValue(startBid)
  await wrapper.get('#aucation-closed-at').setValue(closedAt)
}

describe('AucationForm', () => {
  beforeEach(() => {
    Editor.instances.length = 0
  })

  it('menampilkan form kosong dengan label tombol bawaan', () => {
    const wrapper = mountForm()

    expect(wrapper.get('#aucation-title').element.value).toBe('')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Simpan')
    expect(wrapper.text()).toMatch(/Rp\s?0/)
  })

  it('menampilkan pesan validasi untuk form kosong', async () => {
    const wrapper = mountForm()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Judul wajib diisi')
    expect(wrapper.text()).toContain('Deskripsi wajib diisi')
    expect(wrapper.text()).toContain('Harga awal harus lebih dari 0')
    expect(wrapper.text()).toContain('Batas waktu wajib diisi')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('menolak batas waktu yang sudah lewat', async () => {
    const wrapper = mountForm()

    await fill(wrapper, { closedAt: '2020-01-01T10:00' })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Batas waktu harus di masa depan')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('memancarkan submit dengan payload yang sudah dibersihkan', async () => {
    const wrapper = mountForm()

    await fill(wrapper, { title: '  Keyboard  ' })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      title: 'Keyboard',
      description: 'Mulus',
      startBid: 200000,
      closedAt: '2999-01-01 10:00:00',
    })
  })

  it('menampilkan pratinjau rupiah saat harga awal diisi', async () => {
    const wrapper = mountForm()

    await wrapper.get('#aucation-start-bid').setValue('15000')

    expect(wrapper.text()).toMatch(/Rp\s?15\.000/)
  })

  it('mengisi form dari data awal saat mode ubah', () => {
    const wrapper = mountForm({
      initial: {
        title: 'Oculus',
        description: 'Second mulus',
        start_bid: 5000000,
        closed_at: '2026-12-31 23:59:00',
      },
    })

    expect(wrapper.get('#aucation-title').element.value).toBe('Oculus')
    expect(wrapper.get('#aucation-start-bid').element.value).toBe('5000000')
    expect(wrapper.get('#aucation-closed-at').element.value).toBe('2026-12-31T23:59')
    expect(lastEditor().options.initialValue).toBe('Second mulus')
  })

  it('menampilkan pesan error dari server di bawah field', () => {
    const wrapper = mountForm({
      errors: {
        title: ['Judul sudah dipakai'],
        description: ['Deskripsi terlalu pendek'],
        start_bid: ['Harga awal tidak valid'],
        closed_at: ['Tanggal tidak valid'],
      },
    })

    expect(wrapper.text()).toContain('Judul sudah dipakai')
    expect(wrapper.text()).toContain('Deskripsi terlalu pendek')
    expect(wrapper.text()).toContain('Harga awal tidak valid')
    expect(wrapper.text()).toContain('Tanggal tidak valid')
  })

  it('menonaktifkan tombol saat loading dan memakai label kustom', () => {
    const wrapper = mountForm({ loading: true, submitLabel: 'Buat Lelang' })
    const submit = wrapper.get('button[type="submit"]')

    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.text()).toContain('Buat Lelang')
  })

  it('memancarkan cancel saat tombol Batal diklik', async () => {
    const wrapper = mountForm()

    await wrapper.get('button[type="button"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})