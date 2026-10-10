import { describe, it, expect } from 'vitest'
import { renderWithProviders } from './test-utils'
import App from './App.vue'

describe('App', () => {
  it('menampilkan halaman sesuai rute lewat RouterView', async () => {
    const Page = { template: '<h1>Halaman Uji</h1>' }
    const { wrapper } = await renderWithProviders(App, {
      route: '/uji',
      routes: [{ path: '/uji', component: Page }],
    })

    expect(wrapper.text()).toContain('Halaman Uji')
  })
})