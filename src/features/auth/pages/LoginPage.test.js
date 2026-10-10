import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAuthStore } from '../states/authStore'
import LoginPage from './LoginPage.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const routes = [
  { path: '/', component: { template: '<div />' } },
  { path: '/auth/login', component: LoginPage },
  { path: '/auth/register', component: { template: '<div />' } },
]

const setup = async (initialState) => {
  const result = await renderWithProviders(LoginPage, { route: '/auth/login', routes, initialState })
  const store = useAuthStore(result.pinia)
  return { ...result, store }
}

const fill = async (wrapper, email, password) => {
  await wrapper.get('#login-email-input').setValue(email)
  await wrapper.get('#login-password-input').setValue(password)
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan form login dan tautan daftar', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Masuk')
    expect(wrapper.get('a[href="/auth/register"]').text()).toContain('Daftar sekarang')
  })

  it('menyediakan id elemen yang dipakai oleh audit otomatis', async () => {
    const { wrapper } = await setup()

    expect(wrapper.find('#login-email-input').exists()).toBe(true)
    expect(wrapper.find('#login-password-input').exists()).toBe(true)
    expect(wrapper.find('#login-submit-button').exists()).toBe(true)
  })

  it('membersihkan errors lama saat halaman dibuka', async () => {
    const { store } = await setup({ auth: { errors: { email: ['lama'] } } })
    expect(store.errors).toEqual({})
  })

  it('menampilkan pesan validasi untuk form yang tidak valid', async () => {
    const { wrapper, store } = await setup()
    store.login = vi.fn()

    await fill(wrapper, 'salah', '123')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Format email tidak valid')
    expect(wrapper.text()).toContain('Kata sandi minimal 6 karakter')
    expect(store.login).not.toHaveBeenCalled()
  })

  it('login berhasil menampilkan dialog dan pindah ke beranda', async () => {
    const { wrapper, store, router } = await setup()
    store.login = vi.fn().mockResolvedValue({ status: 'success' })

    await fill(wrapper, 'a@b.co', 'rahasia')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(store.login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'rahasia' })
    expect(showSuccessDialog).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('login gagal menampilkan dialog error dan tetap di halaman', async () => {
    const { wrapper, store, router } = await setup()
    store.login = vi.fn().mockResolvedValue({ status: 'fail', message: 'Email atau kata sandi salah' })

    await fill(wrapper, 'a@b.co', 'rahasia')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(showErrorDialog).toHaveBeenCalledWith('Email atau kata sandi salah')
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('menampilkan pesan error dari server di bawah field', async () => {
    const { wrapper } = await setup({ auth: { errors: { email: ['Email tidak terdaftar'] } } })
    const store = useAuthStore()
    store.errors = { email: ['Email tidak terdaftar'] }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Email tidak terdaftar')
  })

  it('tombol mata menampilkan dan menyembunyikan kata sandi', async () => {
    const { wrapper } = await setup()
    expect(wrapper.get('#login-password-input').attributes('type')).toBe('password')

    await wrapper.get('button[aria-label="Tampilkan kata sandi"]').trigger('click')
    expect(wrapper.get('#login-password-input').attributes('type')).toBe('text')

    await wrapper.get('button[aria-label="Sembunyikan kata sandi"]').trigger('click')
    expect(wrapper.get('#login-password-input').attributes('type')).toBe('password')
  })

  it('menonaktifkan tombol saat proses login berjalan', async () => {
    const { wrapper } = await setup({ auth: { isAuthLogin: true } })
    const submit = wrapper.get('button[type="submit"]')

    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.text()).toContain('Memproses...')
  })
})