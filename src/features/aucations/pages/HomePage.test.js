import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import * as aucationApi from '../api/aucationApi'
import HomePage from './HomePage.vue'

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

const Blank = { template: '<div />' }
const routes = ['/', '/other'].map((path) => ({ path, component: Blank }))

const author = { name: 'Risky', photo: null }
const openItem = {
  id: 1, user_id: 1, title: 'Keyboard Gaming', description: 'Mulus sekali', cover: null,
  start_bid: 200000, closed_at: '2999-01-01 10:00:00', author, bids: [],
}
const closedItem = {
  id: 2, user_id: 9, title: 'Oculus Quest', description: 'Second', cover: null,
  start_bid: 5000000, closed_at: '2000-01-01 10:00:00', author, bids: [],
}
const ok = { status: 'success' }
const list = (aucations) => ({ status: 'success', data: { aucations } })

const setup = async ({ route = '/', items = [openItem, closedItem], profile = { id: 1 }, state = {} } = {}) => {
  aucationApi.getAucations.mockResolvedValue(list(items))
  const pinia = createMockPinia({ users: { profile }, aucations: state })
  const result = await renderWithProviders(HomePage, { pinia, route, routes })
  await flush()
  return result
}

const buttonByText = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))
const stat = (wrapper, label) => wrapper.findAll('dl > div').find((d) => d.text().includes(label)).get('dd').text()

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showConfirmDialog.mockResolvedValue(true)
  })

  describe('pemuatan data dan tab', () => {
    it('memuat semua lelang secara default', async () => {
      await setup()
      expect(aucationApi.getAucations).toHaveBeenCalledWith({})
    })

    it.each([
      ['mine', { isMe: true }],
      ['open', { isClosed: 0 }],
      ['closed', { isClosed: 1 }],
    ])('memuat lelang sesuai tab %s dari URL', async (tab, filters) => {
      await setup({ route: `/?tab=${tab}` })
      expect(aucationApi.getAucations).toHaveBeenCalledWith(filters)
    })

    it('memakai tab semua bila nilai tab pada URL tidak dikenal', async () => {
      const { wrapper } = await setup({ route: '/?tab=ngawur' })

      expect(aucationApi.getAucations).toHaveBeenCalledWith({})
      expect(wrapper.get('[aria-selected="true"]').text()).toBe('Semua Lelang')
    })

    it('mengganti tab lewat klik dan memuat ulang data', async () => {
      const { wrapper, router } = await setup()

      await buttonByText(wrapper, 'Lelang Saya').trigger('click')
      await flush()
      expect(router.currentRoute.value.query.tab).toBe('mine')
      expect(aucationApi.getAucations).toHaveBeenLastCalledWith({ isMe: true })
      expect(wrapper.get('[aria-selected="true"]').text()).toBe('Lelang Saya')

      await buttonByText(wrapper, 'Semua Lelang').trigger('click')
      await flush()
      expect(router.currentRoute.value.query.tab).toBeUndefined()
      expect(aucationApi.getAucations).toHaveBeenLastCalledWith({})
    })

    it('tidak memuat data saat rute sudah berpindah dari beranda', async () => {
      const { router } = await setup()
      expect(aucationApi.getAucations).toHaveBeenCalledTimes(1)

      await router.push('/other?tab=open')
      await flush()

      expect(aucationApi.getAucations).toHaveBeenCalledTimes(1)
    })

    it('menampilkan dialog error bila pemuatan gagal', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'fail', message: 'Gagal memuat lelang' })
      await renderWithProviders(HomePage, { pinia: createMockPinia(), routes })
      await flush()

      expect(showErrorDialog).toHaveBeenCalledWith('Gagal memuat lelang')
    })

    it('menampilkan skeleton saat data sedang dimuat', async () => {
      aucationApi.getAucations.mockReturnValue(new Promise(() => {}))
      const { wrapper } = await renderWithProviders(HomePage, { pinia: createMockPinia(), routes })
      await flush()

      expect(wrapper.find('[data-testid="aucations-loading"]').exists()).toBe(true)
    })
  })

  describe('tampilan daftar', () => {
    it('menampilkan kartu dan ringkasan angka', async () => {
      const { wrapper } = await setup()

      expect(wrapper.findAll('article')).toHaveLength(2)
      expect(stat(wrapper, 'Ditampilkan')).toBe('2')
      expect(stat(wrapper, 'Berlangsung')).toBe('1')
      expect(stat(wrapper, 'Ditutup')).toBe('1')
    })

    it('menandai lelang milik pengguna', async () => {
      const { wrapper } = await setup()
      expect(wrapper.findAll('article').filter((card) => card.text().includes('Milikmu'))).toHaveLength(1)
    })

    it('tidak menandai kepemilikan bila profil belum tersedia', async () => {
      const { wrapper } = await setup({ profile: null })
      expect(wrapper.text()).not.toContain('Milikmu')
    })

    it('menyaring daftar lewat kolom pencarian', async () => {
      const { wrapper } = await setup()
      const search = wrapper.get('input[type="search"]')

      await search.setValue('oculus')
      expect(wrapper.findAll('article')).toHaveLength(1)

      await search.setValue('MULUS')
      expect(wrapper.findAll('article')).toHaveLength(1)
      expect(wrapper.text()).toContain('Keyboard Gaming')

      await search.setValue('  ')
      expect(wrapper.findAll('article')).toHaveLength(2)
    })

    it('menampilkan keadaan kosong bila tidak ada hasil', async () => {
      const { wrapper } = await setup({ items: [] })

      expect(wrapper.text()).toContain('Lelang tidak ditemukan')
      expect(wrapper.find('article').exists()).toBe(false)
    })
  })

  describe('modal tambah dan ubah', () => {
    it('membuka dan menutup modal tambah lelang', async () => {
      const { wrapper } = await setup()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

      await buttonByText(wrapper, 'Buat Lelang').trigger('click')
      expect(wrapper.get('[role="dialog"]').text()).toContain('Buat Lelang Baru')

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('membuka dan menutup modal ubah lelang dari kartu milik sendiri', async () => {
      const { wrapper } = await setup()

      await wrapper.get('button[aria-label="Ubah lelang"]').trigger('click')
      expect(wrapper.get('[role="dialog"]').text()).toContain('Ubah Lelang')
      expect(wrapper.get('#aucation-title').element.value).toBe('Keyboard Gaming')

      await wrapper.get('button[aria-label="Tutup"]').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })
  })

  describe('hapus lelang', () => {
    it('berhasil menghapus satu lelang setelah konfirmasi', async () => {
      aucationApi.deleteAucation.mockResolvedValue(ok)
      const { wrapper } = await setup()

      await wrapper.get('button[aria-label="Hapus lelang"]').trigger('click')
      await flush()

      expect(showConfirmDialog).toHaveBeenCalled()
      expect(aucationApi.deleteAucation).toHaveBeenCalledWith(1)
      expect(showSuccessDialog).toHaveBeenCalledWith('Lelang berhasil dihapus')
    })

    it('tidak menghapus bila konfirmasi dibatalkan', async () => {
      showConfirmDialog.mockResolvedValue(false)
      const { wrapper } = await setup()

      await wrapper.get('button[aria-label="Hapus lelang"]').trigger('click')
      await flush()

      expect(aucationApi.deleteAucation).not.toHaveBeenCalled()
    })

    it('menampilkan dialog error bila penghapusan gagal', async () => {
      aucationApi.deleteAucation.mockResolvedValue({ status: 'fail', message: 'Bukan pemilik' })
      const { wrapper } = await setup()

      await wrapper.get('button[aria-label="Hapus lelang"]').trigger('click')
      await flush()

      expect(showErrorDialog).toHaveBeenCalledWith('Bukan pemilik')
    })
  })

  describe('hapus semua lelang saya', () => {
    const mine = '/?tab=mine'

    it('hanya tampil di tab Lelang Saya yang tidak kosong', async () => {
      const { wrapper } = await setup()
      expect(buttonByText(wrapper, 'Hapus Semua Lelang Saya')).toBeUndefined()

      const mineEmpty = await setup({ route: mine, items: [] })
      expect(buttonByText(mineEmpty.wrapper, 'Hapus Semua Lelang Saya')).toBeUndefined()

      const mineFilled = await setup({ route: mine })
      expect(buttonByText(mineFilled.wrapper, 'Hapus Semua Lelang Saya')).toBeDefined()
    })

    it('berhasil menghapus semua setelah konfirmasi', async () => {
      aucationApi.deleteAllAucations.mockResolvedValue(ok)
      const { wrapper } = await setup({ route: mine })

      await buttonByText(wrapper, 'Hapus Semua Lelang Saya').trigger('click')
      await flush()

      expect(aucationApi.deleteAllAucations).toHaveBeenCalledTimes(1)
      expect(showSuccessDialog).toHaveBeenCalledWith('Semua lelang milikmu berhasil dihapus')
    })

    it('tidak menghapus bila konfirmasi dibatalkan', async () => {
      showConfirmDialog.mockResolvedValue(false)
      const { wrapper } = await setup({ route: mine })

      await buttonByText(wrapper, 'Hapus Semua Lelang Saya').trigger('click')
      await flush()

      expect(aucationApi.deleteAllAucations).not.toHaveBeenCalled()
    })

    it('menonaktifkan tombol saat proses berjalan', async () => {
      const { wrapper } = await setup({ route: mine })
      const button = buttonByText(wrapper, 'Hapus Semua Lelang Saya')

      aucationApi.deleteAllAucations.mockReturnValue(new Promise(() => {}))
      await button.trigger('click')
      await flush()

      expect(button.attributes('disabled')).toBeDefined()
    })
  })
})