import { useEffect, useMemo, useState } from 'react'
import { getConversationWaitInMinutes, getConversationWaitingLabel } from '../lib/queue'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'

export function QueuesPage() {
  const user = useAuthStore((state) => state.user)
  const attendants = useWorkspaceStore((state) => state.attendants)
  const sectors = useWorkspaceStore((state) => state.sectors)
  const conversations = useWorkspaceStore((state) => state.conversations)
  const assignConversation = useWorkspaceStore((state) => state.assignConversation)
  const autoDistributeSectorQueue = useWorkspaceStore(
    (state) => state.autoDistributeSectorQueue,
  )
  const [nowTick, setNowTick] = useState(() => Date.now())

  const currentAgentName = user?.name?.trim() || 'Marina Lopes'

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const attendantMap = useMemo(
    () => new Map(attendants.map((attendant) => [attendant.id, attendant])),
    [attendants],
  )

  const queueOverview = useMemo(
    () =>
      sectors.map((sector) => {
        const sectorConversations = conversations.filter(
          (conversation) => conversation.sectorId === sector.id,
        )
        const waiting = sectorConversations.filter(
          (conversation) => conversation.status === 'Aguardando',
        )
        const active = sectorConversations.filter(
          (conversation) => conversation.status === 'Em atendimento',
        )
        const longestWait = waiting.length
          ? Math.max(
              ...waiting.map((conversation) =>
                getConversationWaitInMinutes(conversation, nowTick),
              ),
            )
          : 0

        return {
          sector,
          waiting,
          active,
          availableAttendants: sector.attendantIds
            .map((attendantId) => attendantMap.get(attendantId))
            .filter(Boolean),
          longestWait,
        }
      }),
    [attendantMap, conversations, nowTick, sectors],
  )

  const totalWaiting = queueOverview.reduce(
    (accumulator, item) => accumulator + item.waiting.length,
    0,
  )

  const totalInAttendance = queueOverview.reduce(
    (accumulator, item) => accumulator + item.active.length,
    0,
  )

  const sectorsWithSlaRisk = queueOverview.filter(
    (item) => item.longestWait > item.sector.slaMinutes,
  ).length

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#f4fbf7)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Filas por setor
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Orquestre a fila e distribua a operacao em poucos cliques
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Veja o volume aguardando por setor, acompanhe o tempo de espera de cada
              conversa, assuma manualmente e acione distribuicao automatica para a
              equipe vinculada.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Em fila
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{totalWaiting}</p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Em atendimento
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {totalInAttendance}
              </p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-slate-950 px-4 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Risco de SLA
              </p>
              <p className="mt-2 text-2xl font-semibold">{sectorsWithSlaRisk}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {queueOverview.map(({ sector, waiting, active, availableAttendants, longestWait }) => {
          const hasSlaRisk = longestWait > sector.slaMinutes

          return (
            <article
              key={sector.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: sector.color }}
                    />
                    <h3 className="text-2xl font-semibold text-slate-950">{sector.name}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      SLA {sector.slaMinutes} min
                    </span>
                    {hasSlaRisk ? (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        SLA em risco
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        SLA controlado
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {sector.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => autoDistributeSectorQueue(sector.id)}
                    disabled={!waiting.length || !availableAttendants.length}
                    className="rounded-[1rem] border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Distribuir automaticamente
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Aguardando
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{waiting.length}</p>
                </article>
                <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Em atendimento
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{active.length}</p>
                </article>
                <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Maior espera
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {waiting[0] ? getConversationWaitingLabel(waiting[0], nowTick) : 'Sem fila'}
                  </p>
                </article>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Atendentes vinculados
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableAttendants.length ? (
                    availableAttendants.map((attendant) => (
                      <span
                        key={attendant?.id}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {attendant?.name} · {attendant?.status}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Nenhum atendente vinculado
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Conversas na fila</p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Operador atual: {currentAgentName}
                  </p>
                </div>

                {waiting.length ? (
                  waiting
                    .slice()
                    .sort(
                      (first, second) =>
                        new Date(first.queuedAt).getTime() -
                        new Date(second.queuedAt).getTime(),
                    )
                    .map((conversation) => {
                      const waitInMinutes = getConversationWaitInMinutes(
                        conversation,
                        nowTick,
                      )
                      const slaBreached = waitInMinutes > sector.slaMinutes

                      return (
                        <div
                          key={conversation.id}
                          className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-slate-950">
                                  {conversation.contactName}
                                </p>
                                <span
                                  className={[
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    slaBreached
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700',
                                  ].join(' ')}
                                >
                                  {getConversationWaitingLabel(conversation, nowTick)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                {conversation.company} · {conversation.phone}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-700">
                                {conversation.lastMessage}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  assignConversation(conversation.id, currentAgentName)
                                }
                                className="rounded-[0.95rem] border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                Assumir conversa
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-950">Fila zerada</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Nenhuma conversa aguardando neste setor agora.
                    </p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
