import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DASHBOARD_ROUTE } from '../constants/auth'
import { getAuthenticatedRoute, useAuthStore } from '../store/authStore'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [email, setEmail] = useState('admin@empresa.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as LocationState | null)?.from?.pathname ?? DASHBOARD_ROUTE

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await login({ email, password })
      const destination = getAuthenticatedRoute({
        companies: useAuthStore.getState().companies,
        currentCompany: useAuthStore.getState().currentCompany,
      })

      navigate(destination === DASHBOARD_ROUTE ? from : destination, {
        replace: true,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Falha ao entrar.',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_100px_rgba(15,23,42,0.14)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-[linear-gradient(180deg,#172740,#223963)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">
              Base React
            </p>
            <h1 className="mt-6 max-w-md text-5xl font-semibold leading-[1.05]">
              Frontend pronto para consumir sua API Laravel.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              O fluxo de autenticacao usa Zustand, Axios e rotas protegidas.
              Ajuste apenas os endpoints se o contrato da API for diferente.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-200">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold text-white">Stack</p>
              <p className="mt-2">Vite, React, TypeScript, Tailwind e Router.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold text-white">Env</p>
              <p className="mt-2 font-mono text-xs text-orange-200">
                VITE_API_URL
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">
              Login
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Entrar no painel
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A tela envia <span className="font-mono">POST /auth/login</span>{' '}
              e, quando existe token, valida a sessao em{' '}
              <span className="font-mono">GET /auth/me</span>. Se o usuario
              tiver mais de uma empresa, o fluxo redireciona para a selecao de
              contexto antes de abrir o painel.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500"
                  placeholder="voce@empresa.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500"
                  placeholder="Sua senha"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
