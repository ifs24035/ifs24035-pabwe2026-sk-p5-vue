import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useUsersStore } from '../states/usersStore'
import ProfilePage from './ProfilePage.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const profile = { id: 1, name: 'Kueng', email: 'kueng@del.ac.id', photo: 'https://x.test/k.png' }
const ok = { status: 'success' }

const setup = async ({ state = {}, fetchResult = ok } = {}) => {
  const pinia = createMockPinia({ users: state })
  const store = useUsersStore(pinia)
  store.fetchProfile = vi.fn().mockResolvedValue(fetchResult)
  store.updateProfile = vi.fn().mockResolvedValue(ok)
  store.changePassword = vi.fn().mockResolvedValue(ok)
  store.changePhoto = vi.fn().mockResolvedValue(ok)
  const result = await renderWithProviders(ProfilePage, { pinia })
  await flush()
  return { ...result, store }
}

const pickFile = async (wrapper, files) => {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
}

const imageFile = () => new File(['x'], 'foto.png', { type: 'image/png' })

describe('ProfilePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('memuat profil dan mengisi form dengan data pengguna', async () => {
    const { wrapper, store } = await setup({ state: { profile } })

    expect(store.fetchProfile).toHaveBeenCalledTimes(1)
    expect(wrapper.get('#profile-name').element.value).toBe('Kueng')
    expect(wrapper.get('#profile-email').element.value).toBe('kueng@del.ac.id')
    expect(wrapper.text()).toContain('kueng@del.ac.id')
  })

  it('menampilkan skeleton lalu mengisi form saat profil tiba', async () => {
    const { wrapper, store } = await setup()
    expect(wrapper.find('[data-testid="profile-loading"]').exists()).toBe(true)
    expect(wrapper.get('#profile-name').element.value).toBe('')

    store.profile = profile
    await flush()

    expect(wrapper.find('[data-testid="profile-loading"]').exists()).toBe(false)
    expect(wrapper.get('#profile-name').element.value).toBe('Kueng')
  })

  it('menampilkan dialog error bila profil gagal dimuat', async () => {
    await setup({ fetchResult: { status: 'fail', message: 'Gagal memuat profil' } })
    expect(showErrorDialog).toHaveBeenCalledWith('Gagal memuat profil')
  })

  it('membersihkan errors lama saat halaman dibuka', async () => {
    const { store } = await setup({ state: { profile, errors: { name: ['lama'] } } })
    expect(store.errors).toEqual({})
  })

  describe('form profil', () => {
    it('menampilkan pesan validasi untuk data tidak valid', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      await wrapper.get('#profile-name').setValue('  ')
      await wrapper.get('#profile-email').setValue('salah')
      await wrapper.findAll('form')[0].trigger('submit')

      expect(wrapper.text()).toContain('Nama wajib diisi')
      expect(wrapper.text()).toContain('Format email tidak valid')
      expect(store.updateProfile).not.toHaveBeenCalled()
    })

    it('berhasil memperbarui profil', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      await wrapper.get('#profile-name').setValue(' Nama Baru ')
      await wrapper.findAll('form')[0].trigger('submit')
      await flush()

      expect(store.updateProfile).toHaveBeenCalledWith({ name: 'Nama Baru', email: 'kueng@del.ac.id' })
      expect(showSuccessDialog).toHaveBeenCalledWith('Profil berhasil diperbarui')
    })

    it('gagal memperbarui profil menampilkan dialog error', async () => {
      const { wrapper, store } = await setup({ state: { profile } })
      store.updateProfile.mockResolvedValue({ status: 'fail', message: 'Email sudah dipakai' })

      await wrapper.findAll('form')[0].trigger('submit')
      await flush()

      expect(showErrorDialog).toHaveBeenCalledWith('Email sudah dipakai')
    })

    it('menampilkan pesan error dari server di bawah field', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      store.errors = { name: ['Nama terlalu pendek'], email: ['Email sudah digunakan'] }
      await flush()

      expect(wrapper.text()).toContain('Nama terlalu pendek')
      expect(wrapper.text()).toContain('Email sudah digunakan')
    })

    it('menonaktifkan tombol saat proses berjalan', async () => {
      const { wrapper } = await setup({ state: { profile, isProfileChange: true } })
      expect(wrapper.findAll('form')[0].get('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('form kata sandi', () => {
    const fillPassword = async (wrapper, current, next, confirm) => {
      await wrapper.get('#current-password').setValue(current)
      await wrapper.get('#new-password').setValue(next)
      await wrapper.get('#confirm-password').setValue(confirm)
    }

    it('menampilkan pesan validasi', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      await fillPassword(wrapper, '', '123', '456')
      await wrapper.findAll('form')[1].trigger('submit')

      expect(wrapper.text()).toContain('Kata sandi saat ini wajib diisi')
      expect(wrapper.text()).toContain('Kata sandi baru minimal 6 karakter')
      expect(wrapper.text()).toContain('Konfirmasi kata sandi tidak sama')
      expect(store.changePassword).not.toHaveBeenCalled()
    })

    it('berhasil mengubah kata sandi dan mengosongkan form', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      await fillPassword(wrapper, 'lama123', 'baru123', 'baru123')
      await wrapper.findAll('form')[1].trigger('submit')
      await flush()

      expect(store.changePassword).toHaveBeenCalledWith({ password: 'lama123', newPassword: 'baru123' })
      expect(showSuccessDialog).toHaveBeenCalledWith('Kata sandi berhasil diubah')
      expect(wrapper.get('#current-password').element.value).toBe('')
      expect(wrapper.get('#new-password').element.value).toBe('')
      expect(wrapper.get('#confirm-password').element.value).toBe('')
    })

    it('gagal mengubah kata sandi mempertahankan isi form', async () => {
      const { wrapper, store } = await setup({ state: { profile } })
      store.changePassword.mockResolvedValue({ status: 'fail', message: 'Kata sandi lama salah' })

      await fillPassword(wrapper, 'lama123', 'baru123', 'baru123')
      await wrapper.findAll('form')[1].trigger('submit')
      await flush()

      expect(showErrorDialog).toHaveBeenCalledWith('Kata sandi lama salah')
      expect(wrapper.get('#current-password').element.value).toBe('lama123')
    })

    it('menampilkan pesan error dari server untuk field kata sandi', async () => {
      const { wrapper, store } = await setup({ state: { profile } })

      store.errors = { password: ['Kata sandi salah'], new_password: ['Terlalu lemah'] }
      await flush()

      expect(wrapper.text()).toContain('Kata sandi salah')
      expect(wrapper.text()).toContain('Terlalu lemah')
    })

    it('menonaktifkan tombol saat proses berjalan', async () => {
      const { wrapper } = await setup({ state: { profile, isPasswordChange: true } })
      expect(wrapper.findAll('form')[1].get('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('foto profil', () => {
    it('tombol Pilih Foto membuka pemilih berkas', async () => {
      const { wrapper } = await setup({ state: { profile } })
      const click = vi.spyOn(wrapper.get('input[type="file"]').element, 'click')

      await wrapper.findAll('button').find((b) => b.text().includes('Pilih Foto')).trigger('click')

      expect(click).toHaveBeenCalled()
    })

    it('mengabaikan bila tidak ada berkas dipilih', async () => {
      const { wrapper } = await setup({ state: { profile } })

      await pickFile(wrapper, [])

      expect(wrapper.text()).not.toContain('Simpan Foto')
      expect(showErrorDialog).not.toHaveBeenCalled()
    })

    it('menolak berkas yang bukan gambar', async () => {
      const { wrapper } = await setup({ state: { profile } })

      await pickFile(wrapper, [new File(['x'], 'a.txt', { type: 'text/plain' })])

      expect(showErrorDialog).toHaveBeenCalledWith('File harus berupa gambar')
      expect(wrapper.text()).not.toContain('Simpan Foto')
    })

    it('menolak gambar yang lebih dari 2 MB', async () => {
      const { wrapper } = await setup({ state: { profile } })
      const big = imageFile()
      Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 })

      await pickFile(wrapper, [big])

      expect(showErrorDialog).toHaveBeenCalledWith('Ukuran foto maksimal 2 MB')
    })

    it('menampilkan pratinjau dan berhasil menyimpan foto', async () => {
      const { wrapper, store } = await setup({ state: { profile } })
      const file = imageFile()

      await pickFile(wrapper, [file])
      expect(wrapper.get('img[alt="Pratinjau foto baru"]').attributes('src')).toBe('blob:mock-url')

      await wrapper.findAll('button').find((b) => b.text().includes('Simpan Foto')).trigger('click')
      await flush()

      expect(store.changePhoto).toHaveBeenCalledWith(file)
      expect(showSuccessDialog).toHaveBeenCalledWith('Foto profil berhasil diperbarui')
      expect(wrapper.find('img[alt="Pratinjau foto baru"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Simpan Foto')
    })

    it('gagal menyimpan foto mempertahankan pratinjau', async () => {
      const { wrapper, store } = await setup({ state: { profile } })
      store.changePhoto.mockResolvedValue({ status: 'fail', message: 'Upload gagal' })

      await pickFile(wrapper, [imageFile()])
      await wrapper.findAll('button').find((b) => b.text().includes('Simpan Foto')).trigger('click')
      await flush()

      expect(showErrorDialog).toHaveBeenCalledWith('Upload gagal')
      expect(wrapper.find('img[alt="Pratinjau foto baru"]').exists()).toBe(true)
    })

    it('menonaktifkan tombol simpan saat unggahan berjalan', async () => {
      const { wrapper } = await setup({ state: { profile, isPhotoChange: true } })

      await pickFile(wrapper, [imageFile()])

      const save = wrapper.findAll('button').find((b) => b.text().includes('Simpan Foto'))
      expect(save.attributes('disabled')).toBeDefined()
    })
  })
})