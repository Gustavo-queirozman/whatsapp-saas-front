import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { TagBadge } from '../components/tags/TagBadge'
import { TagPicker } from '../components/tags/TagPicker'
import {
  detectConversationIntent,
  simulateAiRequest,
  suggestConversationReply,
  summarizeConversation,
  type ConversationIntentResult,
} from '../lib/conversationAi'
import { getConversationWaitingLabel } from '../lib/queue'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import type {
  ConversationStatus,
  MessageDirection,
  RealtimeConnectionStatus,
  WorkspaceConversation,
} from '../types/workspace'

const getStatusClasses = (status: ConversationStatus) => {
  if (status === 'Aguardando') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'Finalizada') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const getMessageClasses = (direction: MessageDirection) => {
  if (direction === 'incoming') {
    return 'mr-auto border border-slate-200 bg-white text-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
  }

  if (direction === 'system') {
    return 'mx-auto border border-dashed border-emerald-200 bg-emerald-50 text-emerald-900'
  }

  return 'ml-auto border border-emerald-200 bg-[linear-gradient(135deg,#dcfce7,#f0fdf4)] text-slate-900 shadow-[0_10px_25px_rgba(16,185,129,0.12)]'
}

const createTimeLabel = () =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const createEntryId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const getRealtimeStatusClasses = (status: RealtimeConnectionStatus) => {
  if (status === 'connected') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'connecting') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  if (status === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (status === 'disconnected') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-600'
}

const getRealtimeStatusLabel = (status: RealtimeConnectionStatus) => {
  if (status === 'connected') {
    return 'Socket conectado'
  }

  if (status === 'connecting') {
    return 'Conectando websocket'
  }

  if (status === 'error') {
    return 'Falha no websocket'
  }

  if (status === 'disconnected') {
    return 'Reconectando canal'
  }

  return 'Canal inativo'
}

const formatRealtimeTimestamp = (value: string | null) => {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

type AiActionKey = 'summary' | 'suggestion' | 'intent'

type ConversationAiState = {
  summary?: string
  suggestion?: string
  intent?: ConversationIntentResult
}

export function ConversationsPage() {
  const user = useAuthStore((state) => state.user)
  const conversations = useWorkspaceStore((state) => state.conversations)
  const sectors = useWorkspaceStore((state) => state.sectors)
  const tags = useWorkspaceStore((state) => state.tags)
  const realtime = useWorkspaceStore((state) => state.realtime)
  const assignConversation = useWorkspaceStore((state) => state.assignConversation)
  const updateConversation = useWorkspaceStore((state) => state.updateConversation)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [activeConversationId, setActiveConversationId] = useState(
    conversations[0]?.id ?? '',
  )
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        conversations.map((conversation) => [conversation.id, conversation.sectorId]),
      ),
  )
  const [showHistory, setShowHistory] = useState(true)
  const [draftMessages, setDraftMessages] = useState<Record<string, string>>({})
  const [conversationAiStates, setConversationAiStates] = useState<
    Record<string, ConversationAiState>
  >({})
  const [conversationAiLoading, setConversationAiLoading] = useState<
    Record<string, Partial<Record<AiActionKey, boolean>>>
  >({})
  const [filters, setFilters] = useState({
    sector: 'Todos',
    status: 'Todos',
    tagId: 'all',
    attendant: 'Todos',
  })

  const currentAgentName = user?.name?.trim() || 'Marina Lopes'
  const currentAgentRole = user?.email ? 'Agente autenticado' : 'Supervisora online'
  const realtimeStatusDetail =
    formatRealtimeTimestamp(realtime.lastEventAt) ??
    formatRealtimeTimestamp(realtime.lastConnectedAt) ??
    formatRealtimeTimestamp(realtime.lastDisconnectedAt)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const sectorMap = useMemo(
    () => new Map(sectors.map((sector) => [sector.id, sector])),
    [sectors],
  )

  const activeTagFilter =
    filters.tagId === 'all' || tags.some((tag) => tag.id === filters.tagId)
      ? filters.tagId
      : 'all'

  const sectorFilterOptions = ['Todos', ...sectors.map((sector) => sector.name)]

  const statusFilterOptions: Array<ConversationStatus | 'Todos'> = [
    'Todos',
    'Aguardando',
    'Em atendimento',
    'Finalizada',
  ]

  const attendantFilterOptions = [
    'Todos',
    'Nao atribuido',
    ...Array.from(
      new Set(
        conversations
          .map((item) => item.attendant)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  ]

  const filteredConversations = conversations.filter((conversation) => {
    const sectorName = sectorMap.get(conversation.sectorId)?.name ?? 'Sem setor'
    const matchesSector = filters.sector === 'Todos' || sectorName === filters.sector
    const matchesStatus =
      filters.status === 'Todos' || conversation.status === filters.status
    const matchesTag =
      activeTagFilter === 'all' || conversation.tagIds.includes(activeTagFilter)
    const matchesAttendant =
      filters.attendant === 'Todos' ||
      (filters.attendant === 'Nao atribuido'
        ? conversation.attendant === null
        : conversation.attendant === filters.attendant)

    return matchesSector && matchesStatus && matchesTag && matchesAttendant
  })

  const resolvedConversationId = filteredConversations.some(
    (item) => item.id === activeConversationId,
  )
    ? activeConversationId
    : (filteredConversations[0]?.id ?? '')

  const activeConversation =
    conversations.find((item) => item.id === resolvedConversationId) ??
    filteredConversations[0] ??
    null
  const draftMessage = activeConversation ? draftMessages[activeConversation.id] ?? '' : ''
  const activeConversationAiState = activeConversation
    ? conversationAiStates[activeConversation.id]
    : undefined
  const activeConversationAiLoading = activeConversation
    ? conversationAiLoading[activeConversation.id] ?? {}
    : {}

  const selectedSector =
    (activeConversation ? transferTargets[activeConversation.id] : null) ??
    activeConversation?.sectorId ??
    sectors[0]?.id ??
    ''

  const setConversationDraftMessage = (conversationId: string, value: string) => {
    setDraftMessages((current) => ({
      ...current,
      [conversationId]: value,
    }))
  }

  const setAiActionLoading = (
    conversationId: string,
    action: AiActionKey,
    isLoading: boolean,
  ) => {
    setConversationAiLoading((current) => ({
      ...current,
      [conversationId]: {
        ...current[conversationId],
        [action]: isLoading,
      },
    }))
  }

  const patchConversationAiState = (
    conversationId: string,
    patch: Partial<ConversationAiState>,
  ) => {
    setConversationAiStates((current) => ({
      ...current,
      [conversationId]: {
        ...current[conversationId],
        ...patch,
      },
    }))
  }

  const handleAssumeConversation = () => {
    if (!activeConversation || activeConversation.status === 'Finalizada') {
      return
    }

    assignConversation(activeConversation.id, currentAgentName)
  }

  const handleTransferSector = () => {
    if (!activeConversation || !selectedSector || selectedSector === activeConversation.sectorId) {
      return
    }

    const now = new Date()
    const targetSectorName = sectorMap.get(selectedSector)?.name ?? 'Novo setor'

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      sectorId: selectedSector,
      attendant: null,
      status: conversation.status === 'Finalizada' ? 'Finalizada' : 'Aguardando',
      queuedAt: now.toISOString(),
      lastAssignedAt: conversation.status === 'Finalizada' ? conversation.lastAssignedAt : null,
      history: [
        {
          id: createEntryId('hist'),
          title: 'Transferencia de setor',
          description: `Conversa transferida para ${targetSectorName} e devolvida para a fila.`,
          time: createTimeLabel(),
        },
        ...conversation.history,
      ],
    }))
  }

  const handleFinishConversation = () => {
    if (!activeConversation || activeConversation.status === 'Finalizada') {
      return
    }

    const now = new Date()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      status: 'Finalizada',
      unreadCount: 0,
      closedAt: now.toISOString(),
      history: [
        {
          id: createEntryId('hist'),
          title: 'Conversa finalizada',
          description: `Encerramento realizado por ${currentAgentName}.`,
          time: createTimeLabel(),
        },
        ...conversation.history,
      ],
    }))
  }

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = draftMessage.trim()

    if (!activeConversation || !message || activeConversation.status === 'Finalizada') {
      return
    }

    const now = new Date()
    const timeLabel = createTimeLabel()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      status: 'Em atendimento',
      attendant: conversation.attendant ?? currentAgentName,
      lastAssignedAt: conversation.lastAssignedAt ?? now.toISOString(),
      closedAt: null,
      lastMessage: message,
      lastMessageTime: timeLabel,
      unreadCount: 0,
      messages: [
        ...conversation.messages,
        {
          id: createEntryId('msg'),
          direction: 'outgoing',
          content: message,
          sender: currentAgentName,
          time: timeLabel,
        },
      ],
      history: [
        {
          id: createEntryId('hist'),
          title: 'Mensagem enviada',
          description: `${currentAgentName} respondeu a conversa.`,
          time: timeLabel,
        },
        ...conversation.history,
      ],
    }))

    setDraftMessages((current) => ({
      ...current,
      [activeConversation.id]: '',
    }))
  }

  const handleToggleConversationTag = (tagId: string) => {
    if (!activeConversation) {
      return
    }

    const tag = tagMap.get(tagId)

    if (!tag) {
      return
    }

    const timeLabel = createTimeLabel()
    const wasApplied = activeConversation.tagIds.includes(tagId)

    updateConversation(activeConversation.id, (conversation: WorkspaceConversation) => ({
      ...conversation,
      tagIds: wasApplied
        ? conversation.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...conversation.tagIds, tagId],
      history: [
        {
          id: createEntryId('hist'),
          title: wasApplied ? 'Tag removida' : 'Tag aplicada',
          description: `${currentAgentName} ${wasApplied ? 'removeu' : 'aplicou'} a tag ${tag.name}.`,
          time: timeLabel,
        },
        ...conversation.history,
      ],
    }))
  }

  const handleGenerateSummary = async () => {
    if (!activeConversation) {
      return
    }

    const conversation = activeConversation

    setAiActionLoading(conversation.id, 'summary', true)

    try {
      const summary = await simulateAiRequest(() => summarizeConversation(conversation))
      patchConversationAiState(conversation.id, { summary })
    } finally {
      setAiActionLoading(conversation.id, 'summary', false)
    }
  }

  const handleDetectIntent = async () => {
    if (!activeConversation) {
      return
    }

    const conversation = activeConversation

    setAiActionLoading(conversation.id, 'intent', true)

    try {
      const intent = await simulateAiRequest(() => detectConversationIntent(conversation), 950)
      patchConversationAiState(conversation.id, { intent })
    } finally {
      setAiActionLoading(conversation.id, 'intent', false)
    }
  }

  const handleSuggestReply = async () => {
    if (!activeConversation || activeConversation.status === 'Finalizada') {
      return
    }

    const conversation = activeConversation

    setAiActionLoading(conversation.id, 'suggestion', true)

    try {
      const intent =
        conversationAiStates[conversation.id]?.intent ?? detectConversationIntent(conversation)
      const suggestion = await simulateAiRequest(
        () => suggestConversationReply(conversation, intent),
        1250,
      )

      patchConversationAiState(conversation.id, {
        intent,
        suggestion,
      })
      setConversationDraftMessage(conversation.id, suggestion)
    } finally {
      setAiActionLoading(conversation.id, 'suggestion', false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#f6fff8,#ffffff_48%,#eefaf3)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Operacao ao vivo
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Atendimento centralizado no padrao WhatsApp Web
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Filtre a fila por setor, status, tag e atendente. Abra qualquer conversa,
              assuma o atendimento, transfira o setor, finalize ou responda sem sair
              da mesma tela.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getRealtimeStatusClasses(realtime.status)}`}
              >
                {getRealtimeStatusLabel(realtime.status)}
              </span>
              {realtimeStatusDetail ? (
                <span className="text-xs text-slate-500">
                  Ultimo evento em {realtimeStatusDetail}
                </span>
              ) : null}
              {realtime.retryCount ? (
                <span className="text-xs text-slate-500">
                  Tentativa {realtime.retryCount}
                </span>
              ) : null}
            </div>
            {realtime.lastError ? (
              <p className="mt-3 text-sm text-rose-600">{realtime.lastError}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.4rem] border border-emerald-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Conversas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {filteredConversations.length}
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-amber-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Aguardando
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {filteredConversations.filter((item) => item.status === 'Aguardando').length}
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-slate-200 bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Agente ativo
              </p>
              <p className="mt-2 text-base font-semibold">{currentAgentName}</p>
              <p className="mt-1 text-xs text-slate-400">{currentAgentRole}</p>
            </article>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Setor
            </span>
            <select
              value={filters.sector}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sector: event.target.value }))
              }
              className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
            >
              {sectorFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
            >
              {statusFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tag
            </span>
            <select
              value={activeTagFilter}
              onChange={(event) =>
                setFilters((current) => ({ ...current, tagId: event.target.value }))
              }
              className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
            >
              <option value="all">Todas</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Atendente
            </span>
            <select
              value={filters.attendant}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  attendant: event.target.value,
                }))
              }
              className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
            >
              {attendantFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid min-h-[720px] gap-4 xl:grid-cols-[320px,minmax(0,1fr),340px]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Fila de conversas
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {filteredConversations.length} resultados no filtro atual
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getRealtimeStatusClasses(realtime.status)}`}
                >
                  {realtime.status === 'connected' ? 'Live' : 'Sync'}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#25d366,#0f766e)] text-sm font-semibold text-slate-950">
                  WA
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversation?.id
                const sectorName =
                  sectorMap.get(conversation.sectorId)?.name ?? 'Sem setor'

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={[
                      'mb-2 w-full rounded-[1.4rem] border px-4 py-4 text-left transition',
                      isActive
                        ? 'border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] shadow-[0_18px_36px_rgba(16,185,129,0.12)]'
                        : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {conversation.contactName}
                          </p>
                          {conversation.unreadCount ? (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {conversation.company}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-400">
                        {conversation.lastMessageTime}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">
                      {conversation.lastMessage}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(conversation.status)}`}
                      >
                        {conversation.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {sectorName}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {conversation.attendant ?? 'Sem responsavel'}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                        {getConversationWaitingLabel(conversation, nowTick)}
                      </span>
                      {conversation.tagIds.slice(0, 2).map((tagId) => {
                        const tag = tagMap.get(tagId)
                        return tag ? <TagBadge key={tag.id} tag={tag} /> : null
                      })}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    Nenhuma conversa encontrada
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ajuste os filtros para visualizar outra fila de atendimento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#f5fff8,#eef7f1)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          {activeConversation ? (
            <>
              <header className="border-b border-emerald-100 bg-white/86 px-4 py-4 backdrop-blur md:px-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-950">
                        {activeConversation.contactName}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(activeConversation.status)}`}
                      >
                        {activeConversation.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {activeConversation.phone} | {activeConversation.company} |{' '}
                      {activeConversation.channel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeConversation.tagIds.map((tagId) => {
                        const tag = tagMap.get(tagId)
                        return tag ? <TagBadge key={tag.id} tag={tag} size="md" /> : null
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAssumeConversation}
                      disabled={activeConversation.status === 'Finalizada'}
                      className="rounded-[1rem] border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      Assumir atendimento
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishConversation}
                      disabled={activeConversation.status === 'Finalizada'}
                      className="rounded-[1rem] border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Finalizar conversa
                    </button>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-5">
                <div className="space-y-3">
                  {activeConversation.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 ${getMessageClasses(message.direction)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {message.sender}
                        </p>
                        <span className="shrink-0 text-xs text-slate-400">
                          {message.time}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{message.content}</p>
                    </article>
                  ))}
                </div>
              </div>

              <footer className="border-t border-emerald-100 bg-white/90 px-4 py-4 md:px-5">
                <form className="space-y-3" onSubmit={handleSendMessage}>
                  <section className="rounded-[1.4rem] border border-emerald-100 bg-[linear-gradient(135deg,#f3fff8,#ffffff_58%,#eefcf4)] p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          IA leve
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          Gere resumo, detecte a intencao do cliente e monte uma resposta
                          inicial para revisar antes do envio.
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={handleGenerateSummary}
                          disabled={Boolean(activeConversationAiLoading.summary)}
                          className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {activeConversationAiLoading.summary ? (
                            <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          ) : null}
                          Resumir conversa
                        </button>
                        <button
                          type="button"
                          onClick={handleSuggestReply}
                          disabled={
                            activeConversation.status === 'Finalizada' ||
                            Boolean(activeConversationAiLoading.suggestion)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {activeConversationAiLoading.suggestion ? (
                            <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          ) : null}
                          Sugerir resposta
                        </button>
                        <button
                          type="button"
                          onClick={handleDetectIntent}
                          disabled={Boolean(activeConversationAiLoading.intent)}
                          className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {activeConversationAiLoading.intent ? (
                            <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          ) : null}
                          Detectar intencao
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      <article className="rounded-[1.2rem] border border-white bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Resumo rapido
                        </p>
                        {activeConversationAiLoading.summary ? (
                          <p className="mt-3 text-sm text-slate-500">
                            Lendo o historico para montar um resumo...
                          </p>
                        ) : activeConversationAiState?.summary ? (
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {activeConversationAiState.summary}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            Gere um resumo para destacar contexto, status e ultimas
                            mensagens.
                          </p>
                        )}
                      </article>

                      <article className="rounded-[1.2rem] border border-white bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Intencao detectada
                        </p>
                        {activeConversationAiLoading.intent ? (
                          <p className="mt-3 text-sm text-slate-500">
                            Cruzando palavras-chave e sinais da conversa...
                          </p>
                        ) : activeConversationAiState?.intent ? (
                          <div className="mt-3 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                                {activeConversationAiState.intent.label}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                Confianca {activeConversationAiState.intent.confidence}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-slate-700">
                              {activeConversationAiState.intent.description}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            Identifique o objetivo principal do cliente para responder com
                            mais contexto.
                          </p>
                        )}
                      </article>

                      <article className="rounded-[1.2rem] border border-white bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] xl:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Sugestao aplicada ao rascunho
                        </p>
                        {activeConversationAiLoading.suggestion ? (
                          <p className="mt-3 text-sm text-slate-500">
                            Preparando uma resposta inicial para o atendente revisar...
                          </p>
                        ) : activeConversationAiState?.suggestion ? (
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            A sugestao foi inserida no campo abaixo e pode ser editada antes
                            do envio.
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            Gere uma resposta e refine o texto manualmente antes de falar com
                            o cliente.
                          </p>
                        )}
                      </article>
                    </div>
                  </section>

                  <textarea
                    value={draftMessage}
                    onChange={(event) =>
                      setConversationDraftMessage(activeConversation.id, event.target.value)
                    }
                    placeholder={
                      activeConversation.status === 'Finalizada'
                        ? 'Conversa finalizada. Reabra o fluxo para enviar novas mensagens.'
                        : 'Digite a resposta para o cliente...'
                    }
                    disabled={activeConversation.status === 'Finalizada'}
                    rows={3}
                    className="w-full resize-none rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">
                      Responsavel:{' '}
                      <span className="font-semibold text-slate-800">
                        {activeConversation.attendant ?? 'Nao atribuido'}
                      </span>
                    </p>

                    <button
                      type="submit"
                      disabled={
                        activeConversation.status === 'Finalizada' || !draftMessage.trim()
                      }
                      className="rounded-[1rem] bg-[linear-gradient(135deg,#0f766e,#25d366)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(16,185,129,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      Enviar mensagem
                    </button>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  Selecione uma conversa
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Abra um atendimento na coluna esquerda para visualizar mensagens e
                  responder.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col gap-4 rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-5">
          {activeConversation ? (
            <>
              <section className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f4faf6)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Dados do contato
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {activeConversation.contactName}
                    </h3>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-[1.25rem] bg-[linear-gradient(135deg,#05251f,#25d366)] text-base font-semibold text-white">
                    {activeConversation.contactName
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>{activeConversation.summary}</p>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Telefone
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {activeConversation.phone}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Observacoes
                    </p>
                    <p className="mt-2 leading-6 text-slate-700">
                      {activeConversation.notes}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <article className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Setor atual
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {sectorMap.get(activeConversation.sectorId)?.name ?? 'Sem setor'}
                  </p>
                </article>
                <article className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Atendente
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {activeConversation.attendant ?? 'Nao atribuido'}
                  </p>
                </article>
                <article className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Tempo de fila
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    {getConversationWaitingLabel(activeConversation, nowTick)}
                  </p>
                </article>
              </section>

              <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Transferir setor
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <select
                    value={selectedSector}
                    onChange={(event) =>
                      setTransferTargets((current) => ({
                        ...current,
                        [activeConversation.id]: event.target.value,
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
                  >
                    {sectors.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleTransferSector}
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800"
                  >
                    Transferir setor
                  </button>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Etiquetas da conversa
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Aplique ou remova tags sem sair do painel de atendimento.
                </p>
                <div className="mt-4">
                  <TagPicker
                    tags={tags}
                    selectedTagIds={activeConversation.tagIds}
                    onToggle={handleToggleConversationTag}
                    emptyMessage="Nenhuma tag disponivel. Crie a primeira em Configuracoes."
                  />
                </div>
              </section>

              <section className="min-h-0 flex-1 rounded-[1.5rem] border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Historico
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Acoes e eventos do atendimento
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistory((current) => !current)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  >
                    {showHistory ? 'Ocultar historico' : 'Mostrar historico'}
                  </button>
                </div>

                {showHistory ? (
                  <div className="max-h-[340px] space-y-3 overflow-y-auto px-4 py-4">
                    {activeConversation.history.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-950">
                            {item.title}
                          </p>
                          <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid h-[180px] place-items-center px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Historico oculto
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Ative novamente para revisar a trilha completa do atendimento.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  Nenhum contato selecionado
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Os dados do contato aparecem aqui quando uma conversa e aberta.
                </p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
