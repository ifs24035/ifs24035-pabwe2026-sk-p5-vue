import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AucationCover from './AucationCover.vue'

describe('AucationCover', () => {
  it('menampilkan gambar cover', () => {
    const wrapper = mount(AucationCover, { props: { cover: 'https://x.test/c.jpg', title: 'Keyboard' } })

    expect(wrapper.get('img').attributes('src')).toBe('https://x.test/c.jpg')
    expect(wrapper.get('img').attributes('alt')).toBe('Keyboard')
  })

  it('menampilkan placeholder bila cover kosong', () => {
    const wrapper = mount(AucationCover, { props: { title: 'Keyboard' } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Tanpa cover untuk Keyboard')
  })

  it('memakai judul kosong secara default', () => {
    const wrapper = mount(AucationCover)
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Tanpa cover untuk ')
  })
})