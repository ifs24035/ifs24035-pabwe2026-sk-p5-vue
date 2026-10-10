import { describe, it, expect, vi, beforeEach } from 'vitest'
import { showErrorDialog, showSuccessDialog } from './toolsHelper'
import { notifyResponse } from './notifyHelper'

vi.mock('./toolsHelper', () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

describe('notifyResponse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan dialog sukses dan mengembalikan true', () => {
    expect(notifyResponse({ status: 'success' }, 'Berhasil disimpan')).toBe(true)
    expect(showSuccessDialog).toHaveBeenCalledWith('Berhasil disimpan')
    expect(showErrorDialog).not.toHaveBeenCalled()
  })

  it('menampilkan dialog error dan mengembalikan false', () => {
    expect(notifyResponse({ status: 'fail', message: 'Gagal' }, 'Berhasil')).toBe(false)
    expect(showErrorDialog).toHaveBeenCalledWith('Gagal')
    expect(showSuccessDialog).not.toHaveBeenCalled()
  })
})