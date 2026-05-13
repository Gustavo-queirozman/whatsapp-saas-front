import type { AxiosResponse } from 'axios'
import { api } from './api'
import type {
  CreateWhatsappInstanceInput,
  Sector,
  WhatsappInstance,
  WhatsappQrCodePayload,
} from '../types/whatsapp'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

const unwrap = async <T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>) => {
  const response = await request
  return response.data.data
}

export const listSectors = () => unwrap<Sector[]>(api.get('/sectors'))

export const listWhatsappInstances = () =>
  unwrap<WhatsappInstance[]>(api.get('/whatsapp-instances'))

export const createWhatsappInstance = (payload: CreateWhatsappInstanceInput) =>
  unwrap<WhatsappInstance>(api.post('/whatsapp-instances', payload))

export const connectWhatsappInstance = (instanceId: number) =>
  unwrap<WhatsappQrCodePayload>(api.get(`/whatsapp-instances/${instanceId}/qrcode`))

export const disconnectWhatsappInstance = (instanceId: number) =>
  unwrap<WhatsappInstance>(
    api.post(`/whatsapp-instances/${instanceId}/disconnect`),
  )

export const removeWhatsappInstance = (instanceId: number) =>
  unwrap<{ message: string }>(api.delete(`/whatsapp-instances/${instanceId}`))
