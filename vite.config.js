import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Menyisipkan CSS awal langsung ke index.html agar render pertama tidak menunggu unduhan CSS
const inlineEntryCss = () => ({
  name: 'inline-entry-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, { bundle }) {
      let result = html
      Object.entries(bundle).forEach(([fileName, asset]) => {
        if (!fileName.endsWith('.css')) return
        const link = new RegExp(`<link[^>]*href="[^"]*${fileName.split('/').pop()}"[^>]*>`)
        if (!link.test(result)) return
        result = result.replace(link, () => `<style>${asset.source}</style>`)
        delete bundle[fileName]
      })
      return result
    },
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      // Alamat absolut seperti /logo.svg (folder public) tidak diubah menjadi import aset
      vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
      tailwindcss(),
      inlineEntryCss(),
    ],
    server: {
      port: Number(env.APP_PORT) || 3000,
    },
    build: {
      sourcemap: true,
      target: 'esnext',
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'sweetalert2',
        'lucide-vue-next',
        '@toast-ui/editor',
        '@toast-ui/editor/dist/toastui-editor-viewer',
      ],
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1',
      ),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        include: ['src/**/*.{js,vue}'],
        exclude: [
          'src/main.js',
          'src/setupTests.js',
          'src/test-utils.js',
          'src/**/*.test.js',
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  }
})