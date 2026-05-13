import { AxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AUTH_STORAGE_KEY,
  COMPANY_SELECTION_ROUTE,
  DASHBOARD_ROUTE,
} from '../constants/auth'
import {
  reconcileCurrentCompany,
  requiresCompanySelection,
  resolveCompanies,
  resolveCurrentCompany,
  resolveToken,
  resolveUser,
} from '../lib/auth'
import { api } from '../lib/api'
import type { AuthCompany, AuthUser, LoginCredentials } from '../types/auth'

type AuthState = {
  user: AuthUser | null
  token: string | null
  companies: AuthCompany[]
  currentCompany: AuthCompany | null
  isAuthenticated: boolean
  initialized: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
  selectCompany: (companyId: AuthCompany['id']) => void
}

const getRequestErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const apiMessage =
      (error.response?.data as { message?: string } | undefined)?.message

    return apiMessage ?? 'Nao foi possivel concluir a solicitacao.'
  }

  return 'Nao foi possivel concluir a solicitacao.'
}

const createFallbackUser = ({ email }: LoginCredentials): AuthUser => ({
  name: email.split('@')[0] || 'Usuario',
  email,
})

const resolveSession = ({
  payload,
  fallbackUser,
  persistedCurrentCompany,
}: {
  payload: unknown
  fallbackUser: AuthUser | null
  persistedCurrentCompany?: AuthCompany | null
}) => {
  const user = resolveUser(payload) ?? fallbackUser
  const companies = resolveCompanies(payload)
  const currentCompany = reconcileCurrentCompany({
    companies,
    currentCompany: resolveCurrentCompany(payload),
    persistedCurrentCompany,
  })

  return {
    user,
    companies,
    currentCompany,
  }
}

export const getAuthenticatedRoute = ({
  companies,
  currentCompany,
}: Pick<AuthState, 'companies' | 'currentCompany'>) =>
  requiresCompanySelection({ companies, currentCompany })
    ? COMPANY_SELECTION_ROUTE
    : DASHBOARD_ROUTE

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      companies: [],
      currentCompany: null,
      isAuthenticated: false,
      initialized: false,
      isLoading: false,
      async login(credentials) {
        set({ isLoading: true })

        try {
          const response = await api.post('/login', credentials)
          const token = resolveToken(response.data)

          if (!token) {
            throw new Error('A resposta da API nao retornou token.')
          }

          const fallbackUser = createFallbackUser(credentials)
          const session = resolveSession({
            payload: response.data,
            fallbackUser,
            persistedCurrentCompany: get().currentCompany,
          })

          set({
            token,
            user: session.user,
            companies: session.companies,
            currentCompany: session.currentCompany,
            isAuthenticated: true,
            initialized: true,
            isLoading: false,
          })

          try {
            const meResponse = await api.get('/me')
            const refreshedSession = resolveSession({
              payload: meResponse.data,
              fallbackUser: get().user ?? fallbackUser,
              persistedCurrentCompany: get().currentCompany,
            })

            set({
              user: refreshedSession.user,
              companies: refreshedSession.companies,
              currentCompany: refreshedSession.currentCompany,
            })
          } catch {
            // Mantem o fallback quando a API ainda nao expoe /me.
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            companies: [],
            currentCompany: null,
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
          companies: [],
          currentCompany: null,
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
            companies: [],
            currentCompany: null,
            isAuthenticated: false,
            initialized: true,
            isLoading: false,
          })

          return
        }

        set({ isLoading: true })

        try {
          const response = await api.get('/me')
          const session = resolveSession({
            payload: response.data,
            fallbackUser: get().user,
            persistedCurrentCompany: get().currentCompany,
          })

          set({
            user: session.user,
            companies: session.companies,
            currentCompany: session.currentCompany,
            isAuthenticated: true,
            initialized: true,
            isLoading: false,
          })
        } catch {
          set({
            user: null,
            token: null,
            companies: [],
            currentCompany: null,
            isAuthenticated: false,
            initialized: true,
            isLoading: false,
          })
        }
      },
      selectCompany(companyId) {
        const company = get().companies.find(
          (item) => String(item.id) === String(companyId),
        )

        if (!company) {
          return
        }

        set({ currentCompany: company })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        companies: state.companies,
        currentCompany: state.currentCompany,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
