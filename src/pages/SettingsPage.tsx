const authEndpoints = [
  { method: 'POST', route: '/login', purpose: 'Autentica e retorna token.' },
  { method: 'GET', route: '/me', purpose: 'Carrega usuario autenticado.' },
]

export function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
          Ambiente
        </p>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">
          Configuracao do frontend
        </h3>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-950 px-4 py-4 font-mono text-sm text-orange-200">
            VITE_API_URL={import.meta.env.VITE_API_URL}
          </div>
          <p className="text-sm leading-7 text-slate-600">
            Se sua API Laravel estiver usando outro prefixo, ajuste os paths no
            store de autenticacao e nas proximas integracoes de pagina.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold text-slate-900">
          Contrato inicial esperado
        </p>
        <div className="mt-5 space-y-3">
          {authEndpoints.map((endpoint) => (
            <div
              key={endpoint.route}
              className="rounded-2xl border border-slate-200 px-4 py-4"
            >
              <p className="font-mono text-sm text-slate-900">
                {endpoint.method} {endpoint.route}
              </p>
              <p className="mt-2 text-sm text-slate-600">{endpoint.purpose}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
