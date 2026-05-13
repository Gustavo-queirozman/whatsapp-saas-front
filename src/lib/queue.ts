import type { WorkspaceConversation } from '../types/workspace'

const MINUTE_IN_MS = 60_000
const HOUR_IN_MS = 60 * MINUTE_IN_MS
const DAY_IN_MS = 24 * HOUR_IN_MS

export const formatElapsedTime = (startedAt: string, referenceTime = Date.now()) => {
  const elapsed = Math.max(0, referenceTime - new Date(startedAt).getTime())

  if (elapsed < MINUTE_IN_MS) {
    return 'Agora'
  }

  if (elapsed < HOUR_IN_MS) {
    return `${Math.floor(elapsed / MINUTE_IN_MS)} min`
  }

  if (elapsed < DAY_IN_MS) {
    const hours = Math.floor(elapsed / HOUR_IN_MS)
    const minutes = Math.floor((elapsed % HOUR_IN_MS) / MINUTE_IN_MS)

    return minutes ? `${hours}h ${minutes}min` : `${hours}h`
  }

  const days = Math.floor(elapsed / DAY_IN_MS)
  const hours = Math.floor((elapsed % DAY_IN_MS) / HOUR_IN_MS)

  return hours ? `${days}d ${hours}h` : `${days}d`
}

export const getConversationWaitingLabel = (
  conversation: WorkspaceConversation,
  referenceTime = Date.now(),
) => {
  if (conversation.status === 'Finalizada') {
    return 'Encerrada'
  }

  if (conversation.status === 'Aguardando') {
    return formatElapsedTime(conversation.queuedAt, referenceTime)
  }

  if (conversation.lastAssignedAt) {
    return `Assumida ha ${formatElapsedTime(conversation.lastAssignedAt, referenceTime)}`
  }

  return 'Agora'
}

export const getConversationWaitInMinutes = (
  conversation: WorkspaceConversation,
  referenceTime = Date.now(),
) =>
  Math.max(
    0,
    Math.floor((referenceTime - new Date(conversation.queuedAt).getTime()) / MINUTE_IN_MS),
  )
