import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, createMockPinia, flush } from '../../../test-utils'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import { useAucationsStore } from '../states/aucationsStore'
import ChangeCoverModal from './ChangeCoverModal.vue'

vi.mock('../../../helpers/toolsHelper', async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

const aucation = { id: 4, title: 'Keyboard', cover: null }

const setup = async (props = {}, state = {}) => {
  const pinia = createMockPinia({ aucations: state })
  const store = useAucationsStore(pinia)
  store.changeCover = vi.fn().mockResolvedValue({ status: 'success' })
  const result = await renderWithProviders(ChangeCoverModal, {
    pinia,
    props: { open: true, aucation, ...props },
  })
  return { ...result, store }
}

const pickFile = async (wrapper, files) => {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
}

const imageFile = () => new File(['x'], 'cover.png', { type: 'image/png' })
const uploadButton = (wrapper) => wrapper.findAll('button').find((b) => b.text().includes('Unggah Cover'))

describe('ChangeCoverModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tidak menampilkan apa pun saat tertutup', async () => {
    const { wrapper } = await setup({ open: false })
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
  })

  it('menampilkan ajakan memilih gambar bila belum ada cover', async () => {
    const { wrapper } = await setup()

    expect(wrapper.text()).toContain('Klik untuk memilih gambar')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(uploadButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('menampilkan cover saat ini bila sudah ada', async () => {
    const { wrapper } = await setup({ aucation: { ...aucation, cover: 'https://x.test/c.jpg' } })

    expect(wrapper.get('img[alt="Pratinjau cover"]').attributes('src')).toBe('https://x.test/c.jpg')
  })

  it('mengabaikan bila tidak ada berkas dipilih', async () => {
    const { wrapper } = await setup()

    await pickFile(wrapper, [])

    expect(showErrorDialog).not.toHaveBeenCalled()
    expect(uploadButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('menolak berkas yang bukan gambar', async () => {
    const { wrapper } = await setup()

    await pickFile(wrapper, [new File(['x'], 'a.pdf', { type: 'application/pdf' })])

    expect(showErrorDialog).toHaveBeenCalledWith('File harus berupa gambar')
    expect(uploadButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('menolak gambar yang lebih dari 2 MB', async () => {
    const { wrapper } = await setup()
    const big = imageFile()
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 })

    await pickFile(wrapper, [big])

    expect(showErrorDialog).toHaveBeenCalledWith('Ukuran gambar maksimal 2 MB')
  })

  it('menampilkan pratinjau gambar baru dan mengaktifkan tombol unggah', async () => {
    const { wrapper } = await setup()

    await pickFile(wrapper, [imageFile()])

    expect(wrapper.get('img[alt="Pratinjau cover"]').attributes('src')).toBe('blob:mock-url')
    expect(uploadButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('berhasil mengunggah cover lalu menutup dan mengosongkan pilihan', async () => {
    const { wrapper, store } = await setup()
    const file = imageFile()

    await pickFile(wrapper, [file])
    await uploadButton(wrapper).trigger('click')
    await flush()

    expect(store.changeCover).toHaveBeenCalledWith(4, file)
    expect(showSuccessDialog).toHaveBeenCalledWith('Cover lelang berhasil diperbarui')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('gagal mengunggah menampilkan dialog error dan mempertahankan pilihan', async () => {
    const { wrapper, store } = await setup()
    store.changeCover.mockResolvedValue({ status: 'fail', message: 'Upload gagal' })

    await pickFile(wrapper, [imageFile()])
    await uploadButton(wrapper).trigger('click')
    await flush()

    expect(showErrorDialog).toHaveBeenCalledWith('Upload gagal')
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('tombol Batal menutup modal dan membuang pilihan', async () => {
    const { wrapper } = await setup()
    await pickFile(wrapper, [imageFile()])

    await wrapper.findAll('button').find((b) => b.text() === 'Batal').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('menonaktifkan tombol unggah saat proses berjalan', async () => {
    const { wrapper } = await setup({}, { isAucationChangeCover: true })

    await pickFile(wrapper, [imageFile()])

    expect(uploadButton(wrapper).attributes('disabled')).toBeDefined()
  })
})