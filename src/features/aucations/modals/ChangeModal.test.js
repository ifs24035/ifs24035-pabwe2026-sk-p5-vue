import { describe, it, expect, vi, beforeEach } from 'vitest'
import Editor from '@toast-ui/editor'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'
import ChangeModal from './ChangeModal.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const aucation = {
  id: 9,
  title: 'Oculus Quest 2',
  description: 'Second mulus',
  start_bid: 5000000,
  closed_at: '2999-01-01 22:00:00',
}

const setup = async (props = {}, state = {}) => {
  const pinia = createMockPinia({ aucations: state })
  const store = useAucationsStore(pinia)
  store.changeAucation = vi.fn().mockResolvedValue({ status: 'success' })
  store.clearErrors = vi.fn()
  const result = await renderWithProviders(ChangeModal, { pinia, props: { open: true, aucation, ...props } })
  return { ...result, store }
}

describe('ChangeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Editor.instances.length = 0
  })

  it('tidak menampilkan form saat tertutup', async () => {
    const { wrapper } = await setup({ open: false })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('menampilkan form terisi data lelang', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Ubah Lelang')
    expect(wrapper.get('#aucation-title').element.value).toBe('Oculus Quest 2')
    expect(wrapper.get('#aucation-start-bid').element.value).toBe('5000000')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Simpan Perubahan')
  })

  it('membersihkan errors lama ketika modal dibuka', async () => {
    const { wrapper, store } = await setup({ open: false })

    await wrapper.setProps({ open: true })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ open: false })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)
  })

  it('berhasil menyimpan perubahan lalu menutup modal', async () => {
    const { wrapper, store } = await setup()

    await wrapper.get('#aucation-title').setValue('Oculus Quest 3')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(store.changeAucation).toHaveBeenCalledWith(9, {
      title: 'Oculus Quest 3',
      description: 'Second mulus',
      startBid: 5000000,
      closedAt: '2999-01-01 22:00:00',
    })
    expect(showSuccessDialog).toHaveBeenCalledWith('Data lelang berhasil diperbarui')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('gagal menyimpan menampilkan dialog error dan tetap terbuka', async () => {
    const { wrapper, store } = await setup()
    store.changeAucation.mockResolvedValue({ status: 'fail', message: 'Bukan pemilik lelang' })

    await wrapper.get('form').trigger('submit')
    await flush()

    expect(showErrorDialog).toHaveBeenCalledWith('Bukan pemilik lelang')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('memancarkan close dari tombol Batal', async () => {
    const { wrapper } = await setup()

    await wrapper.get('form button[type="button"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('meneruskan status loading ke form', async () => {
    const { wrapper } = await setup({}, { isAucationChange: true })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})