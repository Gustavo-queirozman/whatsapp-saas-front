export type WorkspaceTag = {
  id: string
  name: string
  color: string
  description: string
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

export type WorkspaceConversation = {
  id: string
  contactId: string
  contactName: string
  phone: string
  company: string
  sector: string
  status: ConversationStatus
  tagIds: string[]
  attendant: string | null
  waitingSince: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  summary: string
  notes: string
  channel: string
  messages: ConversationMessage[]
  history: ConversationHistoryItem[]
}
