import { useAuthStore } from '../store/authStore'

const stats = [
  { label: 'Mensagens hoje', value: '1.284', detail: '+12% vs ontem' },
  { label: 'Atendimentos ativos', value: '37', detail: '6 aguardando retorno' },
  { label: 'Taxa de entrega', value: '98,4%', detail: 'Baseado no ultimo lote' },
]

export function DashboardPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#fff6ea,#ffffff)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
            Overview
          </p>
          <h3 className="mt-4 max-w-lg text-3xl font-semibold text-slate-950">
            Estrutura inicial montada para operar automacoes, filas e sessoes.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Use esta area para plugar indicadores reais do backend Laravel,
            como volume de mensagens, status de instancias e metricas de
            atendimento.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700">
            Empresa ativa: {currentCompany?.name ?? 'Nao selecionada'}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-900">
            Endpoint base da API
          </p>
          <p className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 font-mono text-sm text-orange-200">
            {import.meta.env.VITE_API_URL}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Defina esse valor no arquivo <span className="font-mono">.env</span>{' '}
            para apontar o frontend para o backend Laravel correto.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">
              {item.value}
            </p>
            <p className="mt-3 text-sm text-emerald-600">{item.detail}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
