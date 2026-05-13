import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  connectWhatsappInstance,
  createWhatsappInstance,
  disconnectWhatsappInstance,
  listSectors,
  listWhatsappInstances,
  removeWhatsappInstance,
} from '../lib/whatsapp'
import type {
  Sector,
  WhatsappInstance,
  WhatsappInstanceStatus,
  WhatsappQrCodePayload,
} from '../types/whatsapp'

type FormState = {
  sectorId: string
  instanceName: string
  phoneNumber: string
}

type QrModalState = {
  instance: WhatsappInstance
  payload: WhatsappQrCodePayload
} | null

const initialFormState: FormState = {
  sectorId: '',
  instanceName: '',
  phoneNumber: '',
}

const statusMap: Record<
  string,
  {
    label: string
    badgeClassName: string
    dotClassName: string
  }
> = {
  connected: {
    label: 'Conectado',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  connecting: {
    label: 'Conectando',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
  },
  disconnected: {
    label: 'Desconectado',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    dotClassName: 'bg-slate-400',
  },
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | {
          message?: string
          errors?: Record<string, string[]>
        }
      | undefined

    const firstValidationMessage = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null

    return firstValidationMessage ?? data?.message ?? 'Falha ao comunicar com a API.'
  }

  return error instanceof Error ? error.message : 'Falha ao comunicar com a API.'
}

const sortInstances = (instances: WhatsappInstance[]) =>
  [...instances].sort((left, right) =>
    left.instance_name.localeCompare(right.instance_name, 'pt-BR'),
  )

const formatStatus = (status: WhatsappInstanceStatus) => {
  const normalizedStatus = statusMap[status]

  if (normalizedStatus) {
    return normalizedStatus
  }

  return {
    label: status,
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    dotClassName: 'bg-slate-400',
  }
}

const formatPhoneNumber = (value: string | null) => {
  if (!value) {
    return 'Nao informado'
  }

  return value.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Sem conexao registrada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem conexao registrada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const resolveQrImage = (code?: string | null) => {
  if (!code) {
    return null
  }

  return code.startsWith('data:') ? code : `data:image/png;base64,${code}`
}

export function WhatsAppPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const [instances, setInstances] = useState<WhatsappInstance[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [form, setForm] = useState<FormState>(initialFormState)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [qrModal, setQrModal] = useState<QrModalState>(null)
  const selectedSectorId = form.sectorId || (sectors[0] ? String(sectors[0].id) : '')

  useEffect(() => {
    if (!currentCompany?.id) {
      return
    }

    let isMounted = true

    const loadPageData = async () => {
      setIsPageLoading(true)
      setPageError(null)

      try {
        const [loadedInstances, loadedSectors] = await Promise.all([
          listWhatsappInstances(),
          listSectors(),
        ])

        if (!isMounted) {
          return
        }

        setInstances(sortInstances(loadedInstances))
        setSectors(loadedSectors)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setPageError(getErrorMessage(error))
      } finally {
        if (isMounted) {
          setIsPageLoading(false)
        }
      }
    }

    void loadPageData()

    return () => {
      isMounted = false
    }
  }, [currentCompany?.id])

  const summary = useMemo(
    () => ({
      total: instances.length,
      connected: instances.filter((item) => item.status === 'connected').length,
      connecting: instances.filter((item) => item.status === 'connecting').length,
      disconnected: instances.filter((item) => item.status === 'disconnected').length,
    }),
    [instances],
  )

  const refreshInstances = async () => {
    setPageError(null)

    try {
      const loadedInstances = await listWhatsappInstances()
      setInstances(sortInstances(loadedInstances))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const upsertInstance = (nextInstance: WhatsappInstance) => {
    setInstances((currentInstances) => {
      const filteredInstances = currentInstances.filter(
        (item) => item.id !== nextInstance.id,
      )

      return sortInstances([...filteredInstances, nextInstance])
    })
  }

  const handleFormChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }))
    }

  const handleCreateInstance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const createdInstance = await createWhatsappInstance({
        sector_id: Number(selectedSectorId),
        instance_name: form.instanceName.trim(),
        phone_number: form.phoneNumber.trim() || undefined,
      })

      upsertInstance(createdInstance)
      setForm({
        sectorId: selectedSectorId,
        instanceName: '',
        phoneNumber: '',
      })
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConnect = async (instance: WhatsappInstance) => {
    const actionKey = `connect:${instance.id}`
    setActiveActionKey(actionKey)
    setPageError(null)

    try {
      const payload = await connectWhatsappInstance(instance.id)
      upsertInstance(payload.instance)
      setQrModal({
        instance: payload.instance,
        payload,
      })
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleDisconnect = async (instance: WhatsappInstance) => {
    const actionKey = `disconnect:${instance.id}`
    setActiveActionKey(actionKey)
    setPageError(null)

    try {
      const updatedInstance = await disconnectWhatsappInstance(instance.id)
      upsertInstance(updatedInstance)
      setQrModal((currentModal) =>
        currentModal?.instance.id === instance.id ? null : currentModal,
      )
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleRemove = async (instance: WhatsappInstance) => {
    const confirmed = window.confirm(
      `Remover a instancia "${instance.instance_name}"? Essa acao nao pode ser desfeita.`,
    )

    if (!confirmed) {
      return
    }

    const actionKey = `remove:${instance.id}`
    setActiveActionKey(actionKey)
    setPageError(null)

    try {
      await removeWhatsappInstance(instance.id)
      setInstances((currentInstances) =>
        currentInstances.filter((item) => item.id !== instance.id),
      )
      setQrModal((currentModal) =>
        currentModal?.instance.id === instance.id ? null : currentModal,
      )
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setActiveActionKey(null)
    }
  }

  const qrImage = resolveQrImage(qrModal?.payload.qrcode.code)

  if (!currentCompany?.id) {
    return (
      <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        Selecione uma empresa antes de gerenciar instancias do WhatsApp.
      </section>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#05251f_0%,#0b4336_58%,#4ade80_180%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
              WhatsApp
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight">
              Gerencie instancias, conexoes e setores do canal ativo.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
              A tela consome os endpoints reais de setores e instancias WhatsApp,
              envia o contexto da empresa atual e centraliza conexao via QR Code.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
                Empresa: {currentCompany.name}
              </div>
              <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
                Setores disponiveis: {sectors.length}
              </div>
            </div>
          </article>

          <article className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Resumo operacional
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Visao rapida das instancias vinculadas a esta empresa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refreshInstances()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                Atualizar
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Total', value: summary.total, tone: 'text-slate-950' },
                {
                  label: 'Conectadas',
                  value: summary.connected,
                  tone: 'text-emerald-700',
                },
                {
                  label: 'Conectando',
                  value: summary.connecting,
                  tone: 'text-amber-700',
                },
                {
                  label: 'Desconectadas',
                  value: summary.disconnected,
                  tone: 'text-slate-600',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Nova instancia
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">
              Criar canal WhatsApp
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Informe o nome da instancia, escolha o setor e opcionalmente
              defina o numero que sera pareado.
            </p>

            <form onSubmit={handleCreateInstance} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Setor
                </span>
                <select
                  value={selectedSectorId}
                  onChange={handleFormChange('sectorId')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                  required
                  disabled={sectors.length === 0 || isSubmitting}
                >
                  <option value="" disabled>
                    Selecione um setor
                  </option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Nome da instancia
                </span>
                <input
                  type="text"
                  value={form.instanceName}
                  onChange={handleFormChange('instanceName')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                  placeholder="ex: suporte_principal"
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Numero do WhatsApp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phoneNumber}
                  onChange={handleFormChange('phoneNumber')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                  placeholder="5511999999999"
                  disabled={isSubmitting}
                />
              </label>

              {formError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || sectors.length === 0}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Criando instancia...' : 'Criar nova instancia'}
              </button>
            </form>
          </article>

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Instancias
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                  Lista atual
                </h3>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {instances.length} itens
              </div>
            </div>

            {pageError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}

            {isPageLoading ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Carregando instancias e setores...
              </div>
            ) : null}

            {!isPageLoading && instances.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  Nenhuma instancia cadastrada
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Crie a primeira instancia ao lado para iniciar o pareamento do
                  numero via QR Code.
                </p>
              </div>
            ) : null}

            {!isPageLoading && instances.length > 0 ? (
              <div className="mt-6 space-y-4">
                {instances.map((instance) => {
                  const status = formatStatus(instance.status)

                  return (
                    <div
                      key={instance.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbf9)] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-lg font-semibold text-slate-950">
                              {instance.instance_name}
                            </p>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${status.badgeClassName}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${status.dotClassName}`}
                              />
                              {status.label}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                            <div className="rounded-[1.15rem] bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Setor
                              </p>
                              <p className="mt-2 font-medium text-slate-900">
                                {instance.sector?.name ?? `ID ${instance.sector_id}`}
                              </p>
                            </div>
                            <div className="rounded-[1.15rem] bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Numero
                              </p>
                              <p className="mt-2 font-medium text-slate-900">
                                {formatPhoneNumber(instance.phone_number)}
                              </p>
                            </div>
                            <div className="rounded-[1.15rem] bg-slate-50 px-4 py-3 sm:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Ultima conexao
                              </p>
                              <p className="mt-2 font-medium text-slate-900">
                                {formatDateTime(instance.last_connection_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:max-w-[290px] lg:justify-end">
                          <button
                            type="button"
                            onClick={() => void handleConnect(instance)}
                            disabled={activeActionKey !== null}
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {activeActionKey === `connect:${instance.id}`
                              ? 'Conectando...'
                              : 'Conectar'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDisconnect(instance)}
                            disabled={activeActionKey !== null}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {activeActionKey === `disconnect:${instance.id}`
                              ? 'Desconectando...'
                              : 'Desconectar'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleRemove(instance)}
                            disabled={activeActionKey !== null}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {activeActionKey === `remove:${instance.id}`
                              ? 'Removendo...'
                              : 'Remover'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </article>
        </section>
      </div>

      {qrModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  QR Code
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {qrModal.instance.instance_name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Escaneie o QR Code no WhatsApp para concluir a conexao da
                  instancia.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setQrModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f4f7f6)] p-6">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt={`QR Code da instancia ${qrModal.instance.instance_name}`}
                  className="mx-auto h-72 w-72 rounded-2xl border border-slate-200 bg-white object-contain p-3"
                />
              ) : (
                <div className="grid h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  A API nao retornou a imagem do QR Code.
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Status atual
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatStatus(qrModal.instance.status).label}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Pairing code
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-950">
                    {qrModal.payload.qrcode.pairingCode ?? 'Nao informado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
