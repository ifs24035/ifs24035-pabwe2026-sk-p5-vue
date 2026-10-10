import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as userApi from '../api/userApi'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const user = ref(null)
  const profile = ref(null)
  const errors = ref({})

  const isUsers = ref(false)
  const isProfile = ref(false)
  const isProfileChange = ref(false)
  const isPhotoChange = ref(false)
  const isPasswordChange = ref(false)

  const setErrors = (response) => {
    errors.value = response.status === 'fail' ? (response.data ?? {}) : {}
  }

  const clearErrors = () => {
    errors.value = {}
  }

  const selectUser = (selected) => {
    user.value = selected
  }

  const clearUser = () => {
    user.value = null
  }

  const fetchUsers = async () => {
    isUsers.value = true
    const response = await userApi.getUsers()
    isUsers.value = false

    if (response.status === 'success') users.value = response.data.users
    return response
  }

  const fetchProfile = async () => {
    isProfile.value = true
    const response = await userApi.getMe()
    isProfile.value = false

    if (response.status === 'success') profile.value = response.data.user
    return response
  }

  const runMutation = async (flag, request, refreshProfile) => {
    flag.value = true
    const response = await request()
    flag.value = false

    setErrors(response)
    if (response.status === 'success' && refreshProfile) await fetchProfile()
    return response
  }

  const updateProfile = (payload) =>
    runMutation(isProfileChange, () => userApi.updateMe(payload), true)

  const changePhoto = (file) =>
    runMutation(isPhotoChange, () => userApi.changePhoto(file), true)

  const changePassword = (payload) =>
    runMutation(isPasswordChange, () => userApi.changePassword(payload), false)

  return {
    users,
    user,
    profile,
    errors,
    isUsers,
    isProfile,
    isProfileChange,
    isPhotoChange,
    isPasswordChange,
    clearErrors,
    selectUser,
    clearUser,
    fetchUsers,
    fetchProfile,
    updateProfile,
    changePhoto,
    changePassword,
  }
})