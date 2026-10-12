import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useAuthStore } from './features/auth/states/authStore'
import { useUsersStore } from './features/users/states/usersStore'
import { useAucationsStore } from './features/aucations/states/aucationsStore'

const Blank = { template: '<div />' }

const storeById = {
  auth: useAuthStore,
  users: useUsersStore,
  aucations: useAucationsStore,
}

/**
 * Membuat Pinia untuk tes dan mengisi state awal tiap store (hanya field yang disebut).
 * Contoh: createMockPinia({ users: { profile: { id: 1 } }, aucations: { aucations: [] } })
 */
export function createMockPinia(initialState = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  Object.entries(initialState).forEach(([id, state]) => {
    storeById[id](pinia).$patch(state)
  })

  return pinia
}

/**
 * Me-render komponen bersama Pinia dan Vue Router (memory history).
 * options: { props, slots, route, routes, initialState, pinia, attachTo }
 */
export async function renderWithProviders(component, options = {}) {
  const {
    props = {},
    slots = {},
    route = '/',
    routes = [],
    initialState = {},
    pinia = createMockPinia(initialState),
    attachTo,
  } = options

  // Rute cadangan agar RouterLink ke path yang tidak didaftarkan tidak memunculkan peringatan
  const catchAll = { path: '/:pathMatch(.*)*', component: Blank }
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes, catchAll] })
  router.push(route)
  await router.isReady()

  const wrapper = mount(component, {
    props,
    slots,
    attachTo,
    global: { plugins: [pinia, router] },
  })

  return { wrapper, router, pinia }
}

// Menunggu import dinamis, semua promise, dan render DOM selesai
export const flush = async () => {
  await vi.dynamicImportSettled()
  await new Promise((resolve) => setTimeout(resolve, 0))
}
