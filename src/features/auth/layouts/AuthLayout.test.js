import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../test-utils'
import AuthLayout from './AuthLayout.vue'

describe('AuthLayout', () => {
  it('menampilkan banner, daftar fitur, dan konten rute anak', async () => {
    const Child = { template: '<p>Form Anak</p>' }
    const { wrapper } = await renderWithProviders(AuthLayout, {
      route: '/auth/login',
      routes: [{ path: '/auth/login', component: Child }],
    })

    expect(wrapper.text()).toContain('Temukan barang impian')
    expect(wrapper.findAll('li')).toHaveLength(4)
    expect(wrapper.text()).toContain('Lelang Real-time')
    expect(wrapper.text()).toContain('Form Anak')
    expect(wrapper.findAll('img[alt="Logo Delcom Auction"]')).toHaveLength(2)
  })
})