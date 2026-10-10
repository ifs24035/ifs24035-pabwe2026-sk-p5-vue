import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch } from '../../../helpers/apiHelper'
import { getUsers, getMe, updateMe, changePhoto, changePassword } from './userApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiFetch: vi.fn() }))

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetch.mockResolvedValue({ status: 'success' })
  })

  it('getUsers memanggil GET /users', async () => {
    await getUsers()
    expect(apiFetch).toHaveBeenCalledWith('/users')
  })

  it('getMe memanggil GET /users/me', async () => {
    await getMe()
    expect(apiFetch).toHaveBeenCalledWith('/users/me')
  })

  it('updateMe memanggil PUT /users/me', async () => {
    await updateMe({ name: 'Kueng', email: 'a@b.c' })
    expect(apiFetch).toHaveBeenCalledWith('/users/me', {
      method: 'PUT',
      body: { name: 'Kueng', email: 'a@b.c' },
    })
  })

  it('changePhoto mengirim FormData berisi field photo', async () => {
    const file = new File(['isi'], 'foto.png', { type: 'image/png' })
    await changePhoto(file)

    const [path, options] = apiFetch.mock.calls[0]
    expect(path).toBe('/users/me/photo')
    expect(options.method).toBe('POST')
    expect(options.formData.get('photo').name).toBe('foto.png')
  })

  it('changePassword memetakan newPassword ke new_password', async () => {
    await changePassword({ password: 'lama123', newPassword: 'baru123' })
    expect(apiFetch).toHaveBeenCalledWith('/users/me/password', {
      method: 'PUT',
      body: { password: 'lama123', new_password: 'baru123' },
    })
  })
})