export type WorkspaceTag = {
  id: string
  name: string
  color: string
  description: string
  createdAt: string
}

export type AttendantStatus = 'Online' | 'Pausa' | 'Offline'

export type WorkspaceAttendant = {
  id: string
  name: string
  role: string
  email: string
  status: AttendantStatus
}

export type WorkspaceSector = {
  id: string
  name: string
  color: string
  description: string
  slaMinutes: number
  attendantIds: string[]
  createdAt: string
}

export type ContactLifecycle = 'Lead' | 'Cliente' | 'Parceiro'

export type WorkspaceContact = {
  id: string
  name: string
  phone: string
  company: string
  lifecycle: ContactLifecycle
  owner: string
  city: string
  lastInteraction: string
  notes: string
  tagIds: string[]
}

export type WorkspacePipeline = {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
}

export type WorkspacePipelineStage = {
  id: string
  pipelineId: string
  name: string
  color: string
  order: number
}

export type WorkspaceDeal = {
  id: string
  pipelineId: string
  stageId: string
  name: string
  contactId: string | null
  ownerId: string | null
  value: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type CampaignStatus = 'Agendada' | 'Em andamento' | 'Pausada' | 'Concluida'

export type CampaignRecipientStatus =
  | 'Agendado'
  | 'Enviado'
  | 'Entregue'
  | 'Falhou'

export type WorkspaceCampaignRecipient = {
  contactId: string
  status: CampaignRecipientStatus
  lastUpdatedAt: string
}

export type WorkspaceCampaign = {
  id: string
  name: string
  whatsappInstanceId: number
  whatsappInstanceName: string
  message: string
  scheduledAt: string
  status: CampaignStatus
  recipients: WorkspaceCampaignRecipient[]
  createdAt: string
  updatedAt: string
}

export type ConversationStatus = 'Aguardando' | 'Em atendimento' | 'Finalizada'

export type MessageDirection = 'incoming' | 'outgoing' | 'system'

export type ConversationMessage = {
  id: string
  direction: MessageDirection
  content: string
  sender: string
  time: string
}

export type ConversationHistoryItem = {
  id: string
  title: string
  description: string
  time: string
}

export type RealtimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type WorkspaceConversation = {
  id: string
  contactId: string
  contactName: string
  phone: string
  company: string
  sectorId: string
  status: ConversationStatus
  tagIds: string[]
  attendant: string | null
  queuedAt: string
  lastAssignedAt: string | null
  closedAt: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  summary: string
  notes: string
  channel: string
  messages: ConversationMessage[]
  history: ConversationHistoryItem[]
}

export type WorkspaceRealtimeState = {
  status: RealtimeConnectionStatus
  lastEventAt: string | null
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
  lastError: string | null
  retryCount: number
}

export type WorkspaceRealtimeEvent =
  | {
      type: 'conversation.upsert'
      conversation: WorkspaceConversation
    }
  | {
      type: 'conversation.patch'
      conversationId: string
      patch: Partial<WorkspaceConversation>
    }
  | {
      type: 'conversation.message'
      conversationId: string
      message: ConversationMessage
      patch?: Partial<WorkspaceConversation>
    }
  | {
      type: 'conversation.remove'
      conversationId: string
    }
