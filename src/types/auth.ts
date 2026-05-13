export type AuthUser = {
  id?: number | string
  name: string
  email: string
  [key: string]: unknown
}

export type LoginCredentials = {
  email: string
  password: string
}
