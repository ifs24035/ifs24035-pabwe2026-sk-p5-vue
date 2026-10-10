<script setup>
import { onMounted, ref, watch } from 'vue'
import { Camera, KeyRound, Loader2, Mail, Save, ShieldCheck, User } from 'lucide-vue-next'
import UserAvatar from '../components/UserAvatar.vue'
import { useInput } from '../../../hooks/useInput'
import { useUsersStore } from '../states/usersStore'
import { isValidEmail, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const store = useUsersStore()

const [name, onNameChange] = useInput('')
const [email, onEmailChange] = useInput('')
const [currentPassword, onCurrentPasswordChange, resetCurrentPassword] = useInput('')
const [newPassword, onNewPasswordChange, resetNewPassword] = useInput('')
const [confirmPassword, onConfirmPasswordChange, resetConfirmPassword] = useInput('')

const photoInput = ref(null)
const photoFile = ref(null)
const photoPreview = ref('')
const clientErrors = ref({})

const errorOf = (field, serverField = field) =>
  clientErrors.value[field] ?? store.errors[serverField]?.[0]

const hasErrors = (errors) => {
  clientErrors.value = errors
  return Object.keys(errors).length > 0
}

const notify = (response, successMessage) => {
  if (response.status === 'success') {
    showSuccessDialog(successMessage)
    return true
  }
  showErrorDialog(response.message)
  return false
}

watch(
  () => store.profile,
  (profile) => {
    onNameChange(profile?.name ?? '')
    onEmailChange(profile?.email ?? '')
  },
  { immediate: true },
)

const handleProfileSubmit = async () => {
  const errors = {}
  if (!name.value.trim()) errors.name = 'Nama wajib diisi'
  if (!isValidEmail(email.value)) errors.email = 'Format email tidak valid'
  if (hasErrors(errors)) return

  const response = await store.updateProfile({ name: name.value.trim(), email: email.value })
  notify(response, 'Profil berhasil diperbarui')
}

const handlePasswordSubmit = async () => {
  const errors = {}
  if (!currentPassword.value) errors.currentPassword = 'Kata sandi saat ini wajib diisi'
  if (newPassword.value.length < 6) errors.newPassword = 'Kata sandi baru minimal 6 karakter'
  if (confirmPassword.value !== newPassword.value) errors.confirmPassword = 'Konfirmasi kata sandi tidak sama'
  if (hasErrors(errors)) return

  const response = await store.changePassword({
    password: currentPassword.value,
    newPassword: newPassword.value,
  })
  if (notify(response, 'Kata sandi berhasil diubah')) {
    resetCurrentPassword()
    resetNewPassword()
    resetConfirmPassword()
  }
}

const handlePhotoSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showErrorDialog('File harus berupa gambar')
    return
  }
  if (file.size > MAX_PHOTO_SIZE) {
    showErrorDialog('Ukuran foto maksimal 2 MB')
    return
  }

  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const handlePhotoSubmit = async () => {
  const response = await store.changePhoto(photoFile.value)
  if (notify(response, 'Foto profil berhasil diperbarui')) {
    photoFile.value = null
    photoPreview.value = ''
    photoInput.value.value = ''
  }
}

onMounted(async () => {
  store.clearErrors()
  const response = await store.fetchProfile()
  if (response.status !== 'success') showErrorDialog(response.message)
})
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold tracking-tight">Profil Saya</h1>
      <p class="text-sm text-slate-500">Kelola informasi akun, foto, dan keamanan kata sandimu.</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Kartu foto -->
      <div class="card h-fit p-8 text-center">
        <div v-if="store.profile">
          <div class="flex justify-center">
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Pratinjau foto baru"
              class="h-28 w-28 rounded-full object-cover ring-4 ring-brand-100"
            />
            <UserAvatar v-else :name="store.profile.name" :photo="store.profile.photo" size="h-28 w-28" />
          </div>
          <h2 class="mt-4 text-lg font-extrabold">{{ store.profile.name }}</h2>
          <p class="text-sm text-slate-500">{{ store.profile.email }}</p>
        </div>
        <div v-else class="mx-auto h-28 w-28 animate-pulse rounded-full bg-slate-100" data-testid="profile-loading" />

        <input
          ref="photoInput"
          type="file"
          accept="image/*"
          class="hidden"
          aria-label="Pilih foto profil"
          @change="handlePhotoSelect"
        />

        <div class="mt-6 flex flex-col gap-2">
          <button type="button" class="btn-secondary" @click="photoInput.click()">
            <Camera class="h-4 w-4" />
            Pilih Foto
          </button>
          <button
            v-if="photoFile"
            type="button"
            class="btn-primary"
            :disabled="store.isPhotoChange"
            @click="handlePhotoSubmit"
          >
            <Loader2 v-if="store.isPhotoChange" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            Simpan Foto
          </button>
          <p class="text-xs text-slate-400">Format gambar, maksimal 2 MB.</p>
        </div>
      </div>

      <div class="space-y-6 lg:col-span-2">
        <!-- Form profil -->
        <form class="card space-y-5 p-6" novalidate @submit.prevent="handleProfileSubmit">
          <h2 class="flex items-center gap-2 text-lg font-bold">
            <User class="h-5 w-5 text-brand-600" />
            Informasi Akun
          </h2>

          <div>
            <label for="profile-name" class="mb-1.5 block text-sm font-semibold">Nama Lengkap</label>
            <input id="profile-name" type="text" class="input" :value="name" @input="onNameChange" />
            <p v-if="errorOf('name')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('name') }}</p>
          </div>

          <div>
            <label for="profile-email" class="mb-1.5 block text-sm font-semibold">Email</label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="profile-email" type="email" class="input pl-11" :value="email" @input="onEmailChange" />
            </div>
            <p v-if="errorOf('email')" class="mt-1.5 text-xs text-rose-600">{{ errorOf('email') }}</p>
          </div>

          <button type="submit" class="btn-primary" :disabled="store.isProfileChange">
            <Loader2 v-if="store.isProfileChange" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            Simpan Perubahan
          </button>
        </form>

        <!-- Form kata sandi -->
        <form class="card space-y-5 p-6" novalidate @submit.prevent="handlePasswordSubmit">
          <h2 class="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck class="h-5 w-5 text-brand-600" />
            Ubah Kata Sandi
          </h2>

          <div>
            <label for="current-password" class="mb-1.5 block text-sm font-semibold">Kata Sandi Saat Ini</label>
            <input
              id="current-password"
              type="password"
              class="input"
              autocomplete="current-password"
              :value="currentPassword"
              @input="onCurrentPasswordChange"
            />
            <p v-if="errorOf('currentPassword', 'password')" class="mt-1.5 text-xs text-rose-600">
              {{ errorOf('currentPassword', 'password') }}
            </p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="new-password" class="mb-1.5 block text-sm font-semibold">Kata Sandi Baru</label>
              <input
                id="new-password"
                type="password"
                class="input"
                autocomplete="new-password"
                :value="newPassword"
                @input="onNewPasswordChange"
              />
              <p v-if="errorOf('newPassword', 'new_password')" class="mt-1.5 text-xs text-rose-600">
                {{ errorOf('newPassword', 'new_password') }}
              </p>
            </div>

            <div>
              <label for="confirm-password" class="mb-1.5 block text-sm font-semibold">Konfirmasi Kata Sandi</label>
              <input
                id="confirm-password"
                type="password"
                class="input"
                autocomplete="new-password"
                :value="confirmPassword"
                @input="onConfirmPasswordChange"
              />
              <p v-if="errorOf('confirmPassword')" class="mt-1.5 text-xs text-rose-600">
                {{ errorOf('confirmPassword') }}
              </p>
            </div>
          </div>

          <button type="submit" class="btn-primary" :disabled="store.isPasswordChange">
            <Loader2 v-if="store.isPasswordChange" class="h-4 w-4 animate-spin" />
            <KeyRound v-else class="h-4 w-4" />
            Ubah Kata Sandi
          </button>
        </form>
      </div>
    </div>
  </section>
</template>