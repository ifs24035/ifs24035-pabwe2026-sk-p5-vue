import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { useUsersStore } from '../../users/states/usersStore'
import AucationLayout from './AucationLayout.vue'

const Child = { template: '<p>Konten Halaman</p>' }
const routes = [
  { path: '/', component: Child },
  { path: '/users', component: Child },
]

const setup = async () => {
  const pinia = createMockPinia({ users: { profile: { id: 1, name: 'Kueng', email: 'k@d.id' } } })
  useUsersStore(pinia).fetchProfile = vi.fn().mockResolvedValue({ status: 'success' })
  return renderWithProviders(AucationLayout, { pinia, routes })
}

describe('AucationLayout', () => {
  it('menampilkan navbar, sidebar, dan konten halaman', async () => {
    const { wrapper } = await setup()

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.get('main').text()).toContain('Konten Halaman')
  })

  it('membuka dan menutup sidebar lewat tombol menu dan overlay', async () => {
    const { wrapper } = await setup()
    expect(wrapper.get('aside').classes()).toContain('-translate-x-full')

    await wrapper.get('button[aria-label="Buka menu"]').trigger('click')
    expect(wrapper.get('aside').classes()).toContain('translate-x-0')

    await wrapper.get('[data-testid="sidebar-overlay"]').trigger('click')
    expect(wrapper.get('aside').classes()).toContain('-translate-x-full')
  })

  it('menutup sidebar otomatis saat berpindah halaman', async () => {
    const { wrapper, router } = await setup()
    await wrapper.get('button[aria-label="Buka menu"]').trigger('click')
    expect(wrapper.get('aside').classes()).toContain('translate-x-0')

    await router.push('/users')
    await flush()

    expect(wrapper.get('aside').classes()).toContain('-translate-x-full')
  })
})