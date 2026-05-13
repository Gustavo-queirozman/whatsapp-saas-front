import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { COMPANY_SELECTION_ROUTE } from '../constants/auth'
import { useAuthStore } from '../store/authStore'

const navigation = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Indicadores e operacao em tempo real.',
    shortLabel: 'DB',
  },
  {
    to: '/atendimento',
    label: 'Atendimento',
    description: 'Filas, tickets e acompanhamento do time.',
    shortLabel: 'AT',
  },
  {
    to: '/contatos',
    label: 'Contatos',
    description: 'Base ativa de clientes, leads e listas.',
    shortLabel: 'CT',
  },
  {
    to: '/campanhas',
    label: 'Campanhas',
    description: 'Disparos, segmentos e performance.',
    shortLabel: 'CP',
  },
  {
    to: '/crm',
    label: 'CRM',
    description: 'Pipeline comercial e oportunidades abertas.',
    shortLabel: 'CRM',
  },
  {
    to: '/chatbot',
    label: 'Chatbot',
    description: 'Fluxos automatizados e roteamento.',
    shortLabel: 'BOT',
  },
  {
    to: '/configuracoes',
    label: 'Configuracoes',
    description: 'Preferencias do workspace e integracoes.',
    shortLabel: 'CFG',
  },
  {
    to: '/whatsapp',
    label: 'WhatsApp',
    description: 'Instancias, conexoes e saude do canal.',
    shortLabel: 'WA',
  },
] as const

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 transition',
    isActive
      ? 'border-emerald-400/30 bg-emerald-400/16 text-white shadow-[0_18px_50px_rgba(16,185,129,0.16)]'
      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white',
  ].join(' ')

type SidebarContentProps = {
  currentCompanyName: string
  currentPath: string
  canSwitchCompany: boolean
  onNavigate?: () => void
}

function SidebarContent({
  currentCompanyName,
  currentPath,
  canSwitchCompany,
  onNavigate,
}: SidebarContentProps) {
  return (
    <>
      <div>
        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#25d366,#0f766e)] text-sm font-semibold text-slate-950">
              WA
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200">
                WhatsApp SaaS
              </p>
              <p className="mt-1 text-sm text-slate-300">Operacao centralizada</p>
            </div>
          </div>

          <p className="mt-5 text-[1.75rem] leading-9 font-semibold text-white">
            Shell principal para atender, vender e automatizar.
          </p>
        </div>

        <nav className="mt-8 flex flex-col gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClassName}
              onClick={onNavigate}
            >
              <span className="grid h-11 min-w-11 place-items-center rounded-2xl bg-white/8 text-[11px] font-semibold tracking-[0.2em] text-emerald-100 transition group-hover:bg-white/12">
                {item.shortLabel}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-400">
                  {item.description}
                </span>
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200">
          Empresa atual
        </p>
        <p className="mt-3 text-lg font-semibold text-white">{currentCompanyName}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Modulo ativo:{' '}
          {navigation.find((item) => currentPath.startsWith(item.to))?.label ??
            'Dashboard'}
        </p>
        {canSwitchCompany ? (
          <Link
            to={COMPANY_SELECTION_ROUTE}
            onClick={onNavigate}
            className="mt-5 block rounded-[1.2rem] border border-white/14 px-4 py-3 text-center text-sm font-medium text-white transition hover:border-emerald-300/40 hover:bg-white/6"
          >
            Trocar empresa
          </Link>
        ) : null}
      </div>
    </>
  )
}

export function AppLayout() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const companies = useAuthStore((state) => state.companies)
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const logout = useAuthStore((state) => state.logout)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const canSwitchCompany = companies.length > 1
  const activeItem =
    navigation.find((item) => location.pathname.startsWith(item.to)) ??
    navigation[0]
  const currentCompanyName = currentCompany?.name ?? 'Nenhuma empresa selecionada'
  const userName = user?.name ?? 'Usuario autenticado'
  const userEmail = user?.email ?? 'sem-email@workspace.local'
  const userInitials = getInitials(userName || userEmail) || 'US'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.16),transparent_24rem),linear-gradient(180deg,#eef6f2_0%,#e6f0eb_100%)] p-3 md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] overflow-hidden rounded-[2rem] border border-white/65 bg-white/55 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur xl:min-h-[calc(100vh-2.5rem)]">
        <aside className="hidden w-[320px] flex-col justify-between border-r border-slate-900/6 bg-[linear-gradient(180deg,#071d1a_0%,#0d2b26_45%,#0f3a34_100%)] p-6 xl:flex">
          <SidebarContent
            currentCompanyName={currentCompanyName}
            currentPath={location.pathname}
            canSwitchCompany={canSwitchCompany}
          />
        </aside>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/45 xl:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[88vw] max-w-[340px] flex-col justify-between bg-[linear-gradient(180deg,#071d1a_0%,#0d2b26_45%,#0f3a34_100%)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.38)]">
              <SidebarContent
                currentCompanyName={currentCompanyName}
                currentPath={location.pathname}
                canSwitchCompany={canSwitchCompany}
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-900/6 bg-white/74 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] xl:hidden"
                >
                  <span className="block h-0.5 w-5 rounded-full bg-current shadow-[0_6px_0_0_currentColor,0_-6px_0_0_currentColor]" />
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Workspace
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-[2rem]">
                    {activeItem.label}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[340px]">
                <div className="flex items-center justify-between rounded-[1.4rem] border border-emerald-100 bg-[linear-gradient(135deg,#f5fffa,#ffffff)] px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Empresa atual
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {currentCompanyName}
                    </p>
                  </div>

                  {canSwitchCompany ? (
                    <Link
                      to={COMPANY_SELECTION_ROUTE}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
                    >
                      Trocar
                    </Link>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#111827,#334155)] text-sm font-semibold text-white">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {userName}
                      </p>
                      <p className="truncate text-sm text-slate-500">{userEmail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl border border-slate-200 bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 xl:px-8 xl:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
