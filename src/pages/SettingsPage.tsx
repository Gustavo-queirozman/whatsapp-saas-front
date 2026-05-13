import { useMemo, useState } from 'react'
import { TagBadge } from '../components/tags/TagBadge'
import { useWorkspaceStore } from '../store/workspaceStore'

const authEndpoints = [
  {
    method: 'POST',
    route: '/auth/login',
    purpose: 'Autentica, cria sessao e retorna token.',
  },
  {
    method: 'GET',
    route: '/auth/me',
    purpose: 'Carrega usuario autenticado e empresas disponiveis.',
  },
  {
    method: 'Header',
    route: 'X-Company-Id',
    purpose: 'Define a empresa atual para rotas multiempresa protegidas.',
  },
  {
    method: 'Client',
    route: '401 interceptor',
    purpose: 'Expira sessao, limpa store e retorna para /login automaticamente.',
  },
]

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
}

export function SettingsPage() {
  const tags = useWorkspaceStore((state) => state.tags)
  const contacts = useWorkspaceStore((state) => state.contacts)
  const conversations = useWorkspaceStore((state) => state.conversations)
  const createTag = useWorkspaceStore((state) => state.createTag)
  const updateTag = useWorkspaceStore((state) => state.updateTag)
  const deleteTag = useWorkspaceStore((state) => state.deleteTag)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [formState, setFormState] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const usageMap = useMemo(() => {
    const counts = new Map<string, number>()

    for (const contact of contacts) {
      for (const tagId of contact.tagIds) {
        counts.set(tagId, (counts.get(tagId) ?? 0) + 1)
      }
    }

    for (const conversation of conversations) {
      for (const tagId of conversation.tagIds) {
        counts.set(tagId, (counts.get(tagId) ?? 0) + 1)
      }
    }

    return counts
  }, [contacts, conversations])

  const resetForm = () => {
    setEditingTagId(null)
    setFormState(emptyForm)
    setFormError('')
  }

  const handleSubmit = () => {
    const trimmedName = formState.name.trim()
    const trimmedDescription = formState.description.trim()

    if (!trimmedName) {
      setFormError('Informe um nome para a tag.')
      return
    }

    const duplicate = tags.find(
      (tag) =>
        tag.name.toLowerCase() === trimmedName.toLowerCase() &&
        tag.id !== editingTagId,
    )

    if (duplicate) {
      setFormError('Ja existe uma tag com esse nome.')
      return
    }

    if (editingTagId) {
      updateTag(editingTagId, {
        name: trimmedName,
        color: formState.color,
        description: trimmedDescription,
      })
    } else {
      createTag({
        name: trimmedName,
        color: formState.color,
        description: trimmedDescription,
      })
    }

    resetForm()
  }

  const handleEdit = (tagId: string) => {
    const tag = tags.find((currentTag) => currentTag.id === tagId)

    if (!tag) {
      return
    }

    setEditingTagId(tag.id)
    setFormState({
      name: tag.name,
      color: tag.color,
      description: tag.description,
    })
    setFormError('')
  }

  const handleDelete = (tagId: string) => {
    if (editingTagId === tagId) {
      resetForm()
    }

    deleteTag(tagId)
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#f1fbf5)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Configuracoes
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Gerencie o catalogo de tags
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Crie, edite e exclua tags compartilhadas entre contatos e conversas.
            A cor escolhida aparece em toda a operacao, incluindo filtros e contexto
            do atendimento.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Tags criadas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{tags.length}</p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Contatos etiquetados
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {contacts.filter((contact) => contact.tagIds.length).length}
              </p>
            </article>
            <article className="rounded-[1.3rem] border border-slate-200 bg-slate-950 px-4 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Conversas com tags
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {conversations.filter((conversation) => conversation.tagIds.length).length}
              </p>
            </article>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold text-slate-950">Ambiente do frontend</p>
          <div className="mt-5 rounded-[1.3rem] bg-slate-950 px-4 py-4 font-mono text-sm text-emerald-300">
            VITE_API_URL={import.meta.env.VITE_API_URL}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            O gerenciamento de tags esta em estado persistido no navegador para
            simular o comportamento final do frontend enquanto o backend ainda nao
            expoe os endpoints dedicados.
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {editingTagId ? 'Editar tag' : 'Nova tag'}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {editingTagId ? 'Atualize nome, cor e descricao' : 'Crie uma nova tag'}
              </h3>
            </div>

            {editingTagId ? (
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
                placeholder="Ex.: Reativacao"
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
                placeholder="Quando essa tag deve ser usada?"
                className="mt-2 w-full resize-none rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white"
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
                <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 px-3 py-2">
                  <span className="text-sm font-medium text-slate-600">Custom</span>
                  <input
                    type="color"
                    value={formState.color}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Preview
              </p>
              <div className="mt-3">
                <TagBadge
                  tag={{
                    id: 'preview',
                    name: formState.name.trim() || 'Nova tag',
                    color: formState.color,
                    description: formState.description,
                    createdAt: '',
                  }}
                  size="md"
                />
              </div>
            </div>

            {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-[1rem] bg-[linear-gradient(135deg,#0f766e,#25d366)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(16,185,129,0.24)] transition hover:brightness-105"
            >
              {editingTagId ? 'Salvar alteracoes' : 'Criar tag'}
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-950">Tags cadastradas</p>
            <div className="mt-5 space-y-3">
              {tags.map((tag) => (
                <article
                  key={tag.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <TagBadge tag={tag} size="md" />
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {tag.description || 'Sem descricao cadastrada.'}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {usageMap.get(tag.id) ?? 0} aplicacoes em contatos e conversas
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(tag.id)}
                        className="rounded-[0.95rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="rounded-[0.95rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-950">
              Contrato inicial esperado
            </p>
            <div className="mt-5 space-y-3">
              {authEndpoints.map((endpoint) => (
                <div
                  key={endpoint.route}
                  className="rounded-[1.3rem] border border-slate-200 px-4 py-4"
                >
                  <p className="font-mono text-sm text-slate-900">
                    {endpoint.method} {endpoint.route}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {endpoint.purpose}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </div>
  )
}
