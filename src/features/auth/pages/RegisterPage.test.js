import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAuthStore } from '../states/authStore'
import RegisterPage from './RegisterPage.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const routes = [
  { path: '/auth/login', component: { template: '<div />' } },
  { path: '/auth/register', component: RegisterPage },
]

const setup = async (initialState) => {
  const result = await renderWithProviders(RegisterPage, { route: '/auth/register', routes, initialState })
  return { ...result, store: useAuthStore(result.pinia) }
}

const fill = async (wrapper, { name, email, password, confirm }) => {
  await wrapper.get('#name').setValue(name)
  await wrapper.get('#email').setValue(email)
  await wrapper.get('#password').setValue(password)
  await wrapper.get('#confirmPassword').setValue(confirm)
}

const valid = { name: ' Kueng ', email: 'a@b.co', password: 'rahasia', confirm: 'rahasia' }

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan form dan tautan masuk', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Buat Akun')
    expect(wrapper.get('a[href="/auth/login"]').text()).toContain('Masuk di sini')
  })

  it('membersihkan errors lama saat halaman dibuka', async () => {
    const { store } = await setup({ auth: { errors: { name: ['lama'] } } })
    expect(store.errors).toEqual({})
  })

  it('menampilkan semua pesan validasi untuk form kosong', async () => {
    const { wrapper, store } = await setup()
    store.register = vi.fn()

    await fill(wrapper, { name: '  ', email: 'x', password: '1', confirm: '2' })
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Nama lengkap wajib diisi')
    expect(wrapper.text()).toContain('Format email tidak valid')
    expect(wrapper.text()).toContain('Kata sandi minimal 6 karakter')
    expect(wrapper.text()).toContain('Konfirmasi kata sandi tidak sama')
    expect(store.register).not.toHaveBeenCalled()
  })

  it('registrasi berhasil menampilkan dialog dan pindah ke login', async () => {
    const { wrapper, store, router } = await setup()
    store.register = vi.fn().mockResolvedValue({ status: 'success' })

    await fill(wrapper, valid)
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(store.register).toHaveBeenCalledWith({ name: 'Kueng', email: 'a@b.co', password: 'rahasia' })
    expect(showSuccessDialog).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('registrasi gagal menampilkan dialog error', async () => {
    const { wrapper, store, router } = await setup()
    store.register = vi.fn().mockResolvedValue({ status: 'fail', message: 'Email sudah dipakai' })

    await fill(wrapper, valid)
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(showErrorDialog).toHaveBeenCalledWith('Email sudah dipakai')
    expect(router.currentRoute.value.path).toBe('/auth/register')
  })

  it('menampilkan pesan error dari server di bawah field', async () => {
    const { wrapper, store } = await setup()
    store.errors = { email: ['Email sudah digunakan'] }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Email sudah digunakan')
  })

  it('tombol mata mengubah tipe kedua kolom kata sandi', async () => {
    const { wrapper } = await setup()

    await wrapper.get('button[aria-label="Tampilkan kata sandi"]').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('text')
    expect(wrapper.get('#confirmPassword').attributes('type')).toBe('text')

    await wrapper.get('button[aria-label="Sembunyikan kata sandi"]').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('password')
  })

  it('menonaktifkan tombol saat proses registrasi berjalan', async () => {
    const { wrapper } = await setup({ auth: { isAuthRegister: true } })
    const submit = wrapper.get('button[type="submit"]')

    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.text()).toContain('Memproses...')
  })
})