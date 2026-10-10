import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../test-utils'
import AucationCard from './AucationCard.vue'

const now = new Date('2026-10-08T10:00:00').getTime()

const aucation = {
  id: 7,
  user_id: 3,
  title: 'Keyboard Gaming',
  cover: 'https://x.test/cover.jpg',
  description: 'Mulus',
  start_bid: 200000,
  closed_at: '2026-10-08 12:30:00',
  author: { name: 'Risky', photo: null },
  bids: [],
}

const render = (overrides = {}, props = {}) =>
  renderWithProviders(AucationCard, {
    props: { aucation: { ...aucation, ...overrides }, now, ...props },
  })

describe('AucationCard', () => {
  it('menampilkan informasi utama lelang', async () => {
    const { wrapper } = await render()

    expect(wrapper.text()).toContain('Keyboard Gaming')
    expect(wrapper.text()).toMatch(/Rp\s?200\.000/)
    expect(wrapper.text()).toContain('2 jam 30 menit')
    expect(wrapper.text()).toContain('Risky')
    expect(wrapper.get('img[alt="Keyboard Gaming"]').attributes('src')).toBe('https://x.test/cover.jpg')
    expect(wrapper.get('a.btn-primary').attributes('href')).toBe('/aucations/7')
  })

  it('menampilkan "Belum ada" bila belum ada penawaran', async () => {
    const { wrapper } = await render()
    expect(wrapper.text()).toContain('Belum ada')
  })

  it('menampilkan tawaran tertinggi bila bids berisi objek', async () => {
    const { wrapper } = await render({ bids: [{ id: 1, bid: 250000 }, { id: 2, bid: 300000 }] })
    expect(wrapper.text()).toMatch(/Rp\s?300\.000/)
  })

  it('menampilkan jumlah penawaran bila bids hanya berisi id', async () => {
    const { wrapper } = await render({ bids: [4, 5] })
    expect(wrapper.text()).toContain('2 penawaran')
  })

  it('menganggap bids kosong bila field tidak ada', async () => {
    const { wrapper } = await render({ bids: undefined })
    expect(wrapper.text()).toContain('Belum ada')
  })

  it('memakai penulis cadangan bila author tidak tersedia', async () => {
    const { wrapper } = await render({ author: undefined })
    expect(wrapper.text()).toContain('Pengguna')
  })

  it('menampilkan status ditutup untuk lelang yang sudah lewat', async () => {
    const { wrapper } = await render({ closed_at: '2026-10-07 10:00:00' })
    expect(wrapper.text()).toContain('Lelang ditutup')
  })

  it('tidak menampilkan label dan aksi pemilik untuk non-pemilik', async () => {
    const { wrapper } = await render()

    expect(wrapper.text()).not.toContain('Milikmu')
    expect(wrapper.find('button[aria-label="Ubah lelang"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Hapus lelang"]').exists()).toBe(false)
  })

  it('menampilkan label dan memancarkan edit serta delete untuk pemilik', async () => {
    const { wrapper } = await render({}, { isOwner: true })

    expect(wrapper.text()).toContain('Milikmu')

    await wrapper.get('button[aria-label="Ubah lelang"]').trigger('click')
    await wrapper.get('button[aria-label="Hapus lelang"]').trigger('click')

    expect(wrapper.emitted('edit')[0][0].id).toBe(7)
    expect(wrapper.emitted('delete')[0][0].id).toBe(7)
  })
})