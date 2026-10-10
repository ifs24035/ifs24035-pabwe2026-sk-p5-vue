import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showConfirmDialog } from '../../../helpers/toolsHelper'
import { useAuthStore } from '../../auth/states/authStore'
import { useUsersStore } from '../../users/states/usersStore'
import NavbarComponent from './NavbarComponent.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
}))

const Blank = { template: '<div />' }
const routes = ['/', '/profile', '/users', '/auth/login'].map((path) => ({ path, component: Blank }))
const profile = { id: 1, name: 'Kueng', email: 'kueng@del.ac.id', photo: 'https://x.test/k.png' }

const setup = async (state = { profile }) => {
  const pinia = createMockPinia({ users: state })
  const users = useUsersStore(pinia)
  users.fetchProfile = vi.fn().mockResolvedValue({ status: 'success' })
  const auth = useAuthStore(pinia)
  auth.logout = vi.fn().mockResolvedValue()
  const result = await renderWithProviders(NavbarComponent, { pinia, routes })
  return { ...result, users, auth }
}

const openMenu = (wrapper) => wrapper.get('button[aria-haspopup="menu"]').trigger('click')

describe('NavbarComponent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('memuat profil dan menampilkan nama pengguna', async () => {
    const { wrapper, users } = await setup()

    expect(users.fetchProfile).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Kueng')
    expect(wrapper.get('a[href="/"]').text()).toContain('Delcom Auction')
  })

  it('menampilkan teks "Memuat..." saat profil belum tersedia', async () => {
    const { wrapper } = await setup({})
    expect(wrapper.text()).toContain('Memuat...')
  })

  it('memancarkan toggle-sidebar saat tombol menu diklik', async () => {
    const { wrapper } = await setup()

    await wrapper.get('button[aria-label="Buka menu"]').trigger('click')

    expect(wrapper.emitted('toggle-sidebar')).toHaveLength(1)
  })

  it('membuka dan menutup menu akun lewat tombol avatar', async () => {
    const { wrapper } = await setup()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await openMenu(wrapper)
    expect(wrapper.get('[role="menu"]').text()).toContain('kueng@del.ac.id')

    await openMenu(wrapper)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('menutup menu saat latar belakang diklik', async () => {
    const { wrapper } = await setup()
    await openMenu(wrapper)

    await wrapper.get('[data-testid="menu-backdrop"]').trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('menutup menu dan berpindah halaman saat tautan diklik', async () => {
    const { wrapper, router } = await setup()

    await openMenu(wrapper)
    await wrapper.get('a[href="/profile"]').trigger('click')
    await flush()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(router.currentRoute.value.path).toBe('/profile')

    await openMenu(wrapper)
    await wrapper.get('a[href="/users"]').trigger('click')
    await flush()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(router.currentRoute.value.path).toBe('/users')
  })

  it('logout dikonfirmasi: keluar dan pindah ke halaman login', async () => {
    const { wrapper, auth, router } = await setup()
    showConfirmDialog.mockResolvedValue(true)

    await openMenu(wrapper)
    await wrapper.get('button[role="menuitem"]').trigger('click')
    await flush()

    expect(showConfirmDialog).toHaveBeenCalled()
    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/auth/login')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('logout dibatalkan: tetap login', async () => {
    const { wrapper, auth, router } = await setup()
    showConfirmDialog.mockResolvedValue(false)

    await openMenu(wrapper)
    await wrapper.get('button[role="menuitem"]').trigger('click')
    await flush()

    expect(auth.logout).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })
})