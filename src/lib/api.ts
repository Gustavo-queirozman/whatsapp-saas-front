import axios from 'axios'
import { AUTH_STORAGE_KEY, LOGIN_ROUTE } from '../constants/auth'

type PersistedAuthState = {
  state?: {
    token?: string | null
  }
}

const getStoredToken = () => {
  const rawState = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawState) {
    return null
  }

  try {
    const parsedState = JSON.parse(rawState) as PersistedAuthState
    return parsedState.state?.token ?? null
  } catch {
    return null
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)

      if (window.location.pathname !== LOGIN_ROUTE) {
        window.location.replace(LOGIN_ROUTE)
      }
    }

    return Promise.reject(error)
  },
)
