import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog } from '../../../helpers/toolsHelper'
import { useUsersStore } from '../states/usersStore'
import UsersPage from './UsersPage.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showErrorDialog: vi.fn(),
}))

const users = [
  { id: 1, name: 'Kueng', email: 'kueng@del.ac.id', photo: 'https://x.test/k.png', created_at: '2026-01-05 08:05:00' },
  { id: 2, name: 'Rina Sari', email: 'rina@del.ac.id', photo: null },
]

const setup = async ({ state = {}, fetchResult = { status: 'success' } } = {}) => {
  const pinia = createMockPinia({ users: { users, ...state } })
  const store = useUsersStore(pinia)
  store.fetchUsers = vi.fn().mockResolvedValue(fetchResult)
  const result = await renderWithProviders(UsersPage, { pinia })
  await flush()
  return { ...result, store }
}

describe('UsersPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('memuat dan menampilkan daftar pengguna beserta jumlahnya', async () => {
    const { wrapper, store } = await setup()

    expect(store.fetchUsers).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('2 pengguna terdaftar')
    expect(wrapper.text()).toContain('Kueng')
    expect(wrapper.text()).toContain('rina@del.ac.id')
    expect(showErrorDialog).not.toHaveBeenCalled()
  })

  it('menampilkan dialog error bila pemuatan gagal', async () => {
    await setup({ fetchResult: { status: 'fail', message: 'Gagal memuat' } })
    expect(showErrorDialog).toHaveBeenCalledWith('Gagal memuat')
  })

  it('menampilkan skeleton saat sedang memuat', async () => {
    const { wrapper } = await setup({ state: { isUsers: true } })

    expect(wrapper.find('[data-testid="users-loading"]').exists()).toBe(true)
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('menyaring pengguna berdasarkan nama atau email', async () => {
    const { wrapper } = await setup()
    const search = wrapper.get('input[type="search"]')

    await search.setValue('rina')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Kueng')

    await search.setValue('del.ac.id')
    expect(wrapper.findAll('li')).toHaveLength(2)

    await search.setValue('   ')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('menampilkan keadaan kosong bila tidak ada yang cocok', async () => {
    const { wrapper } = await setup()

    await wrapper.get('input[type="search"]').setValue('zzz')

    expect(wrapper.text()).toContain('Pengguna tidak ditemukan')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('membuka dialog detail saat kartu diklik lalu menutupnya dengan tombol X', async () => {
    const { wrapper, store } = await setup()

    await wrapper.get('li button').trigger('click')
    const dialog = wrapper.get('[role="dialog"]')
    expect(store.user.id).toBe(1)
    expect(dialog.text()).toContain('kueng@del.ac.id')
    expect(dialog.text()).toContain('Bergabung')

    await wrapper.get('button[aria-label="Tutup"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(store.user).toBeNull()
  })

  it('menutup dialog saat latar diklik tetapi tidak saat isi diklik', async () => {
    const { wrapper } = await setup()
    await wrapper.get('li button').trigger('click')

    await wrapper.get('[role="dialog"] h2').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    await wrapper.get('[role="dialog"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('menampilkan tanggal "-" bila created_at tidak tersedia', async () => {
    const { wrapper } = await setup()

    await wrapper.findAll('li button')[1].trigger('click')

    expect(wrapper.get('[role="dialog"]').text()).toContain('Bergabung -')
  })
})