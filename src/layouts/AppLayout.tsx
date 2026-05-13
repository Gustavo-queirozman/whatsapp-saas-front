import { Link, NavLink, Outlet } from 'react-router-dom'
import { COMPANY_SELECTION_ROUTE } from '../constants/auth'
import { useAuthStore } from '../store/authStore'

const navigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/conversations', label: 'Conversas' },
  { to: '/settings', label: 'Configuracoes' },
]

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]'
      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
  ].join(' ')

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const companies = useAuthStore((state) => state.companies)
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const logout = useAuthStore((state) => state.logout)
  const canSwitchCompany = companies.length > 1

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 shadow-[0_30px_120px_rgba(15,23,42,0.16)] backdrop-blur md:min-h-[calc(100vh-3rem)]">
        <aside className="hidden w-80 flex-col justify-between border-r border-slate-200/70 bg-[linear-gradient(180deg,rgba(17,32,59,0.98),rgba(28,48,86,0.94))] px-6 py-8 text-slate-50 md:flex">
          <div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
                WhatsApp SaaS
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight">
                Painel para operar a API Laravel.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Estrutura base pronta para auth, navegacao protegida e consumo
                de endpoints.
              </p>
            </div>

            <nav className="mt-8 flex flex-col gap-2">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">
              {user?.name ?? 'Usuario autenticado'}
            </p>
            <p className="mt-1 text-sm text-slate-300">{user?.email}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                Empresa atual
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {currentCompany?.name ?? 'Sem empresa selecionada'}
              </p>
            </div>
            {canSwitchCompany ? (
              <Link
                to={COMPANY_SELECTION_ROUTE}
                className="mt-5 block rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-medium text-white transition hover:border-orange-300 hover:text-orange-200"
              >
                Trocar empresa
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:border-orange-300 hover:text-orange-200"
            >
              Sair
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/75 px-5 py-5 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                  Workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Frontend React + Laravel API
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {currentCompany?.name ?? 'Sem empresa selecionada'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canSwitchCompany ? (
                  <Link
                    to={COMPANY_SELECTION_ROUTE}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                  >
                    Trocar empresa
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                >
                  Sair
                </button>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2 md:hidden">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
