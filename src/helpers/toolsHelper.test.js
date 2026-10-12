import { describe, it, expect, vi, beforeEach } from 'vitest'
import Swal from 'sweetalert2'
import {
  showSuccessDialog,
  showErrorDialog,
  showConfirmDialog,
  formatRupiah,
  parseDate,
  formatDate,
  isValidEmail,
  toApiDateTime,
  toInputDateTime,
  getHighestBid,
  getCountdown,
} from './toolsHelper'

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }))

describe('dialog helpers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('showSuccessDialog memakai icon success', async () => {
    await showSuccessDialog('Selesai')
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Berhasil', text: 'Selesai' }),
    )
  })

  it('showErrorDialog memakai icon error', async () => {
    await showErrorDialog('Gagal', 'Oops')
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error', title: 'Oops', text: 'Gagal' }),
    )
  })

  it('showConfirmDialog mengembalikan true saat dikonfirmasi', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true })
    expect(await showConfirmDialog('Hapus?', 'Yakin?')).toBe(true)
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ showCancelButton: true, confirmButtonText: 'Ya, lanjutkan' }),
    )
  })

  it('showConfirmDialog mengembalikan false saat dibatalkan', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false })
    expect(await showConfirmDialog('Hapus?', 'Yakin?', 'Hapus')).toBe(false)
  })
})

describe('formatRupiah', () => {
  it('memformat angka ke rupiah', () => {
    expect(formatRupiah(10000)).toMatch(/Rp\s?10\.000/)
  })

  it('menganggap nilai tidak valid sebagai 0', () => {
    expect(formatRupiah(null)).toMatch(/Rp\s?0/)
    expect(formatRupiah('abc')).toMatch(/Rp\s?0/)
  })
})

describe('parseDate', () => {
  it('membaca format lokal API', () => {
    const date = parseDate('2026-10-08 23:00:00')
    expect(date).toBeInstanceOf(Date)
    expect(date.getHours()).toBe(23)
  })

  it('membaca format ISO UTC', () => {
    expect(parseDate('2026-10-15T16:59:00.000Z').toISOString()).toBe('2026-10-15T16:59:00.000Z')
  })

  it('mengembalikan null untuk kosong atau tidak valid', () => {
    expect(parseDate('')).toBeNull()
    expect(parseDate(null)).toBeNull()
    expect(parseDate('bukan-tanggal')).toBeNull()
  })
})

describe('formatDate', () => {
  it('memformat tanggal valid', () => {
    expect(formatDate('2026-12-31 23:59:59')).toMatch(/2026/)
  })

  it('mengembalikan "-" untuk kosong atau tidak valid', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(null)).toBe('-')
    expect(formatDate('bukan-tanggal')).toBe('-')
  })
})

describe('isValidEmail', () => {
  it('menerima email yang valid', () => {
    expect(isValidEmail('kueng@students.del.ac.id')).toBe(true)
  })

  it('menolak email yang tidak valid atau kosong', () => {
    expect(isValidEmail('bukan-email')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail(null)).toBe(false)
  })
})

describe('toApiDateTime', () => {
  it('mengubah nilai datetime-local ke format API', () => {
    expect(toApiDateTime('2026-12-31T23:59')).toBe('2026-12-31 23:59:00')
  })

  it('mengabaikan detik bila ada', () => {
    expect(toApiDateTime('2026-12-31T23:59:30')).toBe('2026-12-31 23:59:00')
  })
})

describe('toInputDateTime', () => {
  it('mengubah closed_at API ke nilai input datetime-local', () => {
    expect(toInputDateTime('2026-12-31 23:59:59')).toBe('2026-12-31T23:59')
  })

  it('menambahkan nol di depan untuk angka satu digit', () => {
    expect(toInputDateTime('2026-01-05 08:05:00')).toBe('2026-01-05T08:05')
  })

  it('mengembalikan string kosong bila tidak valid', () => {
    expect(toInputDateTime('')).toBe('')
  })
})

describe('getHighestBid', () => {
  it('mengambil nominal terbesar', () => {
    expect(getHighestBid({ bids: [{ bid: 5000 }, { bid: 7000 }, { bid: 6000 }] })).toBe(7000)
  })

  it('mengabaikan item yang bukan objek bid', () => {
    expect(getHighestBid({ bids: [null, { bid: 10 }] })).toBe(10)
    expect(getHighestBid({ bids: [2, 3] })).toBe(0)
  })

  it('mengembalikan 0 bila tidak ada data', () => {
    expect(getHighestBid(null)).toBe(0)
    expect(getHighestBid({})).toBe(0)
    expect(getHighestBid({ bids: [] })).toBe(0)
  })
})

describe('getCountdown', () => {
  const now = new Date('2026-10-08T10:00:00').getTime()

  it('menandai lelang yang sudah lewat sebagai ditutup', () => {
    expect(getCountdown('2026-10-08 09:00:00', now)).toEqual({ closed: true, label: 'Lelang ditutup' })
  })

  it('menampilkan hari dan jam', () => {
    expect(getCountdown('2026-10-10 13:00:00', now)).toEqual({ closed: false, label: '2 hari 3 jam' })
  })

  it('menampilkan jam dan menit', () => {
    expect(getCountdown('2026-10-08 12:30:00', now)).toEqual({ closed: false, label: '2 jam 30 menit' })
  })

  it('menampilkan menit', () => {
    expect(getCountdown('2026-10-08 10:45:00', now)).toEqual({ closed: false, label: '45 menit' })
  })

  it('menampilkan kurang dari 1 menit', () => {
    expect(getCountdown('2026-10-08 10:00:30', now)).toEqual({
      closed: false,
      label: 'Kurang dari 1 menit',
    })
  })

  it('memakai waktu sekarang secara default', () => {
    expect(getCountdown('2999-01-01 00:00:00').closed).toBe(false)
  })

  it('mengembalikan tanda "-" bila tanggal tidak valid', () => {
    expect(getCountdown('')).toEqual({ closed: false, label: '-' })
  })
})