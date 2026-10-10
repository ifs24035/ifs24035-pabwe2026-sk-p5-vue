import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from '../../../helpers/apiHelper'
import {
  getAucations,
  getAucation,
  addAucation,
  changeAucation,
  changeCoverAucation,
  deleteAucation,
  addBid,
  deleteBid,
  deleteAllAucations,
} from './aucationApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiFetch: vi.fn() }))

const payload = {
  title: 'Keyboard',
  description: 'Mulus',
  startBid: 200000,
  closedAt: '2026-12-31 23:59:59',
}

const body = {
  title: 'Keyboard',
  description: 'Mulus',
  start_bid: 200000,
  closed_at: '2026-12-31 23:59:59',
}

describe('aucationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetch.mockResolvedValue({ status: 'success' })
  })

  it('getAucations tanpa filter', async () => {
    await getAucations()
    expect(apiFetch).toHaveBeenCalledWith('/aucations', {
      params: { is_me: undefined, is_closed: undefined },
    })
  })

  it('getAucations dengan filter is_me dan is_closed', async () => {
    await getAucations({ isMe: true, isClosed: 0 })
    expect(apiFetch).toHaveBeenCalledWith('/aucations', { params: { is_me: 1, is_closed: 0 } })
  })

  it('getAucation memanggil GET /aucations/:id', async () => {
    await getAucation(3)
    expect(apiFetch).toHaveBeenCalledWith('/aucations/3')
  })

  it('addAucation memanggil POST /aucations dengan body snake_case', async () => {
    await addAucation(payload)
    expect(apiFetch).toHaveBeenCalledWith('/aucations', { method: 'POST', body })
  })

  it('changeAucation memanggil PUT /aucations/:id', async () => {
    await changeAucation(3, payload)
    expect(apiFetch).toHaveBeenCalledWith('/aucations/3', { method: 'PUT', body })
  })

  it('changeCoverAucation mengirim FormData berisi field cover', async () => {
    const file = new File(['isi'], 'cover.jpg', { type: 'image/jpeg' })
    await changeCoverAucation(3, file)

    const [path, options] = apiFetch.mock.calls[0]
    expect(path).toBe('/aucations/3/cover')
    expect(options.method).toBe('POST')
    expect(options.formData.get('cover').name).toBe('cover.jpg')
  })

  it('deleteAucation memanggil DELETE /aucations/:id', async () => {
    await deleteAucation(3)
    expect(apiFetch).toHaveBeenCalledWith('/aucations/3', { method: 'DELETE' })
  })

  it('addBid memanggil POST /aucations/:id/bids', async () => {
    await addBid(3, 250000)
    expect(apiFetch).toHaveBeenCalledWith('/aucations/3/bids', {
      method: 'POST',
      body: { bid: 250000 },
    })
  })

  it('deleteBid memanggil DELETE /aucations/:id/bids', async () => {
    await deleteBid(3)
    expect(apiFetch).toHaveBeenCalledWith('/aucations/3/bids', { method: 'DELETE' })
  })

  it('deleteAllAucations memanggil DELETE /aucations', async () => {
    await deleteAllAucations()
    expect(apiFetch).toHaveBeenCalledWith('/aucations', { method: 'DELETE' })
  })
})