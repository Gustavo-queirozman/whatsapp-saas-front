import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

type DealFormState = {
  name: string
  stageId: string
  contactId: string
  ownerId: string
  value: string
  notes: string
}

type DealEditorState = {
  stageId: string
  contactId: string
  ownerId: string
  value: string
  notes: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const createEmptyDealEditor = (): DealEditorState => ({
  stageId: '',
  contactId: '',
  ownerId: '',
  value: '',
  notes: '',
})

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const parseCurrencyInput = (value: string) => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : NaN
}

export function CrmPage() {
  const pipelines = useWorkspaceStore((state) => state.pipelines)
  const pipelineStages = useWorkspaceStore((state) => state.pipelineStages)
  const deals = useWorkspaceStore((state) => state.deals)
  const contacts = useWorkspaceStore((state) => state.contacts)
  const attendants = useWorkspaceStore((state) => state.attendants)
  const createDeal = useWorkspaceStore((state) => state.createDeal)
  const moveDealToStage = useWorkspaceStore((state) => state.moveDealToStage)
  const updateDeal = useWorkspaceStore((state) => state.updateDeal)
  const [activePipelineId, setActivePipelineId] = useState(pipelines[0]?.id ?? '')
  const [activeDealId, setActiveDealId] = useState('')
  const [createFormError, setCreateFormError] = useState('')
  const [editorError, setEditorError] = useState('')

  const activePipeline =
    pipelines.find((pipeline) => pipeline.id === activePipelineId) ?? pipelines[0] ?? null

  const stages = useMemo(
    () =>
      pipelineStages
        .filter((stage) => stage.pipelineId === activePipeline?.id)
        .sort((first, second) => first.order - second.order),
    [activePipeline?.id, pipelineStages],
  )

  const [createForm, setCreateForm] = useState<DealFormState>(() => ({
    name: '',
    stageId: stages[0]?.id ?? '',
    contactId: '',
    ownerId: '',
    value: '',
    notes: '',
  }))

  const pipelineDeals = useMemo(
    () => deals.filter((deal) => deal.pipelineId === activePipeline?.id),
    [activePipeline?.id, deals],
  )

  const selectedDeal =
    pipelineDeals.find((deal) => deal.id === activeDealId) ?? pipelineDeals[0] ?? null

  const [editorState, setEditorState] = useState<DealEditorState>(createEmptyDealEditor)

  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  )

  const attendantMap = useMemo(
    () => new Map(attendants.map((attendant) => [attendant.id, attendant])),
    [attendants],
  )

  const stageIndexMap = useMemo(
    () => new Map(stages.map((stage, index) => [stage.id, index])),
    [stages],
  )

  useEffect(() => {
    if (activePipeline && activePipeline.id !== activePipelineId) {
      setActivePipelineId(activePipeline.id)
    }
  }, [activePipeline, activePipelineId])

  useEffect(() => {
    setCreateForm((current) => ({
      ...current,
      stageId:
        stages.some((stage) => stage.id === current.stageId) && current.stageId
          ? current.stageId
          : stages[0]?.id ?? '',
    }))
  }, [stages])

  useEffect(() => {
    if (!pipelineDeals.length) {
      setActiveDealId('')
      return
    }

    if (!pipelineDeals.some((deal) => deal.id === activeDealId)) {
      setActiveDealId(pipelineDeals[0].id)
    }
  }, [activeDealId, pipelineDeals])

  useEffect(() => {
    if (!selectedDeal) {
      setEditorState(createEmptyDealEditor())
      return
    }

    setEditorState({
      stageId: selectedDeal.stageId,
      contactId: selectedDeal.contactId ?? '',
      ownerId: selectedDeal.ownerId ?? '',
      value: String(selectedDeal.value),
      notes: selectedDeal.notes,
    })
    setEditorError('')
  }, [selectedDeal])

  const totalValue = pipelineDeals.reduce((sum, deal) => sum + deal.value, 0)
  const linkedDeals = pipelineDeals.filter((deal) => deal.contactId && deal.ownerId).length

  const handleCreateFormChange =
    (field: keyof DealFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setCreateForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleEditorChange =
    (field: keyof DealEditorState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setEditorState((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleCreateDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activePipeline) {
      setCreateFormError('Nenhum pipeline disponivel.')
      return
    }

    const trimmedName = createForm.name.trim()
    const parsedValue = parseCurrencyInput(createForm.value)

    if (!trimmedName) {
      setCreateFormError('Informe um nome para o negocio.')
      return
    }

    if (!createForm.stageId) {
      setCreateFormError('Selecione um estagio do pipeline.')
      return
    }

    if (!createForm.contactId) {
      setCreateFormError('Vincule um contato ao negocio.')
      return
    }

    if (!createForm.ownerId) {
      setCreateFormError('Selecione o responsavel pelo negocio.')
      return
    }

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setCreateFormError('Informe um valor valido para o negocio.')
      return
    }

    const createdDealId = createDeal({
      pipelineId: activePipeline.id,
      stageId: createForm.stageId,
      name: trimmedName,
      contactId: createForm.contactId,
      ownerId: createForm.ownerId,
      value: parsedValue,
      notes: createForm.notes,
    })

    setActiveDealId(createdDealId)
    setCreateForm({
      name: '',
      stageId: stages[0]?.id ?? '',
      contactId: '',
      ownerId: '',
      value: '',
      notes: '',
    })
    setCreateFormError('')
  }

  const handleSaveDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedDeal) {
      return
    }

    const parsedValue = parseCurrencyInput(editorState.value)

    if (!editorState.stageId) {
      setEditorError('Selecione um estagio.')
      return
    }

    if (!editorState.contactId) {
      setEditorError('Selecione um contato vinculado.')
      return
    }

    if (!editorState.ownerId) {
      setEditorError('Selecione um responsavel.')
      return
    }

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setEditorError('Informe um valor valido.')
      return
    }

    updateDeal(selectedDeal.id, {
      stageId: editorState.stageId,
      contactId: editorState.contactId,
      ownerId: editorState.ownerId,
      value: parsedValue,
      notes: editorState.notes,
    })
    setEditorError('')
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#05251f_0%,#0d3a31_48%,#2563eb_180%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
            FRONT-11
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight">
            CRM leve em kanban para acompanhar negocio, dono e contexto comercial.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50/90">
            Liste pipelines, acompanhe estagios do funil, crie negocios e mova cada
            oportunidade entre colunas sem sair do shell principal.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {pipelines.map((pipeline) => (
              <button
                key={pipeline.id}
                type="button"
                onClick={() => setActivePipelineId(pipeline.id)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  pipeline.id === activePipeline?.id
                    ? 'border-white/25 bg-white/14 text-white'
                    : 'border-white/10 bg-white/6 text-cyan-50/85 hover:bg-white/10',
                ].join(' ')}
              >
                {pipeline.name}
              </button>
            ))}
          </div>
        </article>

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Pipelines</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{pipelines.length}</p>
            <p className="mt-3 text-sm text-slate-500">Funis comerciais disponiveis</p>
          </article>
          <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Estagios ativos</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{stages.length}</p>
            <p className="mt-3 text-sm text-slate-500">
              Colunas no pipeline selecionado
            </p>
          </article>
          <article className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Valor em aberto</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-700">
              {currencyFormatter.format(totalValue)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {linkedDeals} negocios com contato e responsavel vinculados
            </p>
          </article>
        </section>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[0.92fr_1.32fr_0.86fr]">
        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Novo negocio
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">
              Criar oportunidade no pipeline atual
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Defina o estagio inicial, vincule contato, responsavel, valor e
              observacoes.
            </p>
          </div>

          <form onSubmit={handleCreateDeal} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nome do negocio
              </span>
              <input
                value={createForm.name}
                onChange={handleCreateFormChange('name')}
                placeholder="Ex.: Plano enterprise anual"
                className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Estagio
                </span>
                <select
                  value={createForm.stageId}
                  onChange={handleCreateFormChange('stageId')}
                  className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Valor
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.value}
                  onChange={handleCreateFormChange('value')}
                  placeholder="0,00"
                  className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Contato vinculado
              </span>
              <select
                value={createForm.contactId}
                onChange={handleCreateFormChange('contactId')}
                className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              >
                <option value="">Selecione um contato</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} | {contact.company}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Responsavel
              </span>
              <select
                value={createForm.ownerId}
                onChange={handleCreateFormChange('ownerId')}
                className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              >
                <option value="">Selecione um responsavel</option>
                {attendants.map((attendant) => (
                  <option key={attendant.id} value={attendant.id}>
                    {attendant.name} | {attendant.role}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Observacoes
              </span>
              <textarea
                value={createForm.notes}
                onChange={handleCreateFormChange('notes')}
                rows={5}
                placeholder="Resumo da negociacao, proximo passo ou risco comercial."
                className="mt-2 w-full resize-none rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </label>

            {createFormError ? (
              <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createFormError}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-[1rem] bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)] transition hover:brightness-105"
            >
              Criar negocio
            </button>
          </form>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Kanban
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                {activePipeline?.name ?? 'Nenhum pipeline'}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {activePipeline?.description ?? 'Sem descricao para o pipeline atual.'}
              </p>
            </div>

            <div
              className="rounded-[1.2rem] border px-4 py-3 text-sm"
              style={{
                borderColor: `${activePipeline?.color ?? '#cbd5e1'}33`,
                background: `linear-gradient(135deg, ${activePipeline?.color ?? '#cbd5e1'}12, #ffffff)`,
              }}
            >
              <p className="font-semibold text-slate-950">{pipelineDeals.length} negocios</p>
              <p className="mt-1 text-slate-500">Movimente pelas colunas ou edite no painel.</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {stages.map((stage, stageIndex) => {
                const stageDeals = pipelineDeals.filter((deal) => deal.stageId === stage.id)
                const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)

                return (
                  <section
                    key={stage.id}
                    className="w-[310px] shrink-0 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div
                      className="rounded-[1.2rem] border px-4 py-4"
                      style={{
                        borderColor: `${stage.color}55`,
                        background: `linear-gradient(135deg, ${stage.color}, #ffffff)`,
                      }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Estagio {stageIndex + 1}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <h4 className="text-lg font-semibold text-slate-950">{stage.name}</h4>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                          {stageDeals.length}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {currencyFormatter.format(stageValue)}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {stageDeals.length ? (
                        stageDeals.map((deal) => {
                          const linkedContact = deal.contactId
                            ? contactMap.get(deal.contactId) ?? null
                            : null
                          const owner = deal.ownerId
                            ? attendantMap.get(deal.ownerId) ?? null
                            : null
                          const currentIndex = stageIndexMap.get(deal.stageId) ?? 0
                          const previousStage = stages[currentIndex - 1] ?? null
                          const nextStage = stages[currentIndex + 1] ?? null
                          const isActive = selectedDeal?.id === deal.id

                          return (
                            <button
                              key={deal.id}
                              type="button"
                              onClick={() => setActiveDealId(deal.id)}
                              className={[
                                'w-full rounded-[1.35rem] border p-4 text-left transition',
                                isActive
                                  ? 'border-emerald-300 bg-white shadow-[0_18px_40px_rgba(16,185,129,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-slate-300',
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-950">
                                  {deal.name}
                                </p>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  {currencyFormatter.format(deal.value)}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2 text-sm text-slate-600">
                                <p>{linkedContact ? linkedContact.name : 'Sem contato vinculado'}</p>
                                <p>{owner ? owner.name : 'Sem responsavel definido'}</p>
                              </div>

                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                                {deal.notes || 'Sem observacoes registradas.'}
                              </p>

                              <div className="mt-4 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    if (previousStage) {
                                      moveDealToStage(deal.id, previousStage.id)
                                    }
                                  }}
                                  disabled={!previousStage}
                                  className="rounded-[0.9rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Voltar
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    if (nextStage) {
                                      moveDealToStage(deal.id, nextStage.id)
                                    }
                                  }}
                                  disabled={!nextStage}
                                  className="rounded-[0.9rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Avancar
                                </button>
                              </div>
                            </button>
                          )
                        })
                      ) : (
                        <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                          <p className="text-sm font-semibold text-slate-900">Sem negocios</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Crie uma oportunidade neste estagio ou mova outra coluna para ca.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          {selectedDeal ? (
            <div className="space-y-5">
              <section className="rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eefaf3)] p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,#05251f,#2563eb)] text-sm font-semibold text-white">
                    {getInitials(selectedDeal.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Negocio ativo
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {selectedDeal.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Criado em {dateFormatter.format(new Date(selectedDeal.createdAt))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <article className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Valor
                    </p>
                    <p className="mt-2 text-lg font-semibold text-emerald-700">
                      {currencyFormatter.format(selectedDeal.value)}
                    </p>
                  </article>
                  <article className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Atualizado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {dateFormatter.format(new Date(selectedDeal.updatedAt))}
                    </p>
                  </article>
                </div>
              </section>

              <form onSubmit={handleSaveDeal} className="space-y-4">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Estagio
                  </span>
                  <select
                    value={editorState.stageId}
                    onChange={handleEditorChange('stageId')}
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Contato
                  </span>
                  <select
                    value={editorState.contactId}
                    onChange={handleEditorChange('contactId')}
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                  >
                    <option value="">Selecione um contato</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} | {contact.company}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Responsavel
                  </span>
                  <select
                    value={editorState.ownerId}
                    onChange={handleEditorChange('ownerId')}
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                  >
                    <option value="">Selecione um responsavel</option>
                    {attendants.map((attendant) => (
                      <option key={attendant.id} value={attendant.id}>
                        {attendant.name} | {attendant.role}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Valor
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editorState.value}
                    onChange={handleEditorChange('value')}
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Observacoes
                  </span>
                  <textarea
                    rows={6}
                    value={editorState.notes}
                    onChange={handleEditorChange('notes')}
                    className="mt-2 w-full resize-none rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
                  />
                </label>

                {editorError ? (
                  <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {editorError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-[1rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Salvar negocio
                </button>
              </form>
            </div>
          ) : (
            <div className="grid h-full min-h-[420px] place-items-center text-center">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  Nenhum negocio selecionado
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Escolha um card no kanban para ver contato, responsavel, valor e
                  observacoes.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
