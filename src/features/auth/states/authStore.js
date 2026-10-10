import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '../api/authApi'
import {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
} from '../../../helpers/apiHelper'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAccessToken())
  const isAuthLogin = ref(false)
  const isAuthRegister = ref(false)
  const isAuthLogout = ref(false)
  const errors = ref({})

  const isAuthenticated = computed(() => Boolean(token.value))

  const setErrors = (response) => {
    errors.value = response.status === 'fail' ? (response.data ?? {}) : {}
  }

  const clearErrors = () => {
    errors.value = {}
  }

  const login = async (payload) => {
    isAuthLogin.value = true
    const response = await authApi.login(payload)
    isAuthLogin.value = false

    setErrors(response)
    if (response.status === 'success') {
      putAccessToken(response.data.token)
      token.value = response.data.token
    }
    return response
  }

  const register = async (payload) => {
    isAuthRegister.value = true
    const response = await authApi.register(payload)
    isAuthRegister.value = false

    setErrors(response)
    return response
  }

  const logout = async () => {
    isAuthLogout.value = true
    removeAccessToken()
    token.value = null
    errors.value = {}
    isAuthLogout.value = false
  }

  return {
    token,
    errors,
    isAuthLogin,
    isAuthRegister,
    isAuthLogout,
    isAuthenticated,
    clearErrors,
    login,
    register,
    logout,
  }
})