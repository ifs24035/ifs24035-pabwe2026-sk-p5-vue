import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as authApi from '../api/authApi'
import { getAccessToken, putAccessToken } from '../../../helpers/apiHelper'
import { useAuthStore } from './authStore'

vi.mock('../api/authApi', () => ({ login: vi.fn(), register: vi.fn() }))

const credentials = { email: 'a@b.c', password: 'secret' }

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('belum terautentikasi saat tidak ada token', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('membaca token awal dari localStorage', () => {
    putAccessToken('token-lama')
    setActivePinia(createPinia())
    const store = useAuthStore()

    expect(store.token).toBe('token-lama')
    expect(store.isAuthenticated).toBe(true)
  })

  it('login berhasil menyimpan token', async () => {
    authApi.login.mockResolvedValue({ status: 'success', data: { token: 'abc' } })
    const store = useAuthStore()

    const promise = store.login(credentials)
    expect(store.isAuthLogin).toBe(true)
    const response = await promise

    expect(response.status).toBe('success')
    expect(store.isAuthLogin).toBe(false)
    expect(store.token).toBe('abc')
    expect(getAccessToken()).toBe('abc')
    expect(store.errors).toEqual({})
  })

  it('login gagal validasi menyimpan pesan error field', async () => {
    const data = { email: ['Email tidak valid'] }
    authApi.login.mockResolvedValue({ status: 'fail', message: 'Data tidak valid', data })
    const store = useAuthStore()

    await store.login(credentials)

    expect(store.errors).toEqual(data)
    expect(store.token).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('login gagal tanpa data mengosongkan errors', async () => {
    authApi.login.mockResolvedValue({ status: 'fail', message: 'Email atau password salah' })
    const store = useAuthStore()

    await store.login(credentials)

    expect(store.errors).toEqual({})
    expect(store.isAuthenticated).toBe(false)
  })

  it('status error (jaringan) tidak mengisi errors', async () => {
    authApi.login.mockResolvedValue({ status: 'error', message: 'Tidak dapat terhubung ke server' })
    const store = useAuthStore()

    await store.login(credentials)

    expect(store.errors).toEqual({})
  })

  it('register berhasil tidak menyimpan token', async () => {
    authApi.register.mockResolvedValue({ status: 'success', message: 'Berhasil' })
    const store = useAuthStore()

    const promise = store.register({ name: 'Kueng', ...credentials })
    expect(store.isAuthRegister).toBe(true)
    const response = await promise

    expect(response.status).toBe('success')
    expect(store.isAuthRegister).toBe(false)
    expect(store.token).toBeNull()
  })

  it('register gagal menyimpan errors', async () => {
    const data = { email: ['Email sudah digunakan'] }
    authApi.register.mockResolvedValue({ status: 'fail', message: 'Data tidak valid', data })
    const store = useAuthStore()

    await store.register({ name: 'Kueng', ...credentials })

    expect(store.errors).toEqual(data)
  })

  it('logout menghapus token dan errors', async () => {
    putAccessToken('abc')
    setActivePinia(createPinia())
    const store = useAuthStore()
    store.errors = { email: ['x'] }

    await store.logout()

    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.errors).toEqual({})
    expect(store.isAuthLogout).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it('clearErrors mengosongkan errors', () => {
    const store = useAuthStore()
    store.errors = { email: ['x'] }
    store.clearErrors()
    expect(store.errors).toEqual({})
  })
})