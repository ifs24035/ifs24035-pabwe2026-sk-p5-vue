import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserAvatar from './UserAvatar.vue'

describe('UserAvatar', () => {
  it('menampilkan foto bila tersedia', () => {
    const wrapper = mount(UserAvatar, { props: { name: 'Kueng', photo: 'https://x.test/a.png' } })
    const img = wrapper.get('img')

    expect(img.attributes('src')).toBe('https://x.test/a.png')
    expect(img.attributes('alt')).toBe('Kueng')
  })

  it('menampilkan inisial bila foto kosong', () => {
    const wrapper = mount(UserAvatar, { props: { name: 'kueng' } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('K')
  })

  it('menampilkan tanda tanya bila nama kosong dan memakai ukuran kustom', () => {
    const wrapper = mount(UserAvatar, { props: { size: 'h-24 w-24' } })

    expect(wrapper.text()).toBe('?')
    expect(wrapper.classes()).toContain('h-24')
  })
})