import { apiFetch } from '../../../helpers/apiHelper'

const toBody = ({ title, description, startBid, closedAt }) => ({
  title,
  description,
  start_bid: startBid,
  closed_at: closedAt,
})

// isMe: true => hanya lelang milik saya
// isClosed: dikirim apa adanya (0 | 1) sesuai dokumentasi API
export const getAucations = ({ isMe, isClosed } = {}) =>
  apiFetch('/aucations', {
    params: { is_me: isMe ? 1 : undefined, is_closed: isClosed },
  })

export const getAucation = (id) => apiFetch(`/aucations/${id}`)

export const addAucation = (payload) =>
  apiFetch('/aucations', { method: 'POST', body: toBody(payload) })

export const changeAucation = (id, payload) =>
  apiFetch(`/aucations/${id}`, { method: 'PUT', body: toBody(payload) })

export const changeCoverAucation = (id, file) => {
  const formData = new FormData()
  formData.append('cover', file)
  return apiFetch(`/aucations/${id}/cover`, { method: 'POST', formData })
}

export const deleteAucation = (id) =>
  apiFetch(`/aucations/${id}`, { method: 'DELETE' })

export const addBid = (id, bid) =>
  apiFetch(`/aucations/${id}/bids`, { method: 'POST', body: { bid } })

export const deleteBid = (id) =>
  apiFetch(`/aucations/${id}/bids`, { method: 'DELETE' })

export const deleteAllAucations = () =>
  apiFetch('/aucations', { method: 'DELETE' })