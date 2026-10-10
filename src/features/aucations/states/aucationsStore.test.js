import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as aucationApi from '../api/aucationApi'
import { useAucationsStore } from './aucationsStore'

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

const ok = { status: 'success' }
const list = [{ id: 1, title: 'Keyboard' }]
const payload = { title: 'Keyboard', description: 'Mulus', startBid: 1000, closedAt: '2026-12-31 23:59:59' }

const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const loadList = async (store, filters) => {
  aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: list } })
  await store.fetchAucations(filters)
  aucationApi.getAucations.mockClear()
}

const loadDetail = async (store, id = 1) => {
  aucationApi.getAucation.mockResolvedValue({ status: 'success', data: { aucation: { id } } })
  await store.fetchAucation(id)
  aucationApi.getAucation.mockClear()
}

describe('aucationsStore', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useAucationsStore()
  })

  describe('fetchAucations', () => {
    it('berhasil mengisi aucations dan mengatur loading', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: list } })

      const promise = store.fetchAucations({ isMe: true })
      expect(store.isAucation).toBe(true)
      await promise

      expect(store.isAucation).toBe(false)
      expect(store.aucations).toEqual(list)
      expect(aucationApi.getAucations).toHaveBeenCalledWith({ isMe: true })
    })

    it('memakai filter kosong secara default', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: [] } })
      await store.fetchAucations()
      expect(aucationApi.getAucations).toHaveBeenCalledWith({})
    })

    it('mode silent tidak mengaktifkan loading', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: list } })

      const promise = store.fetchAucations({}, { silent: true })
      expect(store.isAucation).toBe(false)
      await promise

      expect(store.aucations).toEqual(list)
    })

    it('gagal tidak mengubah aucations', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'fail', message: 'Gagal' })
      const response = await store.fetchAucations()
      expect(response.status).toBe('fail')
      expect(store.aucations).toEqual([])
    })
  })

  describe('cache dan urutan permintaan daftar', () => {
    it('menampilkan data cache seketika lalu menyegarkan dari server', async () => {
      aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: [{ id: 1 }] } })
      await store.fetchAucations({})

      aucationApi.getAucations.mockResolvedValue({
        status: 'success',
        data: { aucations: [{ id: 1 }, { id: 2 }] },
      })
      const promise = store.fetchAucations({})

      expect(store.aucations).toEqual([{ id: 1 }])
      expect(store.isAucation).toBe(false)
      await promise
      expect(store.aucations).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('mengosongkan daftar lama saat memuat tab yang belum punya cache', async () => {
      aucationApi.getAucations.mockResolvedValueOnce({ status: 'success', data: { aucations: [{ id: 1 }] } })
      await store.fetchAucations({ isMe: true })

      const slow = deferred()
      aucationApi.getAucations.mockReturnValueOnce(slow.promise)
      const promise = store.fetchAucations({ isClosed: 1 })

      expect(store.aucations).toEqual([])
      expect(store.isAucation).toBe(true)
      slow.resolve({ status: 'success', data: { aucations: [{ id: 5 }] } })
      await promise
      expect(store.aucations).toEqual([{ id: 5 }])
    })

    it('mengabaikan jawaban lama yang datang terlambat tetapi tetap menyimpannya di cache', async () => {
      const slow = deferred()
      const fast = deferred()
      aucationApi.getAucations.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)

      const first = store.fetchAucations({ isMe: true })
      const second = store.fetchAucations({ isClosed: 0 })

      fast.resolve({ status: 'success', data: { aucations: [{ id: 2 }] } })
      await second
      expect(store.aucations).toEqual([{ id: 2 }])
      expect(store.isAucation).toBe(false)

      slow.resolve({ status: 'success', data: { aucations: [{ id: 1 }] } })
      await first
      expect(store.aucations).toEqual([{ id: 2 }])

      aucationApi.getAucations.mockResolvedValue({ status: 'success', data: { aucations: [] } })
      const revisit = store.fetchAucations({ isMe: true })
      expect(store.aucations).toEqual([{ id: 1 }])
      await revisit
    })

    it('refresh silent menghentikan loading dari permintaan non-silent yang tertimpa', async () => {
      const slow = deferred()
      aucationApi.getAucations
        .mockReturnValueOnce(slow.promise)
        .mockResolvedValueOnce({ status: 'success', data: { aucations: [{ id: 3 }] } })

      const first = store.fetchAucations({})
      expect(store.isAucation).toBe(true)

      await store.fetchAucations({}, { silent: true })
      expect(store.isAucation).toBe(false)

      slow.resolve({ status: 'success', data: { aucations: [{ id: 9 }] } })
      await first
      expect(store.aucations).toEqual([{ id: 3 }])
    })
  })

  describe('fetchAucation', () => {
    it('berhasil mengisi aucation', async () => {
      aucationApi.getAucation.mockResolvedValue({ status: 'success', data: { aucation: { id: 2 } } })

      const promise = store.fetchAucation(2)
      expect(store.isAucation).toBe(true)
      await promise

      expect(store.isAucation).toBe(false)
      expect(store.aucation).toEqual({ id: 2 })
    })

    it('non-silent mengosongkan data lama dan tetap kosong saat gagal', async () => {
      await loadDetail(store, 1)
      aucationApi.getAucation.mockResolvedValue({ status: 'fail', message: 'Tidak ditemukan' })

      const promise = store.fetchAucation(2)
      expect(store.aucation).toBeNull()
      await promise

      expect(store.aucation).toBeNull()
    })

    it('mode silent mempertahankan data lama sampai respons datang', async () => {
      await loadDetail(store, 1)
      aucationApi.getAucation.mockResolvedValue({
        status: 'success',
        data: { aucation: { id: 1, title: 'baru' } },
      })

      const promise = store.fetchAucation(1, { silent: true })
      expect(store.aucation).toEqual({ id: 1 })
      expect(store.isAucation).toBe(false)
      await promise

      expect(store.aucation).toEqual({ id: 1, title: 'baru' })
    })

    it('mengabaikan jawaban detail lama yang datang terlambat', async () => {
      const slow = deferred()
      aucationApi.getAucation
        .mockReturnValueOnce(slow.promise)
        .mockResolvedValueOnce({ status: 'success', data: { aucation: { id: 2 } } })

      const first = store.fetchAucation(1)
      await store.fetchAucation(2)
      expect(store.aucation).toEqual({ id: 2 })
      expect(store.isAucation).toBe(false)

      slow.resolve({ status: 'success', data: { aucation: { id: 1 } } })
      await first
      expect(store.aucation).toEqual({ id: 2 })
    })
  })

  describe('addAucation', () => {
    it('berhasil mengatur flag tanpa refresh bila daftar belum pernah dimuat', async () => {
      aucationApi.addAucation.mockResolvedValue(ok)

      const promise = store.addAucation(payload)
      expect(store.isAucationAdd).toBe(true)
      expect(store.isAucationAdded).toBe(false)
      await promise

      expect(store.isAucationAdd).toBe(false)
      expect(store.isAucationAdded).toBe(true)
      expect(aucationApi.addAucation).toHaveBeenCalledWith(payload)
      expect(aucationApi.getAucations).not.toHaveBeenCalled()
    })

    it('berhasil memuat ulang daftar memakai filter terakhir', async () => {
      await loadList(store, { isMe: true })
      aucationApi.addAucation.mockResolvedValue(ok)

      await store.addAucation(payload)

      expect(aucationApi.getAucations).toHaveBeenCalledWith({ isMe: true })
    })

    it('gagal menyimpan errors, tidak refresh, dan mereset flag Added', async () => {
      await loadList(store, {})
      aucationApi.addAucation.mockResolvedValueOnce(ok)
      await store.addAucation(payload)
      expect(store.isAucationAdded).toBe(true)
      aucationApi.getAucations.mockClear()

      const data = { title: ['Judul wajib diisi'] }
      aucationApi.addAucation.mockResolvedValueOnce({ status: 'fail', message: 'Data tidak valid', data })
      await store.addAucation(payload)

      expect(store.errors).toEqual(data)
      expect(store.isAucationAdded).toBe(false)
      expect(aucationApi.getAucations).not.toHaveBeenCalled()
    })

    it('gagal tanpa data mengosongkan errors', async () => {
      aucationApi.addAucation.mockResolvedValue({ status: 'fail', message: 'Gagal' })
      store.errors = { title: ['lama'] }

      await store.addAucation(payload)

      expect(store.errors).toEqual({})
    })
  })

  describe('changeAucation', () => {
    it('berhasil memuat ulang daftar dan detail yang sedang terbuka', async () => {
      await loadList(store, {})
      await loadDetail(store, 1)
      aucationApi.changeAucation.mockResolvedValue(ok)

      const promise = store.changeAucation('1', payload)
      expect(store.isAucationChange).toBe(true)
      await promise

      expect(store.isAucationChange).toBe(false)
      expect(store.isAucationChanged).toBe(true)
      expect(aucationApi.changeAucation).toHaveBeenCalledWith('1', payload)
      expect(aucationApi.getAucations).toHaveBeenCalledTimes(1)
      expect(aucationApi.getAucation).toHaveBeenCalledWith('1')
    })

    it('tidak memuat ulang detail bila lelang yang terbuka berbeda', async () => {
      await loadDetail(store, 2)
      aucationApi.changeAucation.mockResolvedValue(ok)

      await store.changeAucation(1, payload)

      expect(aucationApi.getAucation).not.toHaveBeenCalled()
    })
  })

  describe('changeCover', () => {
    it('berhasil mengatur flag cover', async () => {
      const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' })
      aucationApi.changeCoverAucation.mockResolvedValue(ok)

      const promise = store.changeCover(1, file)
      expect(store.isAucationChangeCover).toBe(true)
      await promise

      expect(store.isAucationChangeCover).toBe(false)
      expect(store.isAucationChangedCover).toBe(true)
      expect(aucationApi.changeCoverAucation).toHaveBeenCalledWith(1, file)
    })
  })

  describe('deleteAucation', () => {
    it('menghapus detail yang sedang terbuka dan memuat ulang daftar', async () => {
      await loadList(store, {})
      await loadDetail(store, 1)
      aucationApi.deleteAucation.mockResolvedValue(ok)

      const promise = store.deleteAucation(1)
      expect(store.isAucationDelete).toBe(true)
      await promise

      expect(store.isAucationDelete).toBe(false)
      expect(store.isAucationDeleted).toBe(true)
      expect(store.aucation).toBeNull()
      expect(aucationApi.getAucations).toHaveBeenCalledTimes(1)
    })

    it('mempertahankan detail bila yang dihapus lelang lain', async () => {
      await loadDetail(store, 2)
      aucationApi.deleteAucation.mockResolvedValue(ok)

      await store.deleteAucation(1)

      expect(store.aucation).toEqual({ id: 2 })
    })
  })

  describe('bid', () => {
    it('addBid berhasil dan memuat ulang detail', async () => {
      await loadDetail(store, 1)
      aucationApi.addBid.mockResolvedValue(ok)

      const promise = store.addBid(1, 250000)
      expect(store.isBidAdd).toBe(true)
      await promise

      expect(store.isBidAdd).toBe(false)
      expect(store.isBidAdded).toBe(true)
      expect(aucationApi.addBid).toHaveBeenCalledWith(1, 250000)
      expect(aucationApi.getAucation).toHaveBeenCalledWith(1)
    })

    it('deleteBid berhasil mengatur flag', async () => {
      aucationApi.deleteBid.mockResolvedValue(ok)

      const promise = store.deleteBid(1)
      expect(store.isBidDelete).toBe(true)
      await promise

      expect(store.isBidDelete).toBe(false)
      expect(store.isBidDeleted).toBe(true)
      expect(aucationApi.deleteBid).toHaveBeenCalledWith(1)
    })
  })

  describe('deleteAllAucations', () => {
    it('mengosongkan detail dan memuat ulang daftar', async () => {
      await loadList(store, { isMe: true })
      await loadDetail(store, 1)
      aucationApi.deleteAllAucations.mockResolvedValue(ok)

      const promise = store.deleteAllAucations()
      expect(store.isAucationDeleteAll).toBe(true)
      await promise

      expect(store.isAucationDeleteAll).toBe(false)
      expect(store.isAucationDeletedAll).toBe(true)
      expect(store.aucation).toBeNull()
      expect(aucationApi.getAucations).toHaveBeenCalledWith({ isMe: true })
    })
  })

  it('clearErrors mengosongkan errors', () => {
    store.errors = { title: ['x'] }
    store.clearErrors()
    expect(store.errors).toEqual({})
  })
})