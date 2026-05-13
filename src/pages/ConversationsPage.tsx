const conversations = [
  { contact: 'Ana Costa', lastMessage: 'Pode confirmar o pagamento?', status: 'Aguardando' },
  { contact: 'Lucas Martins', lastMessage: 'Disparo concluido com sucesso.', status: 'Finalizada' },
  { contact: 'Equipe Comercial', lastMessage: 'Temos 14 leads novos no funil.', status: 'Em andamento' },
]

export function ConversationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
          Conversas
        </p>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">
          Tabela inicial para listar mensagens, tickets ou contatos.
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Esta pagina ja fica protegida por autenticacao, entao voce pode
          conecta-la a endpoints como <span className="font-mono">/chats</span>,
          <span className="font-mono"> /messages</span> ou qualquer recurso que
          o backend exponha.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-[1.1fr_1.6fr_0.8fr] gap-4 border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span>Contato</span>
          <span>Ultima mensagem</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-slate-200">
          {conversations.map((item) => (
            <div
              key={item.contact}
              className="grid grid-cols-[1.1fr_1.6fr_0.8fr] gap-4 px-6 py-5 text-sm text-slate-700"
            >
              <span className="font-medium text-slate-900">{item.contact}</span>
              <span>{item.lastMessage}</span>
              <span className="text-slate-500">{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
