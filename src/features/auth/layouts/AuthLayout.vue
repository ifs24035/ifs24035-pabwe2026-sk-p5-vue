<script setup>
import { Gavel, ShieldCheck, Timer, TrendingUp } from 'lucide-vue-next'

const features = [
  { icon: Gavel, title: 'Lelang Real-time', text: 'Ajukan tawaran dan pantau penawar tertinggi kapan saja.' },
  { icon: Timer, title: 'Countdown Jelas', text: 'Batas waktu penutupan lelang selalu terlihat.' },
  { icon: TrendingUp, title: 'Riwayat Penawaran', text: 'Lihat perkembangan bid secara transparan.' },
  { icon: ShieldCheck, title: 'Aman Terkelola', text: 'Akses lelangmu sendiri dengan akun terautentikasi.' },
]
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <aside
      class="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-purple-700 p-12 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div class="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <img src="/logo.svg" alt="Logo Delcom Auction" class="h-11 w-11 rounded-xl shadow-lg" />
        <span class="text-xl font-extrabold tracking-tight">Delcom Auction</span>
      </div>

      <div class="relative space-y-8">
        <div>
          <h1 class="text-4xl font-extrabold leading-tight">
            Temukan barang impian,<br />menangkan dengan tawaran terbaik.
          </h1>
          <p class="mt-4 max-w-md text-brand-100">
            Platform lelang untuk civitas Del. Pasang barangmu atau ikut menawar dalam hitungan detik.
          </p>
        </div>

        <ul class="grid gap-4 sm:grid-cols-2">
          <li
            v-for="feature in features"
            :key="feature.title"
            class="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
          >
            <component :is="feature.icon" class="h-5 w-5 text-brand-200" />
            <p class="mt-2 text-sm font-bold">{{ feature.title }}</p>
            <p class="mt-1 text-xs text-brand-100">{{ feature.text }}</p>
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-brand-200">&copy; 2026 Delcom Auction &middot; PABWE IT Del</p>
    </aside>

    <main class="flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/logo.svg" alt="Logo Delcom Auction" class="h-10 w-10 rounded-xl" />
          <span class="text-lg font-extrabold tracking-tight">Delcom Auction</span>
        </div>
        <RouterView />
      </div>
    </main>
  </div>
</template>