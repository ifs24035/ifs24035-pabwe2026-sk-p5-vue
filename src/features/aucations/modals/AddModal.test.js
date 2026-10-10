import { describe, it, expect, vi, beforeEach } from 'vitest'
import Editor from '@toast-ui/editor'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'
import AddModal from './AddModal.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const setup = async (props = { open: true }, state = {}) => {
  const pinia = createMockPinia({ aucations: state })
  const store = useAucationsStore(pinia)
  store.addAucation = vi.fn().mockResolvedValue({ status: 'success' })
  store.clearErrors = vi.fn()
  const result = await renderWithProviders(AddModal, { pinia, props })
  return { ...result, store }
}

const fillAndSubmit = async (wrapper) => {
  await wrapper.get('#aucation-title').setValue('Keyboard')
  Editor.instances.at(-1).type('Mulus')
  await wrapper.get('#aucation-start-bid').setValue('200000')
  await wrapper.get('#aucation-closed-at').setValue('2999-01-01T10:00')
  await wrapper.get('form').trigger('submit')
  await flush()
}

describe('AddModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Editor.instances.length = 0
  })

  it('tidak menampilkan form saat tertutup', async () => {
    const { wrapper } = await setup({ open: false })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('menampilkan form pembuatan lelang saat terbuka', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Buat Lelang Baru')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Buat Lelang')
  })

  it('membersihkan errors lama ketika modal dibuka', async () => {
    const { wrapper, store } = await setup({ open: false })
    expect(store.clearErrors).not.toHaveBeenCalled()

    await wrapper.setProps({ open: true })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ open: false })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)
  })

  it('berhasil membuat lelang lalu menutup modal', async () => {
    const { wrapper, store } = await setup()

    await fillAndSubmit(wrapper)

    expect(store.addAucation).toHaveBeenCalledWith({
      title: 'Keyboard',
      description: 'Mulus',
      startBid: 200000,
      closedAt: '2999-01-01 10:00:00',
    })
    expect(showSuccessDialog).toHaveBeenCalledWith('Lelang berhasil dibuat')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('gagal membuat lelang menampilkan dialog error dan tetap terbuka', async () => {
    const { wrapper, store } = await setup()
    store.addAucation.mockResolvedValue({ status: 'fail', message: 'Data tidak valid' })

    await fillAndSubmit(wrapper)

    expect(showErrorDialog).toHaveBeenCalledWith('Data tidak valid')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('memancarkan close dari tombol Batal dan tombol tutup', async () => {
    const { wrapper } = await setup()

    await wrapper.get('form button[type="button"]').trigger('click')
    await wrapper.get('button[aria-label="Tutup"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('meneruskan status loading ke form', async () => {
    const { wrapper } = await setup({ open: true }, { isAucationAdd: true })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})