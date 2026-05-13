import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

const colorOptions = [
  '#0f766e',
  '#059669',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ef4444',
  '#f59e0b',
]

const emptyForm = {
  name: '',
  color: colorOptions[0],
  description: '',
  slaMinutes: '15',
}

export function SectorsPage() {
  const attendants = useWorkspaceStore((state) => state.attendants)
  const sectors = useWorkspaceStore((state) => state.sectors)
  const conversations = useWorkspaceStore((state) => state.conversations)
  const createSector = useWorkspaceStore((state) => state.createSector)
  const updateSector = useWorkspaceStore((state) => state.updateSector)
  const deleteSector = useWorkspaceStore((state) => state.deleteSector)
  const toggleSectorAttendant = useWorkspaceStore((state) => state.toggleSectorAttendant)
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null)
  const [formState, setFormState] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const attendantMap = useMemo(
    () => new Map(attendants.map((attendant) => [attendant.id, attendant])),
    [attendants],
  )

  const sectorStats = useMemo(
    () =>
      Object.fromEntries(
        sectors.map((sector) => [
          sector.id,
          {
            queue: conversations.filter(
              (conversation) =>
                conversation.sectorId === sector.id && conversation.status === 'Aguardando',
            ).length,
            active: conversations.filter(
              (conversation) =>
                conversation.sectorId === sector.id &&
                conversation.status === 'Em atendimento',
            ).length,
          },
        ]),
      ),
    [conversations, sectors],
  )

  const boundAttendantsCount = new Set(
    sectors.flatMap((sector) => sector.attendantIds),
  ).size

  const resetForm = () => {
    setEditingSectorId(null)
    setFormState(emptyForm)
    setFormError('')
  }

  const handleSubmit = () => {
    const trimmedName = formState.name.trim()
    const trimmedDescription = formState.description.trim()
    const parsedSla = Number(formState.slaMinutes)

    if (!trimmedName) {
      setFormError('Informe um nome para o setor.')
      return
    }

    if (!Number.isFinite(parsedSla) || parsedSla <= 0) {
      setFormError('Informe um SLA valido em minutos.')
      return
    }

    const duplicate = sectors.find(
      (sector) =>
        sector.name.toLowerCase() === trimmedName.toLowerCase() &&
        sector.id !== editingSectorId,
    )

    if (duplicate) {
      setFormError('Ja existe um setor com esse nome.')
      return
    }

    const input = {
      name: trimmedName,
      color: formState.color,
      description: trimmedDescription,
      slaMinutes: parsedSla,
    }

    if (editingSectorId) {
      updateSector(editingSectorId, input)
    } else {
      createSector(input)
    }

    resetForm()
  }

  const handleEdit = (sectorId: string) => {
    const sector = sectors.find((item) => item.id === sectorId)

    if (!sector) {
      return
    }

    setEditingSectorId(sector.id)
    setFormState({
      name: sector.name,
      color: sector.color,
      description: sector.description,
      slaMinutes: String(sector.slaMinutes),
    })
    setFormError('')
  }

  const handleDelete = (sectorId: string) => {
    if (editingSectorId === sectorId) {
      resetForm()
    }

    deleteSector(sectorId)
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#eefaf3)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            FRONT-07
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Setores, regras de fila e equipe responsavel
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Cadastre setores operacionais, defina SLA de atendimento e vincule os
            atendentes que podem receber distribuicao manual ou automatica.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Setores
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{sectors.length}</p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Atendentes vinculados
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {boundAttendantsCount}
              </p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-slate-950 px-4 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Conversas em fila
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {conversations.filter((conversation) => conversation.status === 'Aguardando').length}
              </p>
            </article>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold text-slate-950">Atendentes disponiveis</p>
          <div className="mt-5 space-y-3">
            {attendants.map((attendant) => (
              <div
                key={attendant.id}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{attendant.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{attendant.role}</p>
                </div>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    attendant.status === 'Online'
                      ? 'bg-emerald-50 text-emerald-700'
                      : attendant.status === 'Pausa'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {attendant.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {editingSectorId ? 'Editar setor' : 'Novo setor'}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {editingSectorId
                  ? 'Ajuste nome, cor, descricao e SLA'
                  : 'Crie um novo setor operacional'}
              </h3>
            </div>

            {editingSectorId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-[1rem] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nome
              </span>
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ex.: Suporte premium"
                className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Descricao
              </span>
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Escopo e tipo de conversa que devem cair neste setor."
                className="mt-2 w-full resize-none rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                SLA em minutos
              </span>
              <input
                type="number"
                min="1"
                value={formState.slaMinutes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    slaMinutes: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
              />
            </label>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cor
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormState((current) => ({ ...current, color }))}
                    className={[
                      'h-11 w-11 rounded-2xl border-2 transition',
                      formState.color === color
                        ? 'scale-105 border-slate-950'
                        : 'border-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]',
                    ].join(' ')}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
            </div>

            <div
              className="rounded-[1.2rem] border border-slate-200 px-4 py-4"
              style={{
                background: `linear-gradient(135deg, ${formState.color}18, #ffffff)`,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Preview
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: formState.color }}
                />
                <p className="text-base font-semibold text-slate-950">
                  {formState.name.trim() || 'Novo setor'}
                </p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  SLA {formState.slaMinutes || '15'} min
                </span>
              </div>
            </div>

            {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-[1rem] bg-[linear-gradient(135deg,#0f766e,#25d366)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(16,185,129,0.24)] transition hover:brightness-105"
            >
              {editingSectorId ? 'Salvar alteracoes' : 'Criar setor'}
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-950">Setores cadastrados</p>
            <div className="mt-5 space-y-4">
              {sectors.map((sector) => (
                <article
                  key={sector.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: sector.color }}
                        />
                        <h3 className="text-lg font-semibold text-slate-950">
                          {sector.name}
                        </h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          SLA {sector.slaMinutes} min
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {sectorStats[sector.id]?.queue ?? 0} em fila
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {sectorStats[sector.id]?.active ?? 0} em atendimento
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {sector.description || 'Sem descricao cadastrada.'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(sector.id)}
                        className="rounded-[0.95rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sector.id)}
                        disabled={sectors.length === 1}
                        className="rounded-[0.95rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Atendentes vinculados
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {attendants.map((attendant) => {
                        const isLinked = sector.attendantIds.includes(attendant.id)

                        return (
                          <label
                            key={attendant.id}
                            className={[
                              'flex cursor-pointer items-center justify-between gap-3 rounded-[1.1rem] border px-4 py-3 transition',
                              isLinked
                                ? 'border-emerald-200 bg-white'
                                : 'border-slate-200 bg-slate-100 hover:bg-white',
                            ].join(' ')}
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {attendant.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">{attendant.role}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isLinked}
                              onChange={() =>
                                toggleSectorAttendant(sector.id, attendant.id)
                              }
                              className="h-4 w-4 accent-emerald-600"
                            />
                          </label>
                        )
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sector.attendantIds.length ? (
                        sector.attendantIds.map((attendantId) => {
                          const attendant = attendantMap.get(attendantId)

                          return attendant ? (
                            <span
                              key={attendant.id}
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                            >
                              {attendant.name}
                            </span>
                          ) : null
                        })
                      ) : (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                          Nenhum atendente vinculado
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>
    </div>
  )
}
