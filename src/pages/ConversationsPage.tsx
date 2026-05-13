import { useState } from 'react'
import type { FormEvent } from 'react'

type ConversationStatus = 'Aguardando' | 'Em atendimento' | 'Finalizada'
type MessageDirection = 'incoming' | 'outgoing' | 'system'

type Message = {
  id: string
  direction: MessageDirection
  content: string
  sender: string
  time: string
}

type HistoryItem = {
  id: string
  title: string
  description: string
  time: string
}

type Conversation = {
  id: string
  contactName: string
  phone: string
  company: string
  sector: string
  status: ConversationStatus
  tags: string[]
  attendant: string | null
  waitingSince: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  summary: string
  notes: string
  channel: string
  messages: Message[]
  history: HistoryItem[]
}

const currentAgent = {
  name: 'Marina Lopes',
  role: 'Supervisora online',
}

const sectorOptions = ['Comercial', 'Suporte', 'Financeiro', 'Onboarding']

const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    contactName: 'Ana Costa',
    phone: '+55 11 99871-2304',
    company: 'Studio Avela',
    sector: 'Financeiro',
    status: 'Aguardando',
    tags: ['VIP', 'Boleto'],
    attendant: null,
    waitingSince: '12 min',
    lastMessage: 'Pode confirmar se o boleto compensa hoje?',
    lastMessageTime: '09:14',
    unreadCount: 3,
    summary: 'Cliente aguardando confirmacao de pagamento da renovacao anual.',
    notes: 'Renovacao vence amanha. Priorizar retorno ainda nesta janela.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-1',
        direction: 'incoming',
        content: 'Bom dia, preciso confirmar o pagamento da assinatura.',
        sender: 'Ana Costa',
        time: '08:57',
      },
      {
        id: 'msg-2',
        direction: 'incoming',
        content: 'O boleto que recebi vence hoje e queria saber se a ativacao segue normal.',
        sender: 'Ana Costa',
        time: '09:02',
      },
      {
        id: 'msg-3',
        direction: 'system',
        content: 'Chat roteado automaticamente para o setor Financeiro.',
        sender: 'Sistema',
        time: '09:03',
      },
      {
        id: 'msg-4',
        direction: 'incoming',
        content: 'Pode confirmar se o boleto compensa hoje?',
        sender: 'Ana Costa',
        time: '09:14',
      },
    ],
    history: [
      {
        id: 'hist-1',
        title: 'Entrada no atendimento',
        description: 'Conversa iniciada pelo canal principal do WhatsApp.',
        time: '08:57',
      },
      {
        id: 'hist-2',
        title: 'Triagem automatica',
        description: 'Tag Boleto aplicada e encaminhamento ao Financeiro.',
        time: '09:03',
      },
    ],
  },
  {
    id: 'conv-2',
    contactName: 'Lucas Martins',
    phone: '+55 21 99751-1032',
    company: 'Orbita Imoveis',
    sector: 'Comercial',
    status: 'Em atendimento',
    tags: ['Lead quente', 'Proposta'],
    attendant: 'Joao Pedro',
    waitingSince: '3 min',
    lastMessage: 'Fechado. Pode mandar o contrato ainda hoje.',
    lastMessageTime: '09:09',
    unreadCount: 0,
    summary: 'Negociacao em fechamento com interesse no plano Enterprise.',
    notes: 'Cliente pediu contrato com clausula de onboarding estendido.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-5',
        direction: 'outgoing',
        content: 'Consegui aprovar a proposta com onboarding incluido sem custo adicional.',
        sender: 'Joao Pedro',
        time: '08:48',
      },
      {
        id: 'msg-6',
        direction: 'incoming',
        content: 'Perfeito. Se mandar o contrato hoje, eu consigo assinar.',
        sender: 'Lucas Martins',
        time: '08:52',
      },
      {
        id: 'msg-7',
        direction: 'outgoing',
        content: 'Vou preparar agora. Posso seguir com o CNPJ da Orbita?',
        sender: 'Joao Pedro',
        time: '09:01',
      },
      {
        id: 'msg-8',
        direction: 'incoming',
        content: 'Fechado. Pode mandar o contrato ainda hoje.',
        sender: 'Lucas Martins',
        time: '09:09',
      },
    ],
    history: [
      {
        id: 'hist-3',
        title: 'Atendimento assumido',
        description: 'Joao Pedro assumiu a conversa apos a qualificacao inicial.',
        time: '08:31',
      },
      {
        id: 'hist-4',
        title: 'Etiqueta Proposta aplicada',
        description: 'Conversa movida para monitoramento comercial.',
        time: '08:44',
      },
    ],
  },
  {
    id: 'conv-3',
    contactName: 'Camila Nunes',
    phone: '+55 31 98810-4457',
    company: 'Clinica Revita',
    sector: 'Suporte',
    status: 'Em atendimento',
    tags: ['Prioridade alta', 'Integracao'],
    attendant: 'Marina Lopes',
    waitingSince: 'Agora',
    lastMessage: 'Pode seguir. Estou acompanhando por aqui.',
    lastMessageTime: '09:18',
    unreadCount: 0,
    summary: 'Falha de integracao no envio de lembretes para pacientes.',
    notes: 'Ambiente ja validado. Cliente precisa de retorno em menos de 20 min.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-9',
        direction: 'incoming',
        content: 'Os lembretes nao estao saindo desde cedo. Alguma instabilidade?',
        sender: 'Camila Nunes',
        time: '08:58',
      },
      {
        id: 'msg-10',
        direction: 'outgoing',
        content: 'Estou verificando a fila de integracao e ja volto com a causa.',
        sender: 'Marina Lopes',
        time: '09:04',
      },
      {
        id: 'msg-11',
        direction: 'system',
        content: 'Historico tecnico anexado ao ticket pela operacao.',
        sender: 'Sistema',
        time: '09:11',
      },
      {
        id: 'msg-12',
        direction: 'outgoing',
        content: 'Pode seguir. Estou acompanhando por aqui.',
        sender: 'Marina Lopes',
        time: '09:18',
      },
    ],
    history: [
      {
        id: 'hist-5',
        title: 'Atendimento assumido',
        description: 'Marina Lopes assumiu a conversa para resposta prioritaria.',
        time: '09:01',
      },
      {
        id: 'hist-6',
        title: 'Historico sincronizado',
        description: 'Eventos da integracao enviados para o contexto do agente.',
        time: '09:11',
      },
    ],
  },
  {
    id: 'conv-4',
    contactName: 'Equipe Vitta',
    phone: '+55 71 98761-2210',
    company: 'Vitta Educacao',
    sector: 'Onboarding',
    status: 'Finalizada',
    tags: ['Implantacao', 'Treinamento'],
    attendant: 'Sofia Mendes',
    waitingSince: 'Encerrada',
    lastMessage: 'Treinamento confirmado para sexta, obrigado.',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    summary: 'Treinamento da equipe confirmado e agenda compartilhada.',
    notes: 'Cliente pediu gravacao da sessao para repasse interno.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-13',
        direction: 'outgoing',
        content: 'Fechei a agenda com o time de implantacao para sexta as 10h.',
        sender: 'Sofia Mendes',
        time: '17:02',
      },
      {
        id: 'msg-14',
        direction: 'incoming',
        content: 'Treinamento confirmado para sexta, obrigado.',
        sender: 'Equipe Vitta',
        time: '17:05',
      },
    ],
    history: [
      {
        id: 'hist-7',
        title: 'Transferencia concluida',
        description: 'Atendimento transferido do Comercial para Onboarding.',
        time: '16:11',
      },
      {
        id: 'hist-8',
        title: 'Conversa finalizada',
        description: 'Encerramento realizado apos confirmacao da agenda.',
        time: '17:06',
      },
    ],
  },
]

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

export function ConversationsPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversations[0]?.id ?? '',
  )
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialConversations.map((conversation) => [
          conversation.id,
          conversation.sector,
        ]),
      ),
  )
  const [showHistory, setShowHistory] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')
  const [filters, setFilters] = useState({
    sector: 'Todos',
    status: 'Todos',
    tag: 'Todas',
    attendant: 'Todos',
  })

  const sectorFilterOptions = [
    'Todos',
    ...Array.from(new Set(conversations.map((item) => item.sector))),
  ]
  const statusFilterOptions: Array<ConversationStatus | 'Todos'> = [
    'Todos',
    'Aguardando',
    'Em atendimento',
    'Finalizada',
  ]
  const tagFilterOptions = [
    'Todas',
    ...Array.from(new Set(conversations.flatMap((item) => item.tags))),
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
    const matchesSector =
      filters.sector === 'Todos' || conversation.sector === filters.sector
    const matchesStatus =
      filters.status === 'Todos' || conversation.status === filters.status
    const matchesTag =
      filters.tag === 'Todas' || conversation.tags.includes(filters.tag)
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
  const selectedSector =
    (activeConversation ? transferTargets[activeConversation.id] : null) ??
    activeConversation?.sector ??
    sectorOptions[0]

  const updateConversation = (
    conversationId: string,
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation,
      ),
    )
  }

  const handleAssumeConversation = () => {
    if (!activeConversation || activeConversation.status === 'Finalizada') {
      return
    }

    const now = createTimeLabel()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      attendant: currentAgent.name,
      status: 'Em atendimento',
      waitingSince: 'Agora',
      history: [
        {
          id: createEntryId('hist'),
          title: 'Atendimento assumido',
          description: `${currentAgent.name} assumiu a conversa manualmente.`,
          time: now,
        },
        ...conversation.history,
      ],
    }))
  }

  const handleTransferSector = () => {
    if (!activeConversation || selectedSector === activeConversation.sector) {
      return
    }

    const now = createTimeLabel()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      sector: selectedSector,
      history: [
        {
          id: createEntryId('hist'),
          title: 'Transferencia de setor',
          description: `Conversa transferida para ${selectedSector}.`,
          time: now,
        },
        ...conversation.history,
      ],
    }))
  }

  const handleFinishConversation = () => {
    if (!activeConversation || activeConversation.status === 'Finalizada') {
      return
    }

    const now = createTimeLabel()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      status: 'Finalizada',
      unreadCount: 0,
      waitingSince: 'Encerrada',
      history: [
        {
          id: createEntryId('hist'),
          title: 'Conversa finalizada',
          description: `Encerramento realizado por ${currentAgent.name}.`,
          time: now,
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

    const now = createTimeLabel()

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      status: 'Em atendimento',
      attendant: conversation.attendant ?? currentAgent.name,
      waitingSince: 'Agora',
      lastMessage: message,
      lastMessageTime: now,
      unreadCount: 0,
      messages: [
        ...conversation.messages,
        {
          id: createEntryId('msg'),
          direction: 'outgoing',
          content: message,
          sender: currentAgent.name,
          time: now,
        },
      ],
      history: [
        {
          id: createEntryId('hist'),
          title: 'Mensagem enviada',
          description: `${currentAgent.name} respondeu a conversa.`,
          time: now,
        },
        ...conversation.history,
      ],
    }))

    setDraftMessage('')
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
              <p className="mt-2 text-base font-semibold">{currentAgent.name}</p>
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
              value={filters.tag}
              onChange={(event) =>
                setFilters((current) => ({ ...current, tag: event.target.value }))
              }
              className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
            >
              {tagFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
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
                setFilters((current) => ({ ...current, attendant: event.target.value }))
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
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#25d366,#0f766e)] text-sm font-semibold text-slate-950">
                WA
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversation?.id

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
                        {conversation.sector}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {conversation.attendant ?? 'Sem responsavel'}
                      </span>
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
                      {activeConversation.phone} · {activeConversation.company} ·{' '}
                      {activeConversation.channel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeConversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                        >
                          {tag}
                        </span>
                      ))}
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
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
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
                    {activeConversation.sector}
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
                    {activeConversation.waitingSince}
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
                    {sectorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
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
