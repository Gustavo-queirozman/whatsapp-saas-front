export function FullscreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/80 px-8 py-6 shadow-[0_24px_80px_rgba(17,32,59,0.12)] backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="h-3 w-3 animate-pulse rounded-full bg-orange-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Carregando
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Validando sessao com a API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
