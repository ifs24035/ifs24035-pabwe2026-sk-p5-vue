import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../test-utils'
import SidebarComponent from './SidebarComponent.vue'

const Blank = { template: '<div />' }
const routes = [
  { path: '/', component: Blank },
  { path: '/aucations/:id', component: Blank },
  { path: '/users', component: Blank },
  { path: '/profile', component: Blank },
]

const render = (route = '/', props = {}) => renderWithProviders(SidebarComponent, { route, routes, props })

const activeLabels = (wrapper) =>
  wrapper
    .findAll('nav a')
    .filter((link) => link.classes().includes('from-brand-600'))
    .map((link) => link.text())

describe('SidebarComponent', () => {
  it('menampilkan empat menu navigasi', async () => {
    const { wrapper } = await render()

    expect(wrapper.findAll('nav a').map((link) => link.text())).toEqual([
      'Dashboard Lelang',
      'Lelang Saya',
      'Daftar Pengguna',
      'Profil Saya',
    ])
  })

  it('menandai Dashboard aktif di beranda', async () => {
    const { wrapper } = await render('/')
    expect(activeLabels(wrapper)).toEqual(['Dashboard Lelang'])
  })

  it('menandai Lelang Saya aktif saat tab mine dipilih', async () => {
    const { wrapper } = await render('/?tab=mine')
    expect(activeLabels(wrapper)).toEqual(['Lelang Saya'])
  })

  it('menandai Dashboard aktif di halaman detail lelang', async () => {
    const { wrapper } = await render('/aucations/5')
    expect(activeLabels(wrapper)).toEqual(['Dashboard Lelang'])
  })

  it('menandai Daftar Pengguna aktif di halaman pengguna', async () => {
    const { wrapper } = await render('/users')
    expect(activeLabels(wrapper)).toEqual(['Daftar Pengguna'])
  })

  it('menandai Profil Saya aktif di halaman profil', async () => {
    const { wrapper } = await render('/profile')
    expect(activeLabels(wrapper)).toEqual(['Profil Saya'])
  })

  it('tertutup secara default dan tanpa overlay', async () => {
    const { wrapper } = await render()

    expect(wrapper.find('[data-testid="sidebar-overlay"]').exists()).toBe(false)
    expect(wrapper.get('aside').classes()).toContain('-translate-x-full')
  })

  it('terbuka dengan overlay dan memancarkan close dari overlay maupun tombol X', async () => {
    const { wrapper } = await render('/', { open: true })

    expect(wrapper.get('aside').classes()).toContain('translate-x-0')

    await wrapper.get('[data-testid="sidebar-overlay"]').trigger('click')
    await wrapper.get('button[aria-label="Tutup menu"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})