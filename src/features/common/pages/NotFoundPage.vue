<script setup>
import { Compass, Home } from 'lucide-vue-next'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="rounded-3xl bg-brand-50 p-6 text-brand-600">
      <Compass class="h-12 w-12" />
    </div>
    <p class="mt-6 text-7xl font-extrabold tracking-tight text-brand-600">404</p>
    <h1 class="mt-2 text-2xl font-bold">Halaman tidak ditemukan</h1>
    <p class="mt-2 max-w-sm text-sm text-slate-500">
      Halaman yang kamu cari tidak ada atau sudah dipindahkan.
    </p>
    <RouterLink to="/" class="btn-primary mt-8">
      <Home class="h-4 w-4" />
      Kembali ke Beranda
    </RouterLink>
  </div>
</template>