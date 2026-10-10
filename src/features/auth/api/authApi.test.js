import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from '../../../helpers/apiHelper'
import { login, register } from './authApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiFetch: vi.fn() }))

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetch.mockResolvedValue({ status: 'success' })
  })

  it('login memanggil POST /auth/login', async () => {
    const result = await login({ email: 'a@b.c', password: 'secret' })

    expect(result).toEqual({ status: 'success' })
    expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'secret' },
    })
  })

  it('register memanggil POST /auth/register', async () => {
    await register({ name: 'Kueng', email: 'a@b.c', password: 'secret' })

    expect(apiFetch).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { name: 'Kueng', email: 'a@b.c', password: 'secret' },
    })
  })
})