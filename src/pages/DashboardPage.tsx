import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { getDashboardOverview } from '../lib/dashboard'
import { useAuthStore } from '../store/authStore'
import type { DashboardOverview } from '../types/dashboard'

const numberFormatter = new Intl.NumberFormat('pt-BR')

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | {
          message?: string
          errors?: Record<string, string[]>
        }
      | undefined

    const firstValidationMessage = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null

    return firstValidationMessage ?? data?.message ?? 'Falha ao carregar o dashboard.'
  }

  return error instanceof Error ? error.message : 'Falha ao carregar o dashboard.'
}

const formatNumber = (value: number) => numberFormatter.format(value)

const formatDateTime = (value: Date | null) => {
  if (!value) {
    return 'Ainda nao atualizado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)
}

const getAttendantInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function DashboardPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(Boolean(currentCompany?.id))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!currentCompany?.id) {
      return
    }

    let isMounted = true

    const loadOverview = async () => {
      setIsPageLoading(true)
      setPageError(null)

      try {
        const response = await getDashboardOverview()

        if (!isMounted) {
          return
        }

        setOverview(response)
        setLastUpdatedAt(new Date())
      } catch (error) {
        if (!isMounted) {
          return
        }

        setOverview(null)
        setPageError(getErrorMessage(error))
      } finally {
        if (isMounted) {
          setIsPageLoading(false)
        }
      }
    }

    void loadOverview()

    return () => {
      isMounted = false
    }
  }, [currentCompany?.id])

  const handleRefresh = async () => {
    if (!currentCompany?.id) {
      return
    }

    setIsRefreshing(true)
    setPageError(null)

    try {
      const response = await getDashboardOverview()
      setOverview(response)
      setLastUpdatedAt(new Date())
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsRefreshing(false)
    }
  }

  const metricCards = useMemo(() => {
    if (!overview) {
      return []
    }

    return [
      {
        label: 'Conversas do dia',
        value: overview.conversations_today,
        accent: 'border-emerald-100 text-emerald-700',
        detail: 'Novas conversas abertas hoje',
      },
      {
        label: 'Mensagens do dia',
        value: overview.messages_today,
        accent: 'border-sky-100 text-sky-700',
        detail: 'Entradas e saidas registradas hoje',
      },
      {
        label: 'Aguardando',
        value: overview.waiting_conversations,
        accent: 'border-amber-100 text-amber-700',
        detail: 'Conversas paradas na fila',
      },
      {
        label: 'Abertas',
        value: overview.open_conversations,
        accent: 'border-emerald-100 text-emerald-700',
        detail: 'Atendimentos ativos na operacao',
      },
      {
        label: 'Finalizadas',
        value: overview.closed_conversations,
        accent: 'border-slate-200 text-slate-700',
        detail: 'Conversas encerradas no total',
      },
      {
        label: 'Numeros conectados',
        value: overview.connected_numbers,
        accent: 'border-violet-100 text-violet-700',
        detail: 'Instancias WhatsApp online',
      },
    ]
  }, [overview])

  const topSectorTotal = Math.max(
    ...(overview?.conversations_by_sector.map((item) => item.total_conversations) ?? [1]),
  )

  if (!currentCompany?.id) {
    return (
      <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        Selecione uma empresa antes de visualizar o dashboard.
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#071d1a_0%,#0d3a31_48%,#25d366_190%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Dashboard operacional
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight">
            Panorama da operacao de WhatsApp com leitura direta do endpoint de overview.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
            O painel consolida volume do dia, fila atual, numeros conectados, distribuicao
            por setor e ranking de atendentes da empresa ativa.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium">
              Empresa: {currentCompany.name}
            </div>
            <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium">
              Atualizado: {formatDateTime(lastUpdatedAt)}
            </div>
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Resumo de resposta</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tempo medio da primeira resposta calculado com as conversas criadas hoje.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isPageLoading || isRefreshing}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-emerald-100 bg-[linear-gradient(135deg,#f3fff8,#ffffff_58%,#eefcf4)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Primeira resposta
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {overview?.average_first_response_time.formatted ?? '--:--:--'}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {overview?.average_first_response_time.conversations_count
                ? `${formatNumber(overview.average_first_response_time.conversations_count)} conversas com tempo medio calculado hoje.`
                : 'Ainda nao existe amostra suficiente para calcular a media de resposta de hoje.'}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Endpoint
              </p>
              <p className="mt-2 font-mono text-sm text-slate-900">/api/dashboard/overview</p>
            </div>
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Base da API
              </p>
              <p className="mt-2 truncate font-mono text-sm text-slate-900">
                {import.meta.env.VITE_API_URL}
              </p>
            </div>
          </div>
        </article>
      </section>

      {pageError ? (
        <section className="rounded-[1.7rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          {pageError}
        </section>
      ) : null}

      {isPageLoading ? (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          Carregando indicadores do dashboard...
        </section>
      ) : null}

      {!isPageLoading && overview ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {metricCards.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.accent}`}
                  >
                    KPI
                  </span>
                </div>
                <p className="mt-4 text-4xl font-semibold text-slate-950">
                  {formatNumber(item.value)}
                </p>
                <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 2xl:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Por setor
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                    Conversas distribuidas por operacao
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Leitura simples do volume total por setor, com detalhamento de abertas,
                    aguardando e finalizadas.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {overview.conversations_by_sector.length} setores
                </div>
              </div>

              {overview.conversations_by_sector.length ? (
                <div className="mt-8 space-y-4">
                  {overview.conversations_by_sector.map((sector) => {
                    const width = `${Math.max(
                      (sector.total_conversations / topSectorTotal) * 100,
                      10,
                    )}%`

                    return (
                      <article
                        key={sector.sector_id}
                        className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8faf9)] p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-semibold text-slate-950">
                                {sector.sector_name}
                              </p>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                {sector.sector_slug}
                              </span>
                            </div>

                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#25d366)]"
                                style={{ width }}
                              />
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <div className="rounded-[1.1rem] bg-slate-50 px-3 py-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                  Abertas
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                  {formatNumber(sector.open_conversations)}
                                </p>
                              </div>
                              <div className="rounded-[1.1rem] bg-amber-50 px-3 py-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-600">
                                  Aguardando
                                </p>
                                <p className="mt-1 text-sm font-semibold text-amber-700">
                                  {formatNumber(sector.waiting_conversations)}
                                </p>
                              </div>
                              <div className="rounded-[1.1rem] bg-slate-100 px-3 py-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                  Finalizadas
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  {formatNumber(sector.closed_conversations)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 px-4 py-4 text-center lg:min-w-[140px]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              Total
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-950">
                              {formatNumber(sector.total_conversations)}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Nenhum setor com conversas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    O grafico sera preenchido quando a empresa tiver conversas vinculadas a
                    setores.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Ranking de atendentes
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                    Volume por responsavel
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Lista ordenada pelo total de conversas atribuidas na empresa atual.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {overview.conversations_by_attendant.length} atendentes
                </div>
              </div>

              {overview.conversations_by_attendant.length ? (
                <div className="mt-8 space-y-4">
                  {overview.conversations_by_attendant.map((attendant, index) => (
                    <article
                      key={attendant.user_id}
                      className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8faf9)] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#05251f,#25d366)] text-sm font-semibold text-white">
                            {getAttendantInitials(attendant.user_name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="truncate text-lg font-semibold text-slate-950">
                                {attendant.user_name}
                              </p>
                              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                #{index + 1}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                Abertas: {formatNumber(attendant.open_conversations)}
                              </span>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Aguardando: {formatNumber(attendant.waiting_conversations)}
                              </span>
                              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                                Finalizadas: {formatNumber(attendant.closed_conversations)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-center lg:min-w-[148px]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Total
                          </p>
                          <p className="mt-2 text-3xl font-semibold text-slate-950">
                            {formatNumber(attendant.total_conversations)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Nenhum atendente ranqueado
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    O ranking aparece quando existirem conversas atribuidas a usuarios da
                    empresa.
                  </p>
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}
