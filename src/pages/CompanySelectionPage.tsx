import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  COMPANY_SELECTION_ROUTE,
  DASHBOARD_ROUTE,
} from '../constants/auth'
import { getAuthenticatedRoute, useAuthStore } from '../store/authStore'

export function CompanySelectionPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const companies = useAuthStore((state) => state.companies)
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const selectCompany = useAuthStore((state) => state.selectCompany)
  const logout = useAuthStore((state) => state.logout)

  const destination = getAuthenticatedRoute({ companies, currentCompany })

  useEffect(() => {
    if (destination !== COMPANY_SELECTION_ROUTE) {
      navigate(destination, { replace: true })
    }
  }, [destination, navigate])

  const handleSelectCompany = (companyId: string | number) => {
    selectCompany(companyId)
    navigate(DASHBOARD_ROUTE, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_24px_100px_rgba(15,23,42,0.14)] backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-[linear-gradient(180deg,#11203b,#1f365f)] p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">
              Contexto
            </p>
            <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight">
              Escolha a empresa para entrar no workspace.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Sua sessao ja foi autenticada. Falta apenas definir qual empresa
              sera usada no contexto atual do painel.
            </p>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                {user?.name ?? 'Usuario autenticado'}
              </p>
              <p className="mt-1 text-sm text-slate-300">{user?.email}</p>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">
                  Empresas
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                  Selecione uma empresa
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  A empresa atual fica salva no navegador e sera reutilizada nas
                  proximas visitas ate voce trocar o contexto ou sair da conta.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Sair
              </button>
            </div>

            <div className="mt-8 grid gap-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelectCompany(company.id)}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_22px_60px_rgba(216,101,55,0.18)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {company.name}
                      </p>
                      <p className="mt-2 font-mono text-xs text-slate-500">
                        ID {company.id}
                      </p>
                    </div>

                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 transition group-hover:bg-orange-100">
                      Entrar
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {companies.length === 0 ? (
              <div className="mt-8 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
                Nenhuma empresa foi encontrada na resposta da API para este
                usuario.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
