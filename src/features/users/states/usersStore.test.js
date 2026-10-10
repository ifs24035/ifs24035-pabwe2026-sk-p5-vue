import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as userApi from '../api/userApi'
import { useUsersStore } from './usersStore'

vi.mock('../api/userApi', () => ({
  getUsers: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
  changePhoto: vi.fn(),
  changePassword: vi.fn(),
}))

const profile = { id: 1, name: 'Kueng', email: 'a@b.c' }

describe('usersStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchUsers berhasil mengisi users', async () => {
    userApi.getUsers.mockResolvedValue({ status: 'success', data: { users: [profile] } })
    const store = useUsersStore()

    const promise = store.fetchUsers()
    expect(store.isUsers).toBe(true)
    await promise

    expect(store.isUsers).toBe(false)
    expect(store.users).toEqual([profile])
  })

  it('fetchUsers gagal tidak mengubah users', async () => {
    userApi.getUsers.mockResolvedValue({ status: 'fail', message: 'Gagal' })
    const store = useUsersStore()

    const response = await store.fetchUsers()

    expect(response.status).toBe('fail')
    expect(store.users).toEqual([])
  })

  it('fetchProfile berhasil mengisi profile', async () => {
    userApi.getMe.mockResolvedValue({ status: 'success', data: { user: profile } })
    const store = useUsersStore()

    const promise = store.fetchProfile()
    expect(store.isProfile).toBe(true)
    await promise

    expect(store.isProfile).toBe(false)
    expect(store.profile).toEqual(profile)
  })

  it('fetchProfile gagal membiarkan profile null', async () => {
    userApi.getMe.mockResolvedValue({ status: 'fail', message: 'Gagal' })
    const store = useUsersStore()

    await store.fetchProfile()

    expect(store.profile).toBeNull()
  })

  it('selectUser dan clearUser mengatur user terpilih', () => {
    const store = useUsersStore()
    store.selectUser(profile)
    expect(store.user).toEqual(profile)
    store.clearUser()
    expect(store.user).toBeNull()
  })

  it('updateProfile berhasil lalu mengambil ulang profil', async () => {
    userApi.updateMe.mockResolvedValue({ status: 'success' })
    userApi.getMe.mockResolvedValue({ status: 'success', data: { user: profile } })
    const store = useUsersStore()

    const promise = store.updateProfile({ name: 'Kueng', email: 'a@b.c' })
    expect(store.isProfileChange).toBe(true)
    await promise

    expect(store.isProfileChange).toBe(false)
    expect(userApi.updateMe).toHaveBeenCalledWith({ name: 'Kueng', email: 'a@b.c' })
    expect(userApi.getMe).toHaveBeenCalledTimes(1)
    expect(store.profile).toEqual(profile)
    expect(store.errors).toEqual({})
  })

  it('updateProfile gagal menyimpan errors dan tidak mengambil ulang profil', async () => {
    const data = { email: ['Email sudah digunakan'] }
    userApi.updateMe.mockResolvedValue({ status: 'fail', message: 'Data tidak valid', data })
    const store = useUsersStore()

    await store.updateProfile({ name: 'Kueng', email: 'a@b.c' })

    expect(store.errors).toEqual(data)
    expect(userApi.getMe).not.toHaveBeenCalled()
  })

  it('changePhoto berhasil lalu mengambil ulang profil', async () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    userApi.changePhoto.mockResolvedValue({ status: 'success' })
    userApi.getMe.mockResolvedValue({ status: 'success', data: { user: profile } })
    const store = useUsersStore()

    const promise = store.changePhoto(file)
    expect(store.isPhotoChange).toBe(true)
    await promise

    expect(store.isPhotoChange).toBe(false)
    expect(userApi.changePhoto).toHaveBeenCalledWith(file)
    expect(userApi.getMe).toHaveBeenCalledTimes(1)
  })

  it('changePassword berhasil tanpa mengambil ulang profil', async () => {
    userApi.changePassword.mockResolvedValue({ status: 'success' })
    const store = useUsersStore()

    const promise = store.changePassword({ password: 'lama', newPassword: 'baru' })
    expect(store.isPasswordChange).toBe(true)
    await promise

    expect(store.isPasswordChange).toBe(false)
    expect(userApi.getMe).not.toHaveBeenCalled()
  })

  it('changePassword gagal tanpa data mengosongkan errors', async () => {
    userApi.changePassword.mockResolvedValue({ status: 'fail', message: 'Kata sandi salah' })
    const store = useUsersStore()
    store.errors = { password: ['lama'] }

    await store.changePassword({ password: 'x', newPassword: 'y' })

    expect(store.errors).toEqual({})
  })

  it('clearErrors mengosongkan errors', () => {
    const store = useUsersStore()
    store.errors = { name: ['x'] }
    store.clearErrors()
    expect(store.errors).toEqual({})
  })
})