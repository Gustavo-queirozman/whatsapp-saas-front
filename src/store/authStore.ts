import { AxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_STORAGE_KEY } from '../constants/auth'
import { api } from '../lib/api'
import type { AuthUser, LoginCredentials } from '../types/auth'

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  initialized: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

type LoginResponse = {
  access_token?: string
  token?: string
  user?: AuthUser
  data?: {
    access_token?: string
    token?: string
    user?: AuthUser
  }
}

type CurrentUserResponse = {
  user?: AuthUser
  data?: AuthUser | { user?: AuthUser }
}

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'email' in value && 'name' in value
}

const resolveToken = (response: LoginResponse) =>
  response.access_token ??
  response.token ??
  response.data?.access_token ??
  response.data?.token ??
  null

const resolveUser = (
  response: LoginResponse | CurrentUserResponse,
): AuthUser | null => {
  if ('user' in response && isAuthUser(response.user)) {
    return response.user
  }

  if (
    response.data &&
    typeof response.data === 'object' &&
    'user' in response.data &&
    isAuthUser(response.data.user)
  ) {
    return response.data.user
  }

  if (isAuthUser(response.data)) {
    return response.data
  }

  return null
}

const getRequestErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const apiMessage =
      (error.response?.data as { message?: string } | undefined)?.message

    return apiMessage ?? 'Nao foi possivel concluir a solicitacao.'
  }

  return 'Nao foi possivel concluir a solicitacao.'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      initialized: false,
      isLoading: false,
      async login(credentials) {
        set({ isLoading: true })

        try {
          const response = await api.post<LoginResponse>('/login', credentials)
          const token = resolveToken(response.data)

          if (!token) {
            throw new Error('A resposta da API nao retornou token.')
          }

          const fallbackUser: AuthUser = {
            name: credentials.email.split('@')[0] || 'Usuario',
            email: credentials.email,
          }

          set({
            token,
            user: resolveUser(response.data) ?? fallbackUser,
            isAuthenticated: true,
            initialized: true,
            isLoading: false,
          })

          try {
            const meResponse = await api.get<CurrentUserResponse>('/me')

            set((state) => ({ user: resolveUser(meResponse.data) ?? state.user }))
          } catch {
            // Mantem o fallback quando a API ainda nao expoe /me.
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            initialized: true,
            isLoading: false,
          })

          throw new Error(getRequestErrorMessage(error), { cause: error })
        }
      },
      logout() {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          initialized: true,
          isLoading: false,
        })
      },
      async initialize() {
        if (get().initialized) {
          return
        }

        const token = get().token

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            initialized: true,
            isLoading: false,
          })

          return
        }

        set({ isLoading: true })

        try {
          const response = await api.get<CurrentUserResponse>('/me')

          set({
            user: resolveUser(response.data),
            isAuthenticated: true,
            initialized: true,
            isLoading: false,
          })
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            initialized: true,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
