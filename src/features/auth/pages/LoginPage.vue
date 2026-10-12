<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-vue-next'
import { useInput } from '../../../hooks/useInput'
import { useAuthStore } from '../states/authStore'
import { isValidEmail, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()

const [email, onEmailChange] = useInput('')
const [password, onPasswordChange] = useInput('')
const showPassword = ref(false)
const clientErrors = ref({})

const errorOf = (field) => clientErrors.value[field] ?? auth.errors[field]?.[0]

const validate = () => {
  const errors = {}
  if (!isValidEmail(email.value)) errors.email = 'Format email tidak valid'
  if (password.value.length < 6) errors.password = 'Kata sandi minimal 6 karakter'
  clientErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  const response = await auth.login({ email: email.value, password: password.value })
  if (response.status === 'success') {
    showSuccessDialog('Selamat datang kembali di Delcom Auction!')
    router.replace('/')
    return
  }
  showErrorDialog(response.message)
}

onMounted(() => auth.clearErrors())
</script>

<template>
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight">Masuk</h1>
    <p class="mt-2 text-sm text-slate-500">Silakan masuk untuk mulai mengikuti lelang.</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="login-email-input" class="mb-1.5 block text-sm font-semibold">Email</label>
        <div class="relative">
          <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="login-email-input"
            type="email"
            class="input pl-11"
            placeholder="nama@email.com"
            autocomplete="email"
            :value="email"
            @input="onEmailChange"
          />
        </div>
        <p v-if="errorOf('email')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('email') }}</p>
      </div>

      <div>
        <label for="login-password-input" class="mb-1.5 block text-sm font-semibold">Kata Sandi</label>
        <div class="relative">
          <Lock class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="login-password-input"
            :type="showPassword ? 'text' : 'password'"
            class="input px-11"
            placeholder="Minimal 6 karakter"
            autocomplete="current-password"
            :value="password"
            @input="onPasswordChange"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-500 hover:text-slate-700"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
        <p v-if="errorOf('password')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('password') }}</p>
      </div>

      <button
        id="login-submit-button"
        type="submit"
        class="btn-primary w-full"
        :disabled="auth.isAuthLogin"
      >
        <Loader2 v-if="auth.isAuthLogin" class="h-4 w-4 animate-spin" />
        <LogIn v-else class="h-4 w-4" />
        {{ auth.isAuthLogin ? 'Memproses...' : 'Masuk' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Belum punya akun?
      <RouterLink to="/auth/register" class="font-semibold text-brand-600 hover:underline">Daftar sekarang</RouterLink>
    </p>
  </div>
</template>