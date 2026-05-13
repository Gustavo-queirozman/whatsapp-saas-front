export type Sector = {
  id: number
  company_id?: number
  name: string
  slug: string
  color?: string | null
  users_count?: number | null
}

export type WhatsappInstanceStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | (string & {})

export type WhatsappInstance = {
  id: number
  company_id: number
  sector_id: number
  instance_name: string
  phone_number: string | null
  status: WhatsappInstanceStatus
  last_connection_at: string | null
  metadata: Record<string, unknown>
  sector?: Sector
  created_at?: string | null
  updated_at?: string | null
}

export type CreateWhatsappInstanceInput = {
  sector_id: number
  instance_name: string
  phone_number?: string
}

export type WhatsappQrCodePayload = {
  instance: WhatsappInstance
  qrcode: {
    code?: string | null
    pairingCode?: string | null
    [key: string]: unknown
  }
  status?: Record<string, unknown>
}
