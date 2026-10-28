import { useAuthStore } from '../store/authStore'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const { token, logout } = useAuthStore.getState()
  const url = params ? `${path}?${new URLSearchParams(params)}` : path
  let res
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Can\'t reach the server. Check your connection.', 0)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // token no longer valid (e.g. db was reset) -> back to logged out
    if (res.status === 401 && token && !path.startsWith('/api/auth/login')) logout()
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status)
  }
  return data
}
