import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TagBadge } from '../components/tags/TagBadge'
import { listWhatsappInstances } from '../lib/whatsapp'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import type {
  CampaignRecipientStatus,
  CampaignStatus,
  WorkspaceCampaign,
  WorkspaceContact,
} from '../types/workspace'
import type { WhatsappInstance } from '../types/whatsapp'

type CampaignFormState = {
  name: string
  whatsappInstanceId: string
  message: string
  scheduledAt: string
}

const statusMap: Record<
  CampaignStatus,
  {
    label: string
    badgeClassName: string
    panelClassName: string
  }
> = {
  Agendada: {
    label: 'Agendada',
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    panelClassName: 'from-sky-50 to-white',
  },
  'Em andamento': {
    label: 'Em andamento',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    panelClassName: 'from-emerald-50 to-white',
  },
  Pausada: {
    label: 'Pausada',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    panelClassName: 'from-amber-50 to-white',
  },
  Concluida: {
    label: 'Concluida',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    panelClassName: 'from-slate-50 to-white',
  },
}

const recipientStatusMap: Record<
  CampaignRecipientStatus,
  {
    label: string
    badgeClassName: string
  }
> = {
  Agendado: {
    label: 'Agendado',
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  Enviado: {
    label: 'Enviado',
    badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  Entregue: {
    label: 'Entregue',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  Falhou: {
    label: 'Falhou',
    badgeClassName: 'border-red-200 bg-red-50 text-red-700',
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

const createDateTimeInputValue = (value: Date) => {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const createInitialFormState = (): CampaignFormState => ({
  name: '',
  whatsappInstanceId: '',
  message: '',
  scheduledAt: createDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)),
})

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))

const getRecipientSummary = (campaign: WorkspaceCampaign) =>
  campaign.recipients.reduce(
    (accumulator, recipient) => {
      accumulator.total += 1

      if (recipient.status === 'Agendado') {
        accumulator.scheduled += 1
      }

      if (recipient.status === 'Enviado') {
        accumulator.sent += 1
      }

      if (recipient.status === 'Entregue') {
        accumulator.delivered += 1
      }

      if (recipient.status === 'Falhou') {
        accumulator.failed += 1
      }

      return accumulator
    },
    {
      total: 0,
      scheduled: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
    },
  )

const getCampaignProgress = (campaign: WorkspaceCampaign) => {
  const summary = getRecipientSummary(campaign)

  if (!summary.total) {
    return 0
  }

  return Math.round(
    ((summary.sent + summary.delivered + summary.failed) / summary.total) * 100,
  )
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function CampaignsPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const contacts = useWorkspaceStore((state) => state.contacts)
  const campaigns = useWorkspaceStore((state) => state.campaigns)
  const tags = useWorkspaceStore((state) => state.tags)
  const createCampaign = useWorkspaceStore((state) => state.createCampaign)
  const toggleCampaignStatus = useWorkspaceStore((state) => state.toggleCampaignStatus)
  const [instances, setInstances] = useState<WhatsappInstance[]>([])
  const [form, setForm] = useState<CampaignFormState>(createInitialFormState)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [activeCampaignId, setActiveCampaignId] = useState(campaigns[0]?.id ?? '')
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(Boolean(currentCompany?.id))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!currentCompany?.id) {
      return
    }

    let isMounted = true

    const loadInstances = async () => {
      setIsPageLoading(true)
      setPageError(null)

      try {
        const loadedInstances = await listWhatsappInstances()

        if (!isMounted) {
          return
        }

        setInstances(loadedInstances)
        setForm((currentForm) => ({
          ...currentForm,
          whatsappInstanceId: currentForm.whatsappInstanceId
            ? currentForm.whatsappInstanceId
            : String(loadedInstances[0]?.id ?? ''),
        }))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setInstances([])
        setPageError(getErrorMessage(error))
      } finally {
        if (isMounted) {
          setIsPageLoading(false)
        }
      }
    }

    void loadInstances()

    return () => {
      isMounted = false
    }
  }, [currentCompany?.id])

  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])

  const filteredContacts = useMemo(() => {
    const normalizedQuery = contactQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return contacts
    }

    return contacts.filter((contact) =>
      [
        contact.name,
        contact.company,
        contact.phone,
        contact.owner,
        contact.lifecycle,
        ...contact.tagIds
          .map((tagId) => tagMap.get(tagId)?.name)
          .filter((value): value is string => Boolean(value)),
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [contactQuery, contacts, tagMap])

  const selectedContacts = useMemo(
    () =>
      contacts.filter((contact) => selectedContactIds.includes(contact.id)),
    [contacts, selectedContactIds],
  )

  const activeCampaign =
    campaigns.find((campaign) => campaign.id === activeCampaignId) ?? campaigns[0] ?? null

  const activeCampaignRecipients = useMemo(() => {
    if (!activeCampaign) {
      return []
    }

    const contactMap = new Map(contacts.map((contact) => [contact.id, contact]))

    return activeCampaign.recipients
      .map((recipient) => ({
        recipient,
        contact: contactMap.get(recipient.contactId) ?? null,
      }))
      .filter(
        (
          item,
        ): item is {
          recipient: WorkspaceCampaign['recipients'][number]
          contact: WorkspaceContact
        } => item.contact !== null,
      )
  }, [activeCampaign, contacts])

  const overallSummary = useMemo(
    () =>
      campaigns.reduce(
        (accumulator, campaign) => {
          const campaignSummary = getRecipientSummary(campaign)

          accumulator.totalCampaigns += 1
          accumulator.totalRecipients += campaignSummary.total
          accumulator.delivered += campaignSummary.delivered
          accumulator.failed += campaignSummary.failed

          if (campaign.status === 'Pausada') {
            accumulator.paused += 1
          }

          return accumulator
        },
        {
          totalCampaigns: 0,
          totalRecipients: 0,
          delivered: 0,
          failed: 0,
          paused: 0,
        },
      ),
    [campaigns],
  )

  const handleFormChange =
    (field: keyof CampaignFormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }))
    }

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds((currentIds) =>
      currentIds.includes(contactId)
        ? currentIds.filter((currentId) => currentId !== contactId)
        : [...currentIds, contactId],
    )
  }

  const handleSelectVisibleContacts = () => {
    setSelectedContactIds((currentIds) =>
      Array.from(new Set([...currentIds, ...filteredContacts.map((contact) => contact.id)])),
    )
  }

  const handleClearContacts = () => {
    setSelectedContactIds([])
  }

  const handleCreateCampaign = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const selectedInstance = instances.find(
      (instance) => String(instance.id) === form.whatsappInstanceId,
    )

    if (!selectedInstance) {
      setFormError('Selecione uma instancia WhatsApp para criar a campanha.')
      return
    }

    if (!selectedContactIds.length) {
      setFormError('Adicione pelo menos um contato a campanha.')
      return
    }

    setIsSubmitting(true)

    try {
      const createdCampaignId = createCampaign({
        name: form.name,
        whatsappInstanceId: selectedInstance.id,
        whatsappInstanceName: selectedInstance.instance_name,
        message: form.message,
        contactIds: selectedContactIds,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      })

      setActiveCampaignId(createdCampaignId)
      setSelectedContactIds([])
      setContactQuery('')
      setForm({
        ...createInitialFormState(),
        whatsappInstanceId: String(selectedInstance.id),
      })
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#071d1a_0%,#0d3a31_48%,#25d366_180%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Campanhas
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight">
            Planeje disparos, escolha a instancia certa e acompanhe entrega por
            contato.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
            Monte campanhas com a base do workspace, agende envios e controle
            pausas sem sair da operacao principal de WhatsApp.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium">
              Empresa: {currentCompany?.name ?? 'Workspace ativo'}
            </div>
            <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium">
              Instancias disponiveis: {instances.length}
            </div>
            <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium">
              Base pronta: {contacts.length} contatos
            </div>
          </div>
        </article>

        <section className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Campanhas</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {overallSummary.totalCampaigns}
            </p>
            <p className="mt-3 text-sm text-emerald-700">
              {overallSummary.paused} pausadas para revisao operacional
            </p>
          </article>
          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Destinatarios</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {overallSummary.totalRecipients}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Contatos distribuidos entre campanhas salvas
            </p>
          </article>
          <article className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Entregues</p>
            <p className="mt-3 text-4xl font-semibold text-emerald-700">
              {overallSummary.delivered}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Envios com confirmacao de entrega
            </p>
          </article>
          <article className="rounded-[1.7rem] border border-red-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Falhas</p>
            <p className="mt-3 text-4xl font-semibold text-red-700">
              {overallSummary.failed}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Contatos que exigem novo disparo ou ajuste
            </p>
          </article>
        </section>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[0.98fr_0.92fr_1.1fr]">
        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Nova campanha
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                Criar disparo
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Escolha a instancia, escreva a mensagem e selecione os contatos do
                envio.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {selectedContactIds.length} contatos
            </div>
          </div>

          {pageError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {!isPageLoading && !instances.length ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
              Nenhuma instancia foi encontrada para esta empresa. Crie ou conecte
              uma instancia em{' '}
              <Link to="/whatsapp" className="font-semibold underline">
                WhatsApp
              </Link>{' '}
              antes de disparar campanhas.
            </div>
          ) : null}

          <form onSubmit={handleCreateCampaign} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nome da campanha
              </span>
              <input
                type="text"
                value={form.name}
                onChange={handleFormChange('name')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                placeholder="ex: Reativacao de leads do comercial"
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Instancia WhatsApp
              </span>
              <select
                value={form.whatsappInstanceId}
                onChange={handleFormChange('whatsappInstanceId')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                required
                disabled={isSubmitting || isPageLoading || !instances.length}
              >
                <option value="" disabled>
                  {isPageLoading ? 'Carregando instancias...' : 'Selecione uma instancia'}
                </option>
                {instances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.instance_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Mensagem
              </span>
              <textarea
                value={form.message}
                onChange={handleFormChange('message')}
                className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                placeholder="Escreva a mensagem que sera enviada para todos os contatos selecionados."
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Agendar envio
              </span>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={handleFormChange('scheduledAt')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                required
                disabled={isSubmitting}
              />
            </label>

            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Adicionar contatos
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Filtre por nome, empresa, telefone, owner ou tag.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectVisibleContacts}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  >
                    Selecionar visiveis
                  </button>
                  <button
                    type="button"
                    onClick={handleClearContacts}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-700"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={contactQuery}
                onChange={(event) => setContactQuery(event.target.value)}
                className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                placeholder="Buscar contato ou segmento"
              />

              <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactIds.includes(contact.id)

                  return (
                    <label
                      key={contact.id}
                      className={[
                        'block cursor-pointer rounded-[1.4rem] border px-4 py-4 transition',
                        isSelected
                          ? 'border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] shadow-[0_16px_34px_rgba(16,185,129,0.12)]'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleContact(contact.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950">
                                {contact.name}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {contact.company} | {contact.phone}
                              </p>
                            </div>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {contact.lifecycle}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            Owner: {contact.owner}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {contact.tagIds.length ? (
                              contact.tagIds.map((tagId) => {
                                const tag = tagMap.get(tagId)
                                return tag ? <TagBadge key={tag.id} tag={tag} /> : null
                              })
                            ) : (
                              <span className="text-xs text-slate-400">
                                Sem tags aplicadas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })}

                {!filteredContacts.length ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    Nenhum contato encontrado para o filtro atual.
                  </div>
                ) : null}
              </div>
            </div>

            {selectedContacts.length ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">
                  Selecionados agora
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleToggleContact(contact.id)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
                    >
                      {contact.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isPageLoading || !instances.length}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Criando campanha...' : 'Criar campanha'}
            </button>
          </form>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Lista de campanhas
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                Disparos salvos
              </h3>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {campaigns.length} itens
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {campaigns.map((campaign) => {
              const summary = getRecipientSummary(campaign)
              const status = statusMap[campaign.status]
              const isActive = campaign.id === activeCampaign?.id

              return (
                <article
                  key={campaign.id}
                  onClick={() => setActiveCampaignId(campaign.id)}
                  className={[
                    'cursor-pointer rounded-[1.5rem] border p-5 transition',
                    isActive
                      ? 'border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] shadow-[0_18px_40px_rgba(16,185,129,0.12)]'
                      : 'border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8faf9)] hover:border-slate-300',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {campaign.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {campaign.whatsappInstanceName}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${status.badgeClassName}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {campaign.message}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Agendamento
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {formatDateTime(campaign.scheduledAt)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Progresso
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {getCampaignProgress(campaign)}% processado
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {summary.total}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Entregue
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          {summary.delivered}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Enviado
                        </p>
                        <p className="mt-1 text-sm font-semibold text-violet-700">
                          {summary.sent}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          Falhou
                        </p>
                        <p className="mt-1 text-sm font-semibold text-red-700">
                          {summary.failed}
                        </p>
                      </div>
                    </div>

                    {campaign.status !== 'Concluida' ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleCampaignStatus(campaign.id)
                        }}
                        className={[
                          'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                          campaign.status === 'Pausada'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                            : 'border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
                        ].join(' ')}
                      >
                        {campaign.status === 'Pausada'
                          ? 'Continuar campanha'
                          : 'Pausar campanha'}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          {activeCampaign ? (
            <div className="space-y-5">
              <section
                className={`rounded-[1.7rem] border border-slate-200 bg-gradient-to-br ${statusMap[activeCampaign.status].panelClassName} p-5`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                      Status de envio
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {activeCampaign.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Instancia: {activeCampaign.whatsappInstanceName} | Agendada para{' '}
                      {formatDateTime(activeCampaign.scheduledAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusMap[activeCampaign.status].badgeClassName}`}
                  >
                    {statusMap[activeCampaign.status].label}
                  </span>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Mensagem
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {activeCampaign.message}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                    <span>Progresso operacional</span>
                    <span>{getCampaignProgress(activeCampaign)}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#16a34a,#22c55e)] transition-[width]"
                      style={{ width: `${getCampaignProgress(activeCampaign)}%` }}
                    />
                  </div>
                </div>

                {activeCampaign.status !== 'Concluida' ? (
                  <button
                    type="button"
                    onClick={() => toggleCampaignStatus(activeCampaign.id)}
                    className={[
                      'mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                      activeCampaign.status === 'Pausada'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                        : 'border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
                    ].join(' ')}
                  >
                    {activeCampaign.status === 'Pausada'
                      ? 'Continuar campanha'
                      : 'Pausar campanha'}
                  </button>
                ) : null}
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Agendados',
                    value: getRecipientSummary(activeCampaign).scheduled,
                    tone: 'text-sky-700',
                  },
                  {
                    label: 'Enviados',
                    value: getRecipientSummary(activeCampaign).sent,
                    tone: 'text-violet-700',
                  },
                  {
                    label: 'Entregues',
                    value: getRecipientSummary(activeCampaign).delivered,
                    tone: 'text-emerald-700',
                  },
                  {
                    label: 'Falhas',
                    value: getRecipientSummary(activeCampaign).failed,
                    tone: 'text-red-700',
                  },
                ].map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>
                      {item.value}
                    </p>
                  </article>
                ))}
              </section>

              <section className="rounded-[1.6rem] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Destinatarios e retorno do envio
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Acompanhe quem recebeu, quem ainda esta agendado e onde houve
                    falha.
                  </p>
                </div>

                <div className="max-h-[680px] space-y-3 overflow-y-auto p-4">
                  {activeCampaignRecipients.map(({ recipient, contact }) => {
                    const status = recipientStatusMap[recipient.status]

                    return (
                      <article
                        key={contact.id}
                        className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8faf9)] p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#05251f,#25d366)] text-sm font-semibold text-white">
                                {getInitials(contact.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {contact.name}
                                </p>
                                <p className="mt-1 truncate text-sm text-slate-500">
                                  {contact.company} | {contact.phone}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {contact.tagIds.length ? (
                                contact.tagIds.map((tagId) => {
                                  const tag = tagMap.get(tagId)
                                  return tag ? <TagBadge key={tag.id} tag={tag} /> : null
                                })
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Sem segmentacao adicional
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${status.badgeClassName}`}
                            >
                              {status.label}
                            </span>
                            <p className="text-sm text-slate-500">
                              Atualizado em {formatDateTime(recipient.lastUpdatedAt)}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="grid h-full min-h-[420px] place-items-center text-center">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  Nenhuma campanha disponivel
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Crie a primeira campanha ao lado para iniciar o agendamento de
                  disparos.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
