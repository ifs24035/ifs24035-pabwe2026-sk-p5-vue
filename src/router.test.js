import { describe, it, expect, beforeEach } from 'vitest'
import router, { authGuard, routes } from './router'
import { putAccessToken } from './helpers/apiHelper'

const to = (meta = {}) => ({ meta })

describe('authGuard', () => {
  beforeEach(() => localStorage.clear())

  it('mengarahkan ke login saat halaman butuh login tetapi belum login', () => {
    expect(authGuard(to({ requiresAuth: true }))).toBe('/auth/login')
  })

  it('mengizinkan halaman terproteksi saat sudah login', () => {
    putAccessToken('token')
    expect(authGuard(to({ requiresAuth: true }))).toBe(true)
  })

  it('mengarahkan ke beranda saat halaman tamu dibuka dalam keadaan login', () => {
    putAccessToken('token')
    expect(authGuard(to({ guestOnly: true }))).toBe('/')
  })

  it('mengizinkan halaman tamu saat belum login', () => {
    expect(authGuard(to({ guestOnly: true }))).toBe(true)
  })

  it('mengizinkan halaman tanpa meta khusus', () => {
    expect(authGuard(to())).toBe(true)
  })
})

describe('routes', () => {
  it('mendefinisikan rute auth, lelang, dan wildcard 404', () => {
    const paths = routes.map((route) => route.path)
    expect(paths).toEqual(['/auth', '/', '/:pathMatch(.*)*'])

    const children = routes[1].children.map((route) => route.path)
    expect(children).toEqual(['', 'aucations/:aucationId', 'users', 'profile'])
  })
})

describe('router', () => {
  beforeEach(() => localStorage.clear())

  it('mengarahkan pengguna yang belum login ke halaman login', async () => {
    await router.push('/users')
    expect(router.currentRoute.value.fullPath).toBe('/auth/login')
  })

  it('mengarahkan /auth ke /auth/login', async () => {
    await router.push('/auth')
    expect(router.currentRoute.value.fullPath).toBe('/auth/login')
  })

  it('mengarahkan pengguna yang sudah login dari halaman login ke beranda', async () => {
    putAccessToken('token')
    await router.push('/users')
    await router.push('/auth/login')
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('mengenali rute detail lelang dan rute yang tidak ada', async () => {
    putAccessToken('token')

    await router.push('/aucations/12')
    expect(router.currentRoute.value.params.aucationId).toBe('12')

    await router.push('/halaman-ngawur')
    expect(router.currentRoute.value.matched[0].path).toBe('/:pathMatch(.*)*')
  })
})