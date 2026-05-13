type ModulePageProps = {
  title: string
  eyebrow: string
  description: string
  highlights: string[]
  stats: Array<{
    label: string
    value: string
    detail: string
  }>
}

export function ModulePage({
  title,
  eyebrow,
  description,
  highlights,
  stats,
}: ModulePageProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#f2fbf6)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold text-emerald-300">Foco imediato</p>
          <div className="mt-5 space-y-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
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
    </div>
  )
}
