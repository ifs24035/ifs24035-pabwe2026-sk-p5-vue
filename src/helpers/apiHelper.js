const TOKEN_KEY = 'accessToken'

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
export const putAccessToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeAccessToken = () => localStorage.removeItem(TOKEN_KEY)

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

/**
 * Wrapper fetch untuk REST API Delcom.
 * Selalu mengembalikan objek { status, message, data } dan tidak melempar error.
 */
export async function apiFetch(path, { method = 'GET', params, body, formData } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${DELCOM_BASEURL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: payload,
    })
    return await response.json()
  } catch {
    return { status: 'error', message: 'Tidak dapat terhubung ke server' }
  }
}