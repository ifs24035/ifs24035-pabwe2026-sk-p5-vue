import { apiFetch } from '../../../helpers/apiHelper'

export const getUsers = () => apiFetch('/users')

export const getMe = () => apiFetch('/users/me')

export const updateMe = ({ name, email }) =>
  apiFetch('/users/me', { method: 'PUT', body: { name, email } })

export const changePhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return apiFetch('/users/me/photo', { method: 'POST', formData })
}

export const changePassword = ({ password, newPassword }) =>
  apiFetch('/users/me/password', {
    method: 'PUT',
    body: { password, new_password: newPassword },
  })