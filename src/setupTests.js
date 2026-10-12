import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Komponen yang dimuat dinamis harus selesai dimuat sebelum tes berakhir
afterEach(async () => {
  await vi.dynamicImportSettled()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

window.scrollTo = vi.fn()
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

// Toast UI Editor terlalu berat untuk jsdom, jadi diganti tiruan sederhana untuk semua tes
vi.mock('@toast-ui/editor', () => {
  class Editor {
    static instances = []

    constructor(options) {
      this.options = options
      this.markdown = options.initialValue
      this.handlers = {}
      this.destroy = vi.fn()
      Editor.instances.push(this)
    }

    on(event, handler) {
      this.handlers[event] = handler
    }

    getMarkdown() {
      return this.markdown
    }

    setMarkdown(value) {
      this.markdown = value
    }

    // Membantu tes: meniru pengguna mengetik di editor
    type(value) {
      this.markdown = value
      this.handlers.change()
    }
  }
  return { default: Editor }
});

vi.mock('@toast-ui/editor/dist/toastui-editor-viewer', () => {
  class Viewer {
    static instances = []

    constructor(options) {
      this.options = options
      this.markdown = options.initialValue
      this.destroy = vi.fn()
      Viewer.instances.push(this)
    }

    setMarkdown(value) {
      this.markdown = value
    }
  }
  return { default: Viewer }
});
