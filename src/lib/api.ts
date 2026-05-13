import axios from 'axios'
import { AUTH_STORAGE_KEY, LOGIN_ROUTE } from '../constants/auth'

type PersistedAuthState = {
  state?: {
    token?: string | null
    currentCompany?: {
      id?: string | number | null
    } | null
  }
}

const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/+$/,
  '',
)

const normalizedBaseUrl = rawBaseUrl?.endsWith('/v1')
  ? rawBaseUrl
  : `${rawBaseUrl ?? ''}/v1`

const getStoredState = () => {
  const rawState = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawState) {
    return null
  }

  try {
    return JSON.parse(rawState) as PersistedAuthState
  } catch {
    return null
  }
}

const getStoredToken = () => getStoredState()?.state?.token ?? null

const getStoredCompanyId = () => {
  const companyId = getStoredState()?.state?.currentCompany?.id

  return typeof companyId === 'string' || typeof companyId === 'number'
    ? String(companyId)
    : null
}

export const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  const companyId = getStoredCompanyId()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (companyId) {
    config.headers['X-Company-Id'] = companyId
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
