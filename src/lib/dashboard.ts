import type { AxiosResponse } from 'axios'
import { api } from './api'
import type { DashboardOverview } from '../types/dashboard'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

const unwrap = async <T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>) => {
  const response = await request
  return response.data.data
}

export const getDashboardOverview = () =>
  unwrap<DashboardOverview>(api.get('/dashboard/overview'))
