import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useNow } from './useNow'

const makeHost = (interval) =>
  defineComponent({
    setup() {
      const now = useNow(interval)
      return () => h('span', String(now.value))
    },
  })

describe('useNow', () => {
  afterEach(() => vi.useRealTimers())

  it('memperbarui waktu setiap interval dan berhenti saat unmount', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T10:00:00'))
    const wrapper = mount(makeHost(1000))
    const first = Number(wrapper.text())

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
    expect(Number(wrapper.text())).toBeGreaterThan(first)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('memakai interval default bila tidak diberikan', () => {
    vi.useFakeTimers()
    const wrapper = mount(makeHost())
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
  })
})