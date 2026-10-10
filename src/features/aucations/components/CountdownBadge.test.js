import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CountdownBadge from './CountdownBadge.vue'

describe('CountdownBadge', () => {
  it('menampilkan gaya hijau untuk lelang berlangsung', () => {
    const wrapper = mount(CountdownBadge, { props: { countdown: { closed: false, label: '2 jam 30 menit' } } })

    expect(wrapper.text()).toBe('2 jam 30 menit')
    expect(wrapper.classes()).toContain('bg-emerald-100')
  })

  it('menampilkan gaya abu-abu untuk lelang ditutup', () => {
    const wrapper = mount(CountdownBadge, { props: { countdown: { closed: true, label: 'Lelang ditutup' } } })

    expect(wrapper.text()).toBe('Lelang ditutup')
    expect(wrapper.classes()).toContain('bg-slate-100')
  })
})