import type {
  ConversationHistoryItem,
  ConversationMessage,
  ConversationStatus,
  MessageDirection,
  WorkspaceConversation,
  WorkspaceRealtimeEvent,
} from '../types/workspace'

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getRecord = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      return value
    }
  }

  return null
}

const getArray = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

const getString = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

const getNumber = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

const getBoolean = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    if (typeof source[key] === 'boolean') {
      return source[key] as boolean
    }
  }

  return null
}

const getStringArray = (source: RecordValue, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (!Array.isArray(value)) {
      continue
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return null
}

const toEventName = (payload: RecordValue) =>
  (
    getString(payload, ['event', 'type', 'name', 'topic']) ?? ''
  ).toLowerCase()

const formatTimeLabel = (value?: string | null) => {
  if (!value) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

const normalizeDirection = (value: string | null, fromMe: boolean | null): MessageDirection => {
  const normalizedValue = value?.toLowerCase()

  if (normalizedValue === 'system' || normalizedValue === 'evento') {
    return 'system'
  }

  if (
    normalizedValue === 'outgoing' ||
    normalizedValue === 'sent' ||
    normalizedValue === 'saida' ||
    normalizedValue === 'outbound' ||
    fromMe
  ) {
    return 'outgoing'
  }

  return 'incoming'
}

const normalizeConversationStatus = (value: string | null): ConversationStatus => {
  const normalizedValue = value?.toLowerCase()

  if (
    normalizedValue === 'finalizada' ||
    normalizedValue === 'closed' ||
    normalizedValue === 'finished' ||
    normalizedValue === 'resolved'
  ) {
    return 'Finalizada'
  }

  if (
    normalizedValue === 'em atendimento' ||
    normalizedValue === 'open' ||
    normalizedValue === 'assigned' ||
    normalizedValue === 'in_progress' ||
    normalizedValue === 'em_andamento'
  ) {
    return 'Em atendimento'
  }

  return 'Aguardando'
}

const buildMessage = (source: RecordValue): ConversationMessage | null => {
  const content =
    getString(source, ['content', 'message', 'text', 'body']) ?? ''
  const sender =
    getString(source, ['sender', 'sender_name', 'from_name', 'author']) ??
    'Cliente'

  if (!content.trim()) {
    return null
  }

  const createdAt = getString(source, [
    'created_at',
    'createdAt',
    'timestamp',
    'sent_at',
    'sentAt',
  ])

  return {
    id:
      getString(source, ['id', 'message_id', 'messageId']) ??
      crypto.randomUUID(),
    direction: normalizeDirection(
      getString(source, ['direction', 'message_type', 'kind']),
      getBoolean(source, ['from_me', 'fromMe', 'is_outgoing', 'isOutgoing']),
    ),
    content,
    sender,
    time:
      getString(source, ['time']) ??
      formatTimeLabel(createdAt),
  }
}

const buildHistoryItems = (source: RecordValue): ConversationHistoryItem[] =>
  getArray(source, ['history', 'events']).flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const title = getString(item, ['title', 'name']) ?? 'Evento sincronizado'
    const description =
      getString(item, ['description', 'message', 'content']) ?? ''

    return [
      {
        id: getString(item, ['id']) ?? crypto.randomUUID(),
        title,
        description,
        time:
          getString(item, ['time']) ??
          formatTimeLabel(
            getString(item, ['created_at', 'createdAt', 'timestamp']),
          ),
      },
    ]
  })

const buildMessages = (source: RecordValue): ConversationMessage[] =>
  getArray(source, ['messages']).flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const message = buildMessage(item)

    return message ? [message] : []
  })

const hasConversationShape = (source: RecordValue) =>
  Boolean(
    getString(source, ['id', 'conversation_id', 'conversationId', 'chat_id']) &&
      (
        getString(source, ['contact_name', 'contactName', 'last_message', 'lastMessage']) ||
        getArray(source, ['messages']).length ||
        getString(source, ['status', 'conversation_status', 'conversationStatus'])
      ),
  )

const buildConversation = (payload: RecordValue): WorkspaceConversation | null => {
  const source = getRecord(payload, ['conversation', 'data']) ?? payload
  const contact = getRecord(source, ['contact', 'customer'])
  const messages = buildMessages(source)
  const lastMessageTimestamp =
    getString(source, ['last_message_at', 'lastMessageAt', 'updated_at', 'updatedAt']) ??
    getString(source, ['created_at', 'createdAt'])
  const fallbackLastMessage = messages.at(-1)?.content ?? ''
  const fallbackSender = contact
    ? getString(contact, ['name', 'full_name', 'fullName'])
    : null

  const id = getString(source, ['id', 'conversation_id', 'conversationId', 'chat_id'])

  if (!id) {
    return null
  }

  return {
    id,
    contactId:
      getString(source, ['contact_id', 'contactId']) ??
      (contact ? getString(contact, ['id']) : null) ??
      id,
    contactName:
      getString(source, ['contact_name', 'contactName']) ??
      (contact
        ? getString(contact, ['name', 'full_name', 'fullName'])
        : null) ??
      fallbackSender ??
      'Contato sem nome',
    phone:
      getString(source, ['phone', 'contact_phone', 'contactPhone']) ??
      (contact ? getString(contact, ['phone']) : null) ??
      '',
    company:
      getString(source, ['company', 'company_name', 'companyName']) ??
      (contact ? getString(contact, ['company', 'company_name']) : null) ??
      '',
    sectorId: getString(source, ['sector_id', 'sectorId']) ?? '',
    status: normalizeConversationStatus(
      getString(source, ['status', 'conversation_status', 'conversationStatus']),
    ),
    tagIds: getStringArray(source, ['tag_ids', 'tagIds']) ?? [],
    attendant:
      getString(source, ['attendant', 'attendant_name', 'attendantName']) ?? null,
    queuedAt:
      getString(source, ['queued_at', 'queuedAt', 'created_at', 'createdAt']) ??
      new Date().toISOString(),
    lastAssignedAt:
      getString(source, ['last_assigned_at', 'lastAssignedAt']) ?? null,
    closedAt: getString(source, ['closed_at', 'closedAt']) ?? null,
    lastMessage:
      getString(source, ['last_message', 'lastMessage']) ?? fallbackLastMessage,
    lastMessageTime:
      getString(source, ['last_message_time', 'lastMessageTime']) ??
      formatTimeLabel(lastMessageTimestamp),
    unreadCount:
      getNumber(source, ['unread_count', 'unreadCount']) ?? 0,
    summary: getString(source, ['summary']) ?? '',
    notes: getString(source, ['notes']) ?? '',
    channel:
      getString(source, ['channel', 'source']) ?? 'WhatsApp',
    messages,
    history: buildHistoryItems(source),
  }
}

const buildPatch = (payload: RecordValue, eventName: string) => {
  const source = getRecord(payload, ['conversation', 'data']) ?? payload
  const patch: Partial<WorkspaceConversation> = {}
  const status = getString(source, ['status', 'conversation_status', 'conversationStatus'])
  const attendant =
    getString(source, ['attendant', 'attendant_name', 'attendantName'])
  const sectorId = getString(source, ['sector_id', 'sectorId'])
  const unreadCount = getNumber(source, ['unread_count', 'unreadCount'])
  const summary = getString(source, ['summary'])
  const notes = getString(source, ['notes'])
  const tagIds = getStringArray(source, ['tag_ids', 'tagIds'])
  const lastMessage = getString(source, ['last_message', 'lastMessage'])
  const lastMessageTime = getString(source, ['last_message_time', 'lastMessageTime'])
  const channel = getString(source, ['channel', 'source'])
  const contactName = getString(source, ['contact_name', 'contactName'])
  const phone = getString(source, ['phone', 'contact_phone', 'contactPhone'])
  const company = getString(source, ['company', 'company_name', 'companyName'])
  const closedAt = getString(source, ['closed_at', 'closedAt'])
  const queuedAt = getString(source, ['queued_at', 'queuedAt'])
  const lastAssignedAt = getString(source, ['last_assigned_at', 'lastAssignedAt'])

  if (status) {
    patch.status = normalizeConversationStatus(status)
  } else if (eventName.includes('close') || eventName.includes('finish')) {
    patch.status = 'Finalizada'
  } else if (eventName.includes('assign')) {
    patch.status = 'Em atendimento'
  } else if (eventName.includes('transfer')) {
    patch.status = 'Aguardando'
  }

  if (attendant !== null) {
    patch.attendant = attendant
  } else if (eventName.includes('transfer')) {
    patch.attendant = null
  }

  if (sectorId) {
    patch.sectorId = sectorId
  }

  if (typeof unreadCount === 'number') {
    patch.unreadCount = unreadCount
  }

  if (summary) {
    patch.summary = summary
  }

  if (notes) {
    patch.notes = notes
  }

  if (tagIds) {
    patch.tagIds = tagIds
  }

  if (lastMessage) {
    patch.lastMessage = lastMessage
  }

  if (lastMessageTime) {
    patch.lastMessageTime = lastMessageTime
  }

  if (channel) {
    patch.channel = channel
  }

  if (contactName) {
    patch.contactName = contactName
  }

  if (phone) {
    patch.phone = phone
  }

  if (company) {
    patch.company = company
  }

  if (closedAt) {
    patch.closedAt = closedAt
  } else if (eventName.includes('close') || eventName.includes('finish')) {
    patch.closedAt = new Date().toISOString()
    patch.unreadCount = 0
  }

  if (queuedAt) {
    patch.queuedAt = queuedAt
  }

  if (lastAssignedAt) {
    patch.lastAssignedAt = lastAssignedAt
  } else if (eventName.includes('assign')) {
    patch.lastAssignedAt = new Date().toISOString()
  }

  return patch
}

const buildMessageEvent = (
  payload: RecordValue,
  eventName: string,
): WorkspaceRealtimeEvent | null => {
  const source =
    getRecord(payload, ['message']) ??
    getRecord(payload, ['data']) ??
    payload
  const conversation =
    getRecord(payload, ['conversation']) ??
    getRecord(source, ['conversation'])
  const conversationId =
    getString(payload, ['conversation_id', 'conversationId', 'chat_id']) ??
    (conversation
      ? getString(conversation, ['id', 'conversation_id', 'conversationId'])
      : null) ??
    getString(source, ['conversation_id', 'conversationId', 'chat_id'])

  if (!conversationId) {
    return null
  }

  const message = buildMessage(source)

  if (!message) {
    return null
  }

  return {
    type: 'conversation.message',
    conversationId,
    message,
    patch: buildPatch(payload, eventName),
  }
}

export const buildRealtimeUrl = ({
  token,
  companyId,
}: {
  token: string
  companyId: string
}) => {
  const explicitUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()

  if (explicitUrl) {
    const resolvedExplicitUrl = explicitUrl
      .replaceAll('{token}', encodeURIComponent(token))
      .replaceAll('{companyId}', encodeURIComponent(companyId))

    if (
      resolvedExplicitUrl.includes('{token}') ||
      resolvedExplicitUrl.includes('{companyId}')
    ) {
      return null
    }

    const parsedUrl = new URL(resolvedExplicitUrl)

    if (!explicitUrl.includes('{token}')) {
      parsedUrl.searchParams.set('token', token)
    }

    if (!explicitUrl.includes('{companyId}')) {
      parsedUrl.searchParams.set('company_id', companyId)
      parsedUrl.searchParams.set('companyId', companyId)
    }

    return parsedUrl.toString()
  }

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

  if (!apiUrl) {
    return null
  }

  const parsedApiUrl = new URL(apiUrl)
  const normalizedPath = parsedApiUrl.pathname.replace(/\/+$/, '')
  const basePath = normalizedPath.replace(/\/api(?:\/v\d+)?$/i, '')

  parsedApiUrl.protocol = parsedApiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  parsedApiUrl.pathname = `${basePath || ''}/ws`
  parsedApiUrl.search = ''
  parsedApiUrl.searchParams.set('token', token)
  parsedApiUrl.searchParams.set('company_id', companyId)
  parsedApiUrl.searchParams.set('companyId', companyId)

  return parsedApiUrl.toString()
}

export const parseRealtimeEvents = (raw: string): WorkspaceRealtimeEvent[] => {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  const items = Array.isArray(parsed) ? parsed : [parsed]

  return items.flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const eventName = toEventName(item)
    const basePayload = getRecord(item, ['data']) ?? item
    const conversationPayload = getRecord(basePayload, ['conversation'])
    const rootConversation =
      conversationPayload && hasConversationShape(conversationPayload)
        ? buildConversation({ conversation: conversationPayload })
        : hasConversationShape(basePayload)
          ? buildConversation(basePayload)
          : null

    if (
      eventName.includes('delete') ||
      eventName.includes('remove') ||
      eventName.includes('archive')
    ) {
      const conversationId =
        getString(basePayload, ['conversation_id', 'conversationId', 'chat_id']) ??
        (conversationPayload
          ? getString(conversationPayload, ['id', 'conversation_id', 'conversationId'])
          : null)

      return conversationId
        ? [
            {
              type: 'conversation.remove' as const,
              conversationId,
            },
          ]
        : []
    }

    if (
      eventName.includes('message') ||
      getRecord(basePayload, ['message']) ||
      getString(basePayload, ['message', 'body', 'content'])
    ) {
      const messageEvent = buildMessageEvent(basePayload, eventName)

      if (messageEvent) {
        return [messageEvent]
      }
    }

    if (rootConversation) {
      return [
        {
          type: 'conversation.upsert' as const,
          conversation: rootConversation,
        },
      ]
    }

    const conversationId =
      getString(basePayload, ['conversation_id', 'conversationId', 'chat_id']) ??
      (conversationPayload
        ? getString(conversationPayload, ['id', 'conversation_id', 'conversationId'])
        : null)

    if (!conversationId) {
      return []
    }

    const patch = buildPatch(basePayload, eventName)

    return Object.keys(patch).length
      ? [
          {
            type: 'conversation.patch' as const,
            conversationId,
            patch,
          },
        ]
      : []
  })
}
