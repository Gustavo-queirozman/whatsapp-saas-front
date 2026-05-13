import type { AuthCompany, AuthUser } from '../types/auth'

type UnknownRecord = Record<string, unknown>

const USER_KEYS = ['user', 'usuario'] as const
const TOKEN_KEYS = ['access_token', 'token', 'accessToken'] as const
const COMPANY_COLLECTION_KEYS = [
  'companies',
  'empresas',
  'tenants',
  'organizations',
  'businesses',
] as const
const CURRENT_COMPANY_KEYS = [
  'currentCompany',
  'current_company',
  'empresaAtual',
  'empresa_atual',
  'company',
  'empresa',
  'tenant',
  'organization',
  'business',
] as const
const COMPANY_ID_KEYS = ['id', 'company_id', 'empresa_id', 'tenant_id'] as const
const COMPANY_NAME_KEYS = [
  'name',
  'nome',
  'fantasy_name',
  'razao_social',
  'display_name',
  'title',
] as const

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const getObjectValue = <Key extends string>(
  value: UnknownRecord,
  keys: readonly Key[],
) => {
  for (const key of keys) {
    const candidate = value[key]

    if (candidate !== undefined && candidate !== null) {
      return candidate
    }
  }

  return undefined
}

const getStringValue = <Key extends string>(
  value: UnknownRecord,
  keys: readonly Key[],
) => {
  const candidate = getObjectValue(value, keys)
  return typeof candidate === 'string' ? candidate : undefined
}

const toAuthUser = (value: unknown): AuthUser | null => {
  if (!isRecord(value)) {
    return null
  }

  const email = getStringValue(value, ['email'])
  const name = getStringValue(value, ['name', 'nome']) ?? email?.split('@')[0]

  if (!name && !email) {
    return null
  }

  return {
    ...value,
    name: name ?? 'Usuario',
    email: email ?? '',
  }
}

const toAuthCompany = (value: unknown): AuthCompany | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = getObjectValue(value, COMPANY_ID_KEYS)
  const name = getStringValue(value, COMPANY_NAME_KEYS)

  if (id === undefined && !name) {
    return null
  }

  const normalizedId =
    typeof id === 'string' || typeof id === 'number' ? id : (name ?? 'empresa')

  return {
    ...value,
    id: normalizedId,
    name: name ?? `Empresa ${String(normalizedId)}`,
  }
}

const getResponseObjects = (payload: unknown) => {
  if (!isRecord(payload)) {
    return []
  }

  const data = isRecord(payload.data) ? payload.data : null
  const user =
    USER_KEYS.map((key) => payload[key]).find((candidate) => isRecord(candidate)) ??
    null
  const dataUser =
    data &&
    USER_KEYS.map((key) => data[key]).find((candidate) => isRecord(candidate))

  return [payload, data, user, dataUser].filter((value): value is UnknownRecord =>
    isRecord(value),
  )
}

const dedupeCompanies = (companies: AuthCompany[]) => {
  const seen = new Set<string>()

  return companies.filter((company) => {
    const key = String(company.id)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const resolveToken = (payload: unknown) => {
  for (const object of getResponseObjects(payload)) {
    const candidate = getStringValue(object, TOKEN_KEYS)

    if (candidate) {
      return candidate
    }
  }

  return null
}

export const resolveUser = (payload: unknown) => {
  for (const object of getResponseObjects(payload)) {
    const explicitUser = USER_KEYS.map((key) => toAuthUser(object[key])).find(
      (candidate) => Boolean(candidate),
    )

    if (explicitUser) {
      return explicitUser
    }

    const directUser = toAuthUser(object)

    if (directUser) {
      return directUser
    }
  }

  return null
}

export const resolveCompanies = (payload: unknown) => {
  for (const object of getResponseObjects(payload)) {
    for (const key of COMPANY_COLLECTION_KEYS) {
      const candidate = object[key]

      if (!Array.isArray(candidate)) {
        continue
      }

      const companies = dedupeCompanies(
        candidate
          .map((item) => toAuthCompany(item))
          .filter((item): item is AuthCompany => Boolean(item)),
      )

      if (companies.length > 0) {
        return companies
      }
    }
  }

  const currentCompany = resolveCurrentCompany(payload)
  return currentCompany ? [currentCompany] : []
}

export const resolveCurrentCompany = (payload: unknown) => {
  for (const object of getResponseObjects(payload)) {
    for (const key of CURRENT_COMPANY_KEYS) {
      const candidate = toAuthCompany(object[key])

      if (candidate) {
        return candidate
      }
    }
  }

  return null
}

const matchCompany = (
  companies: AuthCompany[],
  company: AuthCompany | null | undefined,
) => {
  if (!company) {
    return null
  }

  const id = String(company.id)
  return companies.find((item) => String(item.id) === id) ?? null
}

export const reconcileCurrentCompany = ({
  companies,
  currentCompany,
  persistedCurrentCompany,
}: {
  companies: AuthCompany[]
  currentCompany: AuthCompany | null
  persistedCurrentCompany?: AuthCompany | null
}) => {
  const explicitCompany = matchCompany(companies, currentCompany)

  if (explicitCompany) {
    return explicitCompany
  }

  const persistedCompany = matchCompany(companies, persistedCurrentCompany)

  if (persistedCompany) {
    return persistedCompany
  }

  if (companies.length === 1) {
    return companies[0]
  }

  return null
}

export const requiresCompanySelection = ({
  currentCompany,
  companies,
}: {
  currentCompany: AuthCompany | null
  companies: AuthCompany[]
}) => companies.length > 1 && !currentCompany
