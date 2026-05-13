import { useAuthStore } from '../store/authStore'

const stats = [
  { label: 'Mensagens hoje', value: '18.240', detail: '+14% em relacao a ontem' },
  { label: 'Atendimentos em curso', value: '126', detail: '19 aguardando resposta' },
  { label: 'Leads em automacao', value: '3.482', detail: '7 fluxos ativos agora' },
]

const lanes = [
  {
    title: 'Atendimento',
    value: '42 tickets',
    description: 'Fila com pico moderado e SLA dentro da meta.',
  },
  {
    title: 'Campanhas',
    value: '5 envios',
    description: 'Dois disparos programados para o fim da tarde.',
  },
  {
    title: 'CRM',
    value: '84 oportunidades',
    description: '12 negociacoes com follow-up vencendo hoje.',
  },
]

export function DashboardPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#05251f_0%,#0d3a31_52%,#25d366_180%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Visao geral
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight">
            Controle a operacao do WhatsApp em um unico painel responsivo.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/88">
            A base do frontend agora organiza atendimento, contatos,
            campanhas, CRM, chatbot e configuracoes em um shell unico de
            navegacao.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
              Empresa ativa: {currentCompany?.name ?? 'Nao selecionada'}
            </div>
            <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
              Canal principal: WhatsApp
            </div>
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold text-slate-950">Endpoint da API</p>
          <p className="mt-4 rounded-[1.2rem] bg-slate-950 px-4 py-4 font-mono text-sm text-emerald-300">
            {import.meta.env.VITE_API_URL}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            O topo do layout concentra empresa, usuario logado e a troca de
            workspace sem depender de telas auxiliares.
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {item.value}
            </p>
            <p className="mt-3 text-sm text-emerald-700">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-950">Modulos do shell</p>
          <div className="mt-5 space-y-3">
            {lanes.map((lane) => (
              <div
                key={lane.title}
                className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{lane.title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                    {lane.value}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {lane.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eefaf3)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-950">Estrutura entregue</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'Sidebar persistente no desktop',
              'Drawer responsivo no mobile',
              'Topbar com empresa e usuario',
              'Menu de 8 modulos principais',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-emerald-100 bg-white px-4 py-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
