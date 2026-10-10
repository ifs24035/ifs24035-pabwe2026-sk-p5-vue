<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, Lock, Mail, User, UserPlus } from 'lucide-vue-next'
import { useInput } from '../../../hooks/useInput'
import { useAuthStore } from '../states/authStore'
import { isValidEmail, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()

const [name, onNameChange] = useInput('')
const [email, onEmailChange] = useInput('')
const [password, onPasswordChange] = useInput('')
const [confirmPassword, onConfirmPasswordChange] = useInput('')
const showPassword = ref(false)
const clientErrors = ref({})

const errorOf = (field) => clientErrors.value[field] ?? auth.errors[field]?.[0]

const validate = () => {
  const errors = {}
  if (!name.value.trim()) errors.name = 'Nama lengkap wajib diisi'
  if (!isValidEmail(email.value)) errors.email = 'Format email tidak valid'
  if (password.value.length < 6) errors.password = 'Kata sandi minimal 6 karakter'
  if (confirmPassword.value !== password.value) errors.confirmPassword = 'Konfirmasi kata sandi tidak sama'
  clientErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  const response = await auth.register({
    name: name.value.trim(),
    email: email.value,
    password: password.value,
  })
  if (response.status === 'success') {
    showSuccessDialog('Akun berhasil dibuat. Silakan masuk.')
    router.replace('/auth/login')
    return
  }
  showErrorDialog(response.message)
}

onMounted(() => auth.clearErrors())
</script>

<template>
  <div>
    <h2 class="text-3xl font-extrabold tracking-tight">Buat Akun</h2>
    <p class="mt-2 text-sm text-slate-500">Daftar gratis dan mulai menawar atau melelang barang.</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="name" class="mb-1.5 block text-sm font-semibold">Nama Lengkap</label>
        <div class="relative">
          <User class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="name"
            type="text"
            class="input pl-11"
            placeholder="Nama lengkap"
            autocomplete="name"
            :value="name"
            @input="onNameChange"
          />
        </div>
        <p v-if="errorOf('name')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('name') }}</p>
      </div>

      <div>
        <label for="email" class="mb-1.5 block text-sm font-semibold">Email</label>
        <div class="relative">
          <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
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
        <label for="password" class="mb-1.5 block text-sm font-semibold">Kata Sandi</label>
        <div class="relative">
          <Lock class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            :type="showPassword ? 'text' : 'password'"
            class="input px-11"
            placeholder="Minimal 6 karakter"
            autocomplete="new-password"
            :value="password"
            @input="onPasswordChange"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-600"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
        <p v-if="errorOf('password')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('password') }}</p>
      </div>

      <div>
        <label for="confirmPassword" class="mb-1.5 block text-sm font-semibold">Konfirmasi Kata Sandi</label>
        <div class="relative">
          <Lock class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="input pl-11"
            placeholder="Ulangi kata sandi"
            autocomplete="new-password"
            :value="confirmPassword"
            @input="onConfirmPasswordChange"
          />
        </div>
        <p v-if="errorOf('confirmPassword')" class="mt-1.5 text-xs text-rose-600">
          {{ errorOf('confirmPassword') }}
        </p>
      </div>

      <button type="submit" class="btn-primary w-full" :disabled="auth.isAuthRegister">
        <Loader2 v-if="auth.isAuthRegister" class="h-4 w-4 animate-spin" />
        <UserPlus v-else class="h-4 w-4" />
        {{ auth.isAuthRegister ? 'Memproses...' : 'Daftar' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink to="/auth/login" class="font-semibold text-brand-600 hover:underline">Masuk di sini</RouterLink>
    </p>
  </div>
</template>