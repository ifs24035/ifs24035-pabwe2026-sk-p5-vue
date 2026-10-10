import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import * as aucationApi from '../api/aucationApi'
import * as userApi from '../../users/api/userApi'
import DetailPage from './DetailPage.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

vi.mock('../api/aucationApi', () => ({
  getAucations: vi.fn(),
  getAucation: vi.fn(),
  addAucation: vi.fn(),
  changeAucation: vi.fn(),
  changeCoverAucation: vi.fn(),
  deleteAucation: vi.fn(),
  addBid: vi.fn(),
  deleteBid: vi.fn(),
  deleteAllAucations: vi.fn(),
}))

vi.mock('../../users/api/userApi', () => ({ getMe: vi.fn() }))

const Blank = { template: '<div />' }
const routes = [
  { path: '/', component: Blank },
  { path: '/aucations/:aucationId', component: Blank },
]

const base = {
  id: 9,
  user_id: 2,
  title: 'Oculus Quest 2',
  cover: 'https://x.test/c.jpg',
  description: '**Second** mulus',
  start_bid: 5000000,
  closed_at: '2999-01-01 22:00:00',
  author: { name: 'Risky', photo: null },
  bids: [
    { id: 11, bid: 6000000, created_at: '2026-10-05T08:44:12.000000Z' },
    { id: 12, bid: 7000000, created_at: '2026-10-05T09:44:12.000000Z' },
  ],
  my_bid: { id: 11, bid: 6000000 },
}
const ok = { status: 'success' }
const detail = (aucation) => ({ status: 'success', data: { aucation } })

const setup = async ({ aucation = base, profile = { id: 1 }, state = {}, route = '/aucations/9' } = {}) => {
  aucationApi.getAucation.mockResolvedValue(detail(aucation))
  const pinia = createMockPinia({ users: { profile }, aucations: state })
  const result = await renderWithProviders(DetailPage, { pinia, route, routes })
  await flush()
  return result
}

const buttonByText = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))
const owner = { ...base, user_id: 1, my_bid: undefined }

describe('DetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showConfirmDialog.mockResolvedValue(true)
    userApi.getMe.mockResolvedValue({ status: 'success', data: { user: { id: 1 } } })
  })

  describe('pemuatan', () => {
    it('memuat lelang berdasarkan id pada URL', async () => {
      await setup()
      expect(aucationApi.getAucation).toHaveBeenCalledWith('9')
    })

    it('memuat ulang saat id pada URL berubah', async () => {
      const { router } = await setup()

      await router.push('/aucations/10')
      await flush()

      expect(aucationApi.getAucation).toHaveBeenLastCalledWith('10')
    })

    it('tidak memuat data saat id pada URL hilang', async () => {
      const { router } = await setup()
      expect(aucationApi.getAucation).toHaveBeenCalledTimes(1)

      await router.push('/')
      await flush()

      expect(aucationApi.getAucation).toHaveBeenCalledTimes(1)
    })

    it('memuat profil bila belum tersedia', async () => {
      await setup({ profile: null })
      expect(userApi.getMe).toHaveBeenCalledTimes(1)
    })

    it('tidak memuat profil bila sudah tersedia', async () => {
      await setup()
      expect(userApi.getMe).not.toHaveBeenCalled()
    })

    it('menampilkan skeleton saat sedang memuat', async () => {
      aucationApi.getAucation.mockReturnValue(new Promise(() => {}))
      const { wrapper } = await renderWithProviders(DetailPage, {
        pinia: createMockPinia({ users: { profile: { id: 1 } } }),
        route: '/aucations/9',
        routes,
      })
      await flush()

      expect(wrapper.find('[data-testid="detail-loading"]').exists()).toBe(true)
    })

    it('menampilkan keadaan tidak ditemukan bila lelang gagal dimuat', async () => {
      aucationApi.getAucation.mockResolvedValue({ status: 'fail', message: 'Tidak ada' })
      const { wrapper } = await renderWithProviders(DetailPage, {
        pinia: createMockPinia({ users: { profile: { id: 1 } } }),
        route: '/aucations/9',
        routes,
      })
      await flush()

      expect(wrapper.text()).toContain('Lelang tidak ditemukan')
    })
  })

  describe('sebagai penawar', () => {
    it('menampilkan informasi lelang, harga, dan riwayat penawaran', async () => {
      const { wrapper } = await setup()

      expect(wrapper.text()).toContain('Oculus Quest 2')
      expect(wrapper.text()).toContain('Risky')
      expect(wrapper.text()).toMatch(/Rp\s?5\.000\.000/)
      expect(wrapper.text()).toContain('Tawaran tertinggi')
      expect(wrapper.text()).toMatch(/Rp\s?7\.000\.000/)
      expect(wrapper.text()).toContain('Penawaranmu')
      expect(wrapper.get('img[alt="Oculus Quest 2"]').attributes('src')).toBe('https://x.test/c.jpg')

      const history = wrapper.findAll('ol li')
      expect(history).toHaveLength(2)
      expect(history[0].text()).toMatch(/Rp\s?7\.000\.000/)
      expect(history[0].text()).not.toContain('Kamu')
      expect(history[1].text()).toContain('Kamu')
    })

    it('menampilkan aksi perbarui dan batalkan bila sudah menawar', async () => {
      const { wrapper } = await setup()

      expect(buttonByText(wrapper, 'Perbarui Penawaran')).toBeDefined()
      expect(buttonByText(wrapper, 'Batalkan Penawaran')).toBeDefined()
      expect(buttonByText(wrapper, 'Ubah Lelang')).toBeUndefined()
      expect(buttonByText(wrapper, 'Ganti Cover')).toBeUndefined()
    })

    it('menampilkan aksi ajukan bila belum menawar dan riwayat kosong', async () => {
      const { wrapper } = await setup({ aucation: { ...base, bids: undefined, my_bid: undefined } })

      expect(buttonByText(wrapper, 'Ajukan Penawaran')).toBeDefined()
      expect(buttonByText(wrapper, 'Batalkan Penawaran')).toBeUndefined()
      expect(wrapper.text()).not.toContain('Penawaranmu')
      expect(wrapper.text()).toContain('Belum ada tawaran')
      expect(wrapper.text()).toContain('Belum ada yang menawar')
    })

    it('menampilkan pesan ditutup tanpa aksi bila lelang sudah berakhir', async () => {
      const { wrapper } = await setup({ aucation: { ...base, closed_at: '2000-01-01 10:00:00' } })

      expect(wrapper.text()).toContain('Lelang ini sudah ditutup.')
      expect(wrapper.text()).toContain('Penawaran akhir')
      expect(buttonByText(wrapper, 'Ajukan Penawaran')).toBeUndefined()
      expect(buttonByText(wrapper, 'Perbarui Penawaran')).toBeUndefined()
    })

    it('membuka dan menutup modal penawaran', async () => {
      const { wrapper } = await setup()

      await buttonByText(wrapper, 'Perbarui Penawaran').trigger('click')
      expect(wrapper.get('[role="dialog"]').text()).toContain('Tawar: Oculus Quest 2')

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    describe('membatalkan penawaran', () => {
      it('berhasil setelah konfirmasi', async () => {
        aucationApi.deleteBid.mockResolvedValue(ok)
        const { wrapper } = await setup()

        await buttonByText(wrapper, 'Batalkan Penawaran').trigger('click')
        await flush()

        expect(aucationApi.deleteBid).toHaveBeenCalledWith(9)
        expect(showSuccessDialog).toHaveBeenCalledWith('Penawaran berhasil dibatalkan')
      })

      it('tidak berjalan bila konfirmasi dibatalkan', async () => {
        showConfirmDialog.mockResolvedValue(false)
        const { wrapper } = await setup()

        await buttonByText(wrapper, 'Batalkan Penawaran').trigger('click')
        await flush()

        expect(aucationApi.deleteBid).not.toHaveBeenCalled()
      })

      it('menampilkan dialog error bila gagal', async () => {
        aucationApi.deleteBid.mockResolvedValue({ status: 'fail', message: 'Gagal membatalkan' })
        const { wrapper } = await setup()

        await buttonByText(wrapper, 'Batalkan Penawaran').trigger('click')
        await flush()

        expect(showErrorDialog).toHaveBeenCalledWith('Gagal membatalkan')
      })

      it('menonaktifkan tombol saat proses berjalan', async () => {
        const { wrapper } = await setup()
        const button = buttonByText(wrapper, 'Batalkan Penawaran')

        aucationApi.deleteBid.mockReturnValue(new Promise(() => {}))
        await button.trigger('click')
        await flush()

        expect(button.attributes('disabled')).toBeDefined()
      })
    })
  })

  describe('sebagai pemilik', () => {
    it('menampilkan aksi pemilik dan menyembunyikan aksi penawar', async () => {
      const { wrapper } = await setup({ aucation: owner })

      expect(buttonByText(wrapper, 'Ubah Lelang')).toBeDefined()
      expect(buttonByText(wrapper, 'Hapus Lelang')).toBeDefined()
      expect(buttonByText(wrapper, 'Ganti Cover')).toBeDefined()
      expect(buttonByText(wrapper, 'Ajukan Penawaran')).toBeUndefined()
      expect(wrapper.findAll('ol li').filter((li) => li.text().includes('Kamu'))).toHaveLength(0)
    })

    it('tetap menampilkan aksi pemilik setelah lelang ditutup', async () => {
      const { wrapper } = await setup({ aucation: { ...owner, closed_at: '2000-01-01 10:00:00' } })

      expect(buttonByText(wrapper, 'Hapus Lelang')).toBeDefined()
      expect(wrapper.text()).not.toContain('Lelang ini sudah ditutup.')
    })

    it('membuka dan menutup modal ubah lelang', async () => {
      const { wrapper } = await setup({ aucation: owner })

      await buttonByText(wrapper, 'Ubah Lelang').trigger('click')
      expect(wrapper.get('[role="dialog"]').text()).toContain('Ubah Lelang')

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('membuka dan menutup modal ganti cover', async () => {
      const { wrapper } = await setup({ aucation: owner })

      await buttonByText(wrapper, 'Ganti Cover').trigger('click')
      expect(wrapper.get('[role="dialog"]').text()).toContain('Ganti Cover')

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    describe('menghapus lelang', () => {
      it('berhasil lalu kembali ke dashboard', async () => {
        aucationApi.deleteAucation.mockResolvedValue(ok)
        const { wrapper, router } = await setup({ aucation: owner })

        await buttonByText(wrapper, 'Hapus Lelang').trigger('click')
        await flush()

        expect(aucationApi.deleteAucation).toHaveBeenCalledWith(9)
        expect(showSuccessDialog).toHaveBeenCalledWith('Lelang berhasil dihapus')
        expect(router.currentRoute.value.path).toBe('/')
      })

      it('tidak berjalan bila konfirmasi dibatalkan', async () => {
        showConfirmDialog.mockResolvedValue(false)
        const { wrapper, router } = await setup({ aucation: owner })

        await buttonByText(wrapper, 'Hapus Lelang').trigger('click')
        await flush()

        expect(aucationApi.deleteAucation).not.toHaveBeenCalled()
        expect(router.currentRoute.value.path).toBe('/aucations/9')
      })

      it('gagal menampilkan dialog error dan tetap di halaman', async () => {
        aucationApi.deleteAucation.mockResolvedValue({ status: 'fail', message: 'Tidak diizinkan' })
        const { wrapper, router } = await setup({ aucation: owner })

        await buttonByText(wrapper, 'Hapus Lelang').trigger('click')
        await flush()

        expect(showErrorDialog).toHaveBeenCalledWith('Tidak diizinkan')
        expect(router.currentRoute.value.path).toBe('/aucations/9')
      })

      it('menonaktifkan tombol saat proses berjalan', async () => {
        const { wrapper } = await setup({ aucation: owner })
        const button = buttonByText(wrapper, 'Hapus Lelang')

        aucationApi.deleteAucation.mockReturnValue(new Promise(() => {}))
        await button.trigger('click')
        await flush()

        expect(button.attributes('disabled')).toBeDefined()
      })
    })
  })
})