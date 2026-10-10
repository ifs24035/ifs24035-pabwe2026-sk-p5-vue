import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'
import BidModal from './BidModal.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const noBids = { id: 5, title: 'Keyboard', start_bid: 200000, bids: [] }
const withBids = { ...noBids, bids: [{ id: 1, bid: 250000 }, { id: 2, bid: 300000 }] }

const setup = async (props = {}, state = {}) => {
  const pinia = createMockPinia({ aucations: state })
  const store = useAucationsStore(pinia)
  store.addBid = vi.fn().mockResolvedValue({ status: 'success' })
  store.clearErrors = vi.fn()
  const result = await renderWithProviders(BidModal, { pinia, props: { open: true, aucation: noBids, ...props } })
  return { ...result, store }
}

const submitBid = async (wrapper, value) => {
  await wrapper.get('#bid-amount').setValue(value)
  await wrapper.get('form').trigger('submit')
  await flush()
}

describe('BidModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tidak menampilkan form saat tertutup', async () => {
    const { wrapper } = await setup({ open: false })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('menampilkan harga awal dan "Belum ada" tawaran tertinggi', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Tawar: Keyboard')
    expect(wrapper.text()).toMatch(/Rp\s?200\.000/)
    expect(wrapper.text()).toContain('Belum ada')
  })

  it('menampilkan tawaran tertinggi bila sudah ada bid', async () => {
    const { wrapper } = await setup({ aucation: withBids })

    expect(wrapper.text()).toMatch(/Rp\s?300\.000/)
    expect(wrapper.text()).not.toContain('Belum ada')
  })

  it('tombol cepat mengisi nominal dari harga awal bila belum ada bid', async () => {
    const { wrapper } = await setup()

    await wrapper.findAll('button[type="button"]').find((b) => b.text().includes('10.000')).trigger('click')

    expect(wrapper.get('#bid-amount').element.value).toBe('210000')
  })

  it('tombol cepat mengisi nominal dari tawaran tertinggi bila sudah ada bid', async () => {
    const { wrapper } = await setup({ aucation: withBids })

    await wrapper.findAll('button[type="button"]').find((b) => b.text().includes('50.000')).trigger('click')

    expect(wrapper.get('#bid-amount').element.value).toBe('350000')
  })

  it('menolak nominal kosong', async () => {
    const { wrapper, store } = await setup()

    await submitBid(wrapper, '')

    expect(wrapper.text()).toContain('Masukkan nominal penawaran')
    expect(store.addBid).not.toHaveBeenCalled()
  })

  it('menolak nominal yang tidak lebih tinggi dari tawaran tertinggi', async () => {
    const { wrapper, store } = await setup({ aucation: withBids })

    await submitBid(wrapper, '300000')

    expect(wrapper.text()).toContain('Penawaran harus lebih tinggi dari')
    expect(store.addBid).not.toHaveBeenCalled()
  })

  it('menolak nominal di bawah harga awal saat belum ada bid', async () => {
    const { wrapper, store } = await setup()

    await submitBid(wrapper, '100000')

    expect(wrapper.text()).toContain('Penawaran minimal')
    expect(store.addBid).not.toHaveBeenCalled()
  })

  it('berhasil mengirim penawaran lalu menutup modal', async () => {
    const { wrapper, store } = await setup()

    await submitBid(wrapper, '250000')

    expect(store.addBid).toHaveBeenCalledWith(5, 250000)
    expect(showSuccessDialog).toHaveBeenCalledWith('Penawaranmu berhasil dikirim')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.get('#bid-amount').element.value).toBe('')
  })

  it('gagal mengirim penawaran menampilkan dialog error dan tetap terbuka', async () => {
    const { wrapper, store } = await setup()
    store.addBid.mockResolvedValue({ status: 'fail', message: 'Lelang sudah ditutup' })

    await submitBid(wrapper, '250000')

    expect(showErrorDialog).toHaveBeenCalledWith('Lelang sudah ditutup')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('menampilkan pesan error dari server di bawah kolom nominal', async () => {
    const { wrapper } = await setup({}, { errors: { bid: ['Nominal tidak valid'] } })
    expect(wrapper.text()).toContain('Nominal tidak valid')
  })

  it('membersihkan errors dan pesan lama ketika modal dibuka ulang', async () => {
    const { wrapper, store } = await setup({ open: false })

    await wrapper.setProps({ open: true })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)

    await submitBid(wrapper, '')
    expect(wrapper.text()).toContain('Masukkan nominal penawaran')

    await wrapper.setProps({ open: false })
    expect(store.clearErrors).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ open: true })
    expect(wrapper.text()).not.toContain('Masukkan nominal penawaran')
  })

  it('tombol Batal menutup modal dan mengosongkan nominal', async () => {
    const { wrapper } = await setup()
    await wrapper.get('#bid-amount').setValue('123')

    await wrapper.findAll('button').find((b) => b.text() === 'Batal').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.get('#bid-amount').element.value).toBe('')
  })

  it('menonaktifkan tombol kirim saat proses berjalan', async () => {
    const { wrapper } = await setup({}, { isBidAdd: true })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})