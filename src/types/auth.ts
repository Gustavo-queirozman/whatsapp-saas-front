export type AuthCompany = {
  id: number | string
  name: string
  [key: string]: unknown
}

export type AuthUser = {
  id?: number | string
  name: string
  email: string
  companies?: AuthCompany[]
  [key: string]: unknown
}

export type LoginCredentials = {
  email: string
  password: string
}
