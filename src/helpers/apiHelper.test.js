import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, getAccessToken, putAccessToken, removeAccessToken } from './apiHelper'

const ok = (json) => Promise.resolve({ json: () => Promise.resolve(json) })

describe('token storage', () => {
  beforeEach(() => localStorage.clear())

  it('menyimpan, mengambil, dan menghapus token', () => {
    expect(getAccessToken()).toBeNull()
    putAccessToken('abc')
    expect(getAccessToken()).toBe('abc')
    removeAccessToken()
    expect(getAccessToken()).toBeNull()
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('GET tanpa token dan tanpa params', async () => {
    fetch.mockReturnValue(ok({ status: 'success' }))
    const result = await apiFetch('/aucations')

    expect(result).toEqual({ status: 'success' })
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe(`${DELCOM_BASEURL}/aucations`)
    expect(options.method).toBe('GET')
    expect(options.headers.Authorization).toBeUndefined()
    expect(options.body).toBeUndefined()
  })

  it('menyertakan token dan query params yang terisi saja', async () => {
    putAccessToken('token-123')
    fetch.mockReturnValue(ok({ status: 'success' }))
    await apiFetch('/aucations', { params: { is_me: 1, is_closed: '', x: null, y: undefined } })

    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe(`${DELCOM_BASEURL}/aucations?is_me=1`)
    expect(options.headers.Authorization).toBe('Bearer token-123')
  })

  it('mengirim body JSON', async () => {
    fetch.mockReturnValue(ok({ status: 'success' }))
    await apiFetch('/auth/login', { method: 'POST', body: { email: 'a@b.c' } })

    const [, options] = fetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.body).toBe(JSON.stringify({ email: 'a@b.c' }))
  })

  it('mengirim FormData tanpa Content-Type manual', async () => {
    fetch.mockReturnValue(ok({ status: 'success' }))
    const formData = new FormData()
    await apiFetch('/aucations/1/cover', { method: 'POST', formData })

    const [, options] = fetch.mock.calls[0]
    expect(options.body).toBe(formData)
    expect(options.headers['Content-Type']).toBeUndefined()
  })

  it('mengembalikan status error saat fetch gagal', async () => {
    fetch.mockRejectedValue(new Error('network'))
    const result = await apiFetch('/aucations')
    expect(result.status).toBe('error')
  })

  it('mengembalikan status error saat respons bukan JSON', async () => {
    fetch.mockResolvedValue({ json: () => Promise.reject(new Error('bad json')) })
    const result = await apiFetch('/aucations')
    expect(result.status).toBe('error')
  })
})