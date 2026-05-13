import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TagBadge } from '../components/tags/TagBadge'
import { TagPicker } from '../components/tags/TagPicker'
import { useWorkspaceStore } from '../store/workspaceStore'

const getLifecycleClasses = (lifecycle: string) => {
  if (lifecycle === 'Lead') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (lifecycle === 'Parceiro') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export function ContactsPage() {
  const contacts = useWorkspaceStore((state) => state.contacts)
  const tags = useWorkspaceStore((state) => state.tags)
  const updateContact = useWorkspaceStore((state) => state.updateContact)
  const [activeContactId, setActiveContactId] = useState(contacts[0]?.id ?? '')

  const activeContact =
    contacts.find((contact) => contact.id === activeContactId) ?? contacts[0] ?? null

  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const contactsWithTags = contacts.filter((contact) => contact.tagIds.length).length

  const toggleContactTag = (tagId: string) => {
    if (!activeContact) {
      return
    }

    updateContact(activeContact.id, (contact) => ({
      ...contact,
      tagIds: contact.tagIds.includes(tagId)
        ? contact.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...contact.tagIds, tagId],
    }))
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#eef9f1_52%,#f6fffb)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Contatos
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Etiquete a base e mantenha o contexto do relacionamento
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Aplique as mesmas tags usadas no atendimento direto no cadastro do
              contato para segmentar clientes, leads e parceiros sem sair do shell
              principal.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Contatos
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {contacts.length}
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-emerald-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Etiquetados
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {contactsWithTags}
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-slate-200 bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Tags ativas
              </p>
              <p className="mt-2 text-2xl font-semibold">{tags.length}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid min-h-[680px] gap-4 xl:grid-cols-[340px,minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Base ativa
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Contatos com contexto pronto para atendimento, CRM e campanhas.
            </p>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-2">
            {contacts.map((contact) => {
              const isActive = contact.id === activeContact?.id

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setActiveContactId(contact.id)}
                  className={[
                    'mb-2 w-full rounded-[1.4rem] border px-4 py-4 text-left transition',
                    isActive
                      ? 'border-emerald-300 bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] shadow-[0_18px_36px_rgba(16,185,129,0.12)]'
                      : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {contact.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {contact.company}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getLifecycleClasses(contact.lifecycle)}`}
                    >
                      {contact.lifecycle}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {contact.lastInteraction}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {contact.tagIds.slice(0, 2).map((tagId) => {
                      const tag = tagMap.get(tagId)
                      return tag ? <TagBadge key={tag.id} tag={tag} /> : null
                    })}
                    {contact.tagIds.length > 2 ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        +{contact.tagIds.length - 2}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
          {activeContact ? (
            <div className="space-y-5">
              <section className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f3faf6)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Cadastro do contato
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {activeContact.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {activeContact.phone} | {activeContact.company} | {activeContact.city}
                    </p>
                  </div>

                  <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,#05251f,#25d366)] text-lg font-semibold text-white">
                    {activeContact.name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <article className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Responsavel
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {activeContact.owner}
                    </p>
                  </article>
                  <article className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Ultima interacao
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {activeContact.lastInteraction}
                    </p>
                  </article>
                  <article className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Ciclo
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {activeContact.lifecycle}
                    </p>
                  </article>
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Etiquetas do contato
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Clique para aplicar ou remover uma tag do cadastro atual.
                    </p>
                  </div>

                  {!tags.length ? (
                    <Link
                      to="/configuracoes"
                      className="rounded-[1rem] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-800"
                    >
                      Criar tags
                    </Link>
                  ) : null}
                </div>

                <div className="mt-4">
                  <TagPicker
                    tags={tags}
                    selectedTagIds={activeContact.tagIds}
                    onToggle={toggleContactTag}
                    emptyMessage="Nenhuma tag disponivel. Crie a primeira em Configuracoes."
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {activeContact.tagIds.length ? (
                    activeContact.tagIds.map((tagId) => {
                      const tag = tagMap.get(tagId)
                      return tag ? <TagBadge key={tag.id} tag={tag} size="md" /> : null
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhuma tag aplicada neste contato.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Observacoes
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {activeContact.notes}
                </p>
              </section>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  Nenhum contato selecionado
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Selecione um contato na coluna esquerda para editar as tags.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
