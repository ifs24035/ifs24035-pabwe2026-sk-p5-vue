import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as aucationApi from '../api/aucationApi'

export const useAucationsStore = defineStore('aucations', () => {
  const aucations = ref([])
  const aucation = ref(null)
  const errors = ref({})

  // Loading daftar dan detail dipisah agar tidak saling menimpa; isAucation gabungan keduanya
  const isList = ref(false)
  const isDetail = ref(false)
  const isAucation = computed(() => isList.value || isDetail.value)

  // Flag mutasi: "...Add/Change/Delete" = sedang diproses, "...Added/Changed/Deleted" = berhasil
  const isAucationAdd = ref(false)
  const isAucationAdded = ref(false)
  const isAucationChange = ref(false)
  const isAucationChanged = ref(false)
  const isAucationChangeCover = ref(false)
  const isAucationChangedCover = ref(false)
  const isAucationDelete = ref(false)
  const isAucationDeleted = ref(false)
  const isBidAdd = ref(false)
  const isBidAdded = ref(false)
  const isBidDelete = ref(false)
  const isBidDeleted = ref(false)
  const isAucationDeleteAll = ref(false)
  const isAucationDeletedAll = ref(false)

  // Filter terakhir yang dipakai daftar lelang, dipakai untuk refresh otomatis
  let lastFilters = null
  // Penomoran permintaan agar jawaban yang terlambat tidak menimpa data terbaru
  let listRequestId = 0
  let detailRequestId = 0
  // Cache daftar lelang per kombinasi filter
  const listCache = new Map()

  const setErrors = (response) => {
    errors.value = response.status === 'fail' ? (response.data ?? {}) : {}
  }

  const clearErrors = () => {
    errors.value = {}
  }

  const fetchAucations = async (filters = {}, { silent = false } = {}) => {
    lastFilters = filters
    const key = JSON.stringify(filters)
    const cached = listCache.get(key)
    const requestId = ++listRequestId

    if (!silent) {
      aucations.value = cached ?? []
      isList.value = !cached
    }

    const response = await aucationApi.getAucations(filters)
    if (response.status === 'success') listCache.set(key, response.data.aucations)
    if (requestId !== listRequestId) return response

    isList.value = false
    if (response.status === 'success') aucations.value = response.data.aucations
    return response
  }

  const fetchAucation = async (id, { silent = false } = {}) => {
    const requestId = ++detailRequestId
    if (!silent) {
      aucation.value = null
      isDetail.value = true
    }

    const response = await aucationApi.getAucation(id)
    if (requestId !== detailRequestId) return response

    isDetail.value = false
    if (response.status === 'success') aucation.value = response.data.aucation
    return response
  }

  const refreshList = async () => {
    if (lastFilters) await fetchAucations(lastFilters, { silent: true })
  }

  const refreshAll = async (id) => {
    await refreshList()
    if (aucation.value?.id === Number(id)) await fetchAucation(id, { silent: true })
  }

  const runMutation = async (busy, done, request, onSuccess) => {
    busy.value = true
    done.value = false
    const response = await request()
    busy.value = false

    setErrors(response)
    if (response.status === 'success') {
      done.value = true
      await onSuccess()
    }
    return response
  }

  const addAucation = (payload) =>
    runMutation(isAucationAdd, isAucationAdded, () => aucationApi.addAucation(payload), refreshList)

  const changeAucation = (id, payload) =>
    runMutation(
      isAucationChange,
      isAucationChanged,
      () => aucationApi.changeAucation(id, payload),
      () => refreshAll(id),
    )

  const changeCover = (id, file) =>
    runMutation(
      isAucationChangeCover,
      isAucationChangedCover,
      () => aucationApi.changeCoverAucation(id, file),
      () => refreshAll(id),
    )

  const deleteAucation = (id) =>
    runMutation(
      isAucationDelete,
      isAucationDeleted,
      () => aucationApi.deleteAucation(id),
      async () => {
        if (aucation.value?.id === Number(id)) aucation.value = null
        await refreshList()
      },
    )

  const addBid = (id, bid) =>
    runMutation(isBidAdd, isBidAdded, () => aucationApi.addBid(id, bid), () => refreshAll(id))

  const deleteBid = (id) =>
    runMutation(isBidDelete, isBidDeleted, () => aucationApi.deleteBid(id), () => refreshAll(id))

  const deleteAllAucations = () =>
    runMutation(
      isAucationDeleteAll,
      isAucationDeletedAll,
      () => aucationApi.deleteAllAucations(),
      async () => {
        aucation.value = null
        await refreshList()
      },
    )

  return {
    aucations,
    aucation,
    errors,
    isAucation,
    isAucationAdd,
    isAucationAdded,
    isAucationChange,
    isAucationChanged,
    isAucationChangeCover,
    isAucationChangedCover,
    isAucationDelete,
    isAucationDeleted,
    isBidAdd,
    isBidAdded,
    isBidDelete,
    isBidDeleted,
    isAucationDeleteAll,
    isAucationDeletedAll,
    clearErrors,
    fetchAucations,
    fetchAucation,
    addAucation,
    changeAucation,
    changeCover,
    deleteAucation,
    addBid,
    deleteBid,
    deleteAllAucations,
  }
})