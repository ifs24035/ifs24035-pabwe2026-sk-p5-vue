import { describe, it, expect } from 'vitest'
import { useInput } from './useInput'

describe('useInput', () => {
  it('memakai nilai default', () => {
    const [value] = useInput('halo')
    expect(value.value).toBe('halo')
  })

  it('default-nya string kosong', () => {
    const [value] = useInput()
    expect(value.value).toBe('')
  })

  it('onChange menerima event', () => {
    const [value, onChange] = useInput('')
    onChange({ target: { value: 'dari event' } })
    expect(value.value).toBe('dari event')
  })

  it('onChange menerima nilai langsung', () => {
    const [value, onChange] = useInput('')
    onChange('nilai langsung')
    expect(value.value).toBe('nilai langsung')
  })

  it('reset mengembalikan ke nilai awal', () => {
    const [value, onChange, reset] = useInput('awal')
    onChange('berubah')
    reset()
    expect(value.value).toBe('awal')
  })
})