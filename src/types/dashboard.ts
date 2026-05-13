export type DashboardAverageFirstResponseTime = {
  seconds: number | null
  formatted: string | null
  conversations_count: number
}

export type DashboardSectorOverview = {
  sector_id: number
  sector_name: string
  sector_slug: string
  total_conversations: number
  open_conversations: number
  waiting_conversations: number
  closed_conversations: number
}

export type DashboardAttendantOverview = {
  user_id: number
  user_name: string
  total_conversations: number
  open_conversations: number
  waiting_conversations: number
  closed_conversations: number
}

export type DashboardOverview = {
  conversations_today: number
  messages_today: number
  open_conversations: number
  waiting_conversations: number
  closed_conversations: number
  connected_numbers: number
  average_first_response_time: DashboardAverageFirstResponseTime
  conversations_by_sector: DashboardSectorOverview[]
  conversations_by_attendant: DashboardAttendantOverview[]
}
