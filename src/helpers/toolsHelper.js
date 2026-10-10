import Swal from 'sweetalert2'

const baseOptions = {
  confirmButtonColor: '#4f46e5',
  cancelButtonColor: '#94a3b8',
  customClass: { popup: 'rounded-2xl' },
}

export const showSuccessDialog = (message, title = 'Berhasil') =>
  Swal.fire({ ...baseOptions, icon: 'success', title, text: message, timer: 2000, showConfirmButton: false })

export const showErrorDialog = (message, title = 'Terjadi Kesalahan') =>
  Swal.fire({ ...baseOptions, icon: 'error', title, text: message })

export const showConfirmDialog = async (title, text, confirmText = 'Ya, lanjutkan') => {
  const result = await Swal.fire({
    ...baseOptions,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
  })
  return result.isConfirmed
}

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

// Menerima "2026-10-08 23:00:00" (waktu lokal) maupun ISO "2026-10-15T16:59:00.000Z"
export const parseDate = (value) => {
  if (!value) return null
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDate = (value) => {
  const date = parseDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ''))

// "2026-12-31T23:59" (input datetime-local) -> "2026-12-31 23:59:00" (format API)
export const toApiDateTime = (value) => `${String(value).slice(0, 16).replace('T', ' ')}:00`

const pad = (number) => String(number).padStart(2, '0')

// Nilai closed_at dari API -> "2026-12-31T23:59" (untuk input datetime-local)
export const toInputDateTime = (value) => {
  const date = parseDate(value)
  if (!date) return ''
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Penawaran tertinggi dari detail lelang (bids berisi objek { bid }); 0 bila belum ada
export const getHighestBid = (aucation) => {
  const amounts = (aucation?.bids ?? [])
    .map((item) => Number(item?.bid))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
  return amounts.length ? Math.max(...amounts) : 0
}

export const getCountdown = (closedAt, now = Date.now()) => {
  const date = parseDate(closedAt)
  if (!date) return { closed: false, label: '-' }

  const diff = date.getTime() - now
  if (diff <= 0) return { closed: true, label: 'Lelang ditutup' }

  const minutes = Math.floor(diff / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)

  if (days > 0) return { closed: false, label: `${days} hari ${hours} jam` }
  if (hours > 0) return { closed: false, label: `${hours} jam ${minutes % 60} menit` }
  if (minutes > 0) return { closed: false, label: `${minutes} menit` }
  return { closed: false, label: 'Kurang dari 1 menit' }
}