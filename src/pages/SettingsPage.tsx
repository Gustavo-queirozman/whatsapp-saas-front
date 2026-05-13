const authEndpoints = [
  { method: 'POST', route: '/login', purpose: 'Autentica, cria sessao e retorna token.' },
  { method: 'GET', route: '/me', purpose: 'Carrega usuario autenticado e empresas disponiveis.' },
  {
    method: 'Client',
    route: '401 interceptor',
    purpose: 'Expira sessao, limpa store e retorna para /login automaticamente.',
  },
]

export function SettingsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#f3fbf6)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
          Configuracoes
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-950">
          Ambiente do frontend
        </h2>

        <div className="mt-6 space-y-4">
          <div className="rounded-[1.3rem] bg-slate-950 px-4 py-4 font-mono text-sm text-emerald-300">
            VITE_API_URL={import.meta.env.VITE_API_URL}
          </div>
          <p className="text-sm leading-7 text-slate-600">
            Esse modulo concentra a configuracao do workspace e serve de base
            para futuras preferencias por empresa, integracoes e permissoes.
          </p>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold text-slate-950">
          Contrato inicial esperado
        </p>
        <div className="mt-5 space-y-3">
          {authEndpoints.map((endpoint) => (
            <div
              key={endpoint.route}
              className="rounded-[1.3rem] border border-slate-200 px-4 py-4"
            >
              <p className="font-mono text-sm text-slate-900">
                {endpoint.method} {endpoint.route}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {endpoint.purpose}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
