import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  WorkspaceContact,
  WorkspaceConversation,
  WorkspaceTag,
} from '../types/workspace'

const WORKSPACE_STORAGE_KEY = 'workspace-tags-storage'

const sortTags = (tags: WorkspaceTag[]) =>
  [...tags].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))

const initialTags: WorkspaceTag[] = sortTags([
  {
    id: 'tag-vip',
    name: 'VIP',
    color: '#f59e0b',
    description: 'Clientes de alto valor ou com atendimento prioritario.',
    createdAt: '2026-05-13T09:00:00.000Z',
  },
  {
    id: 'tag-boleto',
    name: 'Boleto',
    color: '#0f766e',
    description: 'Temas ligados a pagamento, cobranca e renovacao.',
    createdAt: '2026-05-13T09:02:00.000Z',
  },
  {
    id: 'tag-lead-quente',
    name: 'Lead quente',
    color: '#ef4444',
    description: 'Oportunidades em fechamento comercial.',
    createdAt: '2026-05-13T09:03:00.000Z',
  },
  {
    id: 'tag-proposta',
    name: 'Proposta',
    color: '#7c3aed',
    description: 'Conversas com proposta comercial enviada.',
    createdAt: '2026-05-13T09:05:00.000Z',
  },
  {
    id: 'tag-prioridade-alta',
    name: 'Prioridade alta',
    color: '#dc2626',
    description: 'Demandas com SLA curto ou risco operacional.',
    createdAt: '2026-05-13T09:07:00.000Z',
  },
  {
    id: 'tag-integracao',
    name: 'Integracao',
    color: '#2563eb',
    description: 'Assuntos tecnicos ligados a integracoes e APIs.',
    createdAt: '2026-05-13T09:08:00.000Z',
  },
  {
    id: 'tag-implantacao',
    name: 'Implantacao',
    color: '#059669',
    description: 'Clientes em fase de onboarding ou go-live.',
    createdAt: '2026-05-13T09:09:00.000Z',
  },
  {
    id: 'tag-treinamento',
    name: 'Treinamento',
    color: '#0891b2',
    description: 'Sessoes de habilitacao, consultoria e repasse interno.',
    createdAt: '2026-05-13T09:11:00.000Z',
  },
])

const initialContacts: WorkspaceContact[] = [
  {
    id: 'contact-ana',
    name: 'Ana Costa',
    phone: '+55 11 99871-2304',
    company: 'Studio Avela',
    lifecycle: 'Cliente',
    owner: 'Marina Lopes',
    city: 'Sao Paulo, SP',
    lastInteraction: 'Hoje, 09:14',
    notes: 'Renovacao anual em analise pelo Financeiro.',
    tagIds: ['tag-vip', 'tag-boleto'],
  },
  {
    id: 'contact-lucas',
    name: 'Lucas Martins',
    phone: '+55 21 99751-1032',
    company: 'Orbita Imoveis',
    lifecycle: 'Lead',
    owner: 'Joao Pedro',
    city: 'Rio de Janeiro, RJ',
    lastInteraction: 'Hoje, 09:09',
    notes: 'Negociacao enterprise aguardando envio de contrato.',
    tagIds: ['tag-lead-quente', 'tag-proposta'],
  },
  {
    id: 'contact-camila',
    name: 'Camila Nunes',
    phone: '+55 31 98810-4457',
    company: 'Clinica Revita',
    lifecycle: 'Cliente',
    owner: 'Marina Lopes',
    city: 'Belo Horizonte, MG',
    lastInteraction: 'Hoje, 09:18',
    notes: 'Equipe depende da integracao para lembretes de pacientes.',
    tagIds: ['tag-prioridade-alta', 'tag-integracao'],
  },
  {
    id: 'contact-vitta',
    name: 'Equipe Vitta',
    phone: '+55 71 98761-2210',
    company: 'Vitta Educacao',
    lifecycle: 'Cliente',
    owner: 'Sofia Mendes',
    city: 'Salvador, BA',
    lastInteraction: 'Ontem, 17:05',
    notes: 'Treinamento operacional confirmado para sexta-feira.',
    tagIds: ['tag-implantacao', 'tag-treinamento'],
  },
  {
    id: 'contact-thiago',
    name: 'Thiago Rezende',
    phone: '+55 62 99214-3001',
    company: 'Delta Solar',
    lifecycle: 'Parceiro',
    owner: 'Bianca Cruz',
    city: 'Goiania, GO',
    lastInteraction: 'Ontem, 15:42',
    notes: 'Parceiro comercial validando replicacao do playbook de atendimento.',
    tagIds: ['tag-proposta'],
  },
]

const initialConversations: WorkspaceConversation[] = [
  {
    id: 'conv-1',
    contactId: 'contact-ana',
    contactName: 'Ana Costa',
    phone: '+55 11 99871-2304',
    company: 'Studio Avela',
    sector: 'Financeiro',
    status: 'Aguardando',
    tagIds: ['tag-vip', 'tag-boleto'],
    attendant: null,
    waitingSince: '12 min',
    lastMessage: 'Pode confirmar se o boleto compensa hoje?',
    lastMessageTime: '09:14',
    unreadCount: 3,
    summary: 'Cliente aguardando confirmacao de pagamento da renovacao anual.',
    notes: 'Renovacao vence amanha. Priorizar retorno ainda nesta janela.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-1',
        direction: 'incoming',
        content: 'Bom dia, preciso confirmar o pagamento da assinatura.',
        sender: 'Ana Costa',
        time: '08:57',
      },
      {
        id: 'msg-2',
        direction: 'incoming',
        content: 'O boleto que recebi vence hoje e queria saber se a ativacao segue normal.',
        sender: 'Ana Costa',
        time: '09:02',
      },
      {
        id: 'msg-3',
        direction: 'system',
        content: 'Chat roteado automaticamente para o setor Financeiro.',
        sender: 'Sistema',
        time: '09:03',
      },
      {
        id: 'msg-4',
        direction: 'incoming',
        content: 'Pode confirmar se o boleto compensa hoje?',
        sender: 'Ana Costa',
        time: '09:14',
      },
    ],
    history: [
      {
        id: 'hist-1',
        title: 'Entrada no atendimento',
        description: 'Conversa iniciada pelo canal principal do WhatsApp.',
        time: '08:57',
      },
      {
        id: 'hist-2',
        title: 'Triagem automatica',
        description: 'Tag Boleto aplicada e encaminhamento ao Financeiro.',
        time: '09:03',
      },
    ],
  },
  {
    id: 'conv-2',
    contactId: 'contact-lucas',
    contactName: 'Lucas Martins',
    phone: '+55 21 99751-1032',
    company: 'Orbita Imoveis',
    sector: 'Comercial',
    status: 'Em atendimento',
    tagIds: ['tag-lead-quente', 'tag-proposta'],
    attendant: 'Joao Pedro',
    waitingSince: '3 min',
    lastMessage: 'Fechado. Pode mandar o contrato ainda hoje.',
    lastMessageTime: '09:09',
    unreadCount: 0,
    summary: 'Negociacao em fechamento com interesse no plano Enterprise.',
    notes: 'Cliente pediu contrato com clausula de onboarding estendido.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-5',
        direction: 'outgoing',
        content: 'Consegui aprovar a proposta com onboarding incluido sem custo adicional.',
        sender: 'Joao Pedro',
        time: '08:48',
      },
      {
        id: 'msg-6',
        direction: 'incoming',
        content: 'Perfeito. Se mandar o contrato hoje, eu consigo assinar.',
        sender: 'Lucas Martins',
        time: '08:52',
      },
      {
        id: 'msg-7',
        direction: 'outgoing',
        content: 'Vou preparar agora. Posso seguir com o CNPJ da Orbita?',
        sender: 'Joao Pedro',
        time: '09:01',
      },
      {
        id: 'msg-8',
        direction: 'incoming',
        content: 'Fechado. Pode mandar o contrato ainda hoje.',
        sender: 'Lucas Martins',
        time: '09:09',
      },
    ],
    history: [
      {
        id: 'hist-3',
        title: 'Atendimento assumido',
        description: 'Joao Pedro assumiu a conversa apos a qualificacao inicial.',
        time: '08:31',
      },
      {
        id: 'hist-4',
        title: 'Etiqueta Proposta aplicada',
        description: 'Conversa movida para monitoramento comercial.',
        time: '08:44',
      },
    ],
  },
  {
    id: 'conv-3',
    contactId: 'contact-camila',
    contactName: 'Camila Nunes',
    phone: '+55 31 98810-4457',
    company: 'Clinica Revita',
    sector: 'Suporte',
    status: 'Em atendimento',
    tagIds: ['tag-prioridade-alta', 'tag-integracao'],
    attendant: 'Marina Lopes',
    waitingSince: 'Agora',
    lastMessage: 'Pode seguir. Estou acompanhando por aqui.',
    lastMessageTime: '09:18',
    unreadCount: 0,
    summary: 'Falha de integracao no envio de lembretes para pacientes.',
    notes: 'Ambiente ja validado. Cliente precisa de retorno em menos de 20 min.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-9',
        direction: 'incoming',
        content: 'Os lembretes nao estao saindo desde cedo. Alguma instabilidade?',
        sender: 'Camila Nunes',
        time: '08:58',
      },
      {
        id: 'msg-10',
        direction: 'outgoing',
        content: 'Estou verificando a fila de integracao e ja volto com a causa.',
        sender: 'Marina Lopes',
        time: '09:04',
      },
      {
        id: 'msg-11',
        direction: 'system',
        content: 'Historico tecnico anexado ao ticket pela operacao.',
        sender: 'Sistema',
        time: '09:11',
      },
      {
        id: 'msg-12',
        direction: 'outgoing',
        content: 'Pode seguir. Estou acompanhando por aqui.',
        sender: 'Marina Lopes',
        time: '09:18',
      },
    ],
    history: [
      {
        id: 'hist-5',
        title: 'Atendimento assumido',
        description: 'Marina Lopes assumiu a conversa para resposta prioritaria.',
        time: '09:01',
      },
      {
        id: 'hist-6',
        title: 'Historico sincronizado',
        description: 'Eventos da integracao enviados para o contexto do agente.',
        time: '09:11',
      },
    ],
  },
  {
    id: 'conv-4',
    contactId: 'contact-vitta',
    contactName: 'Equipe Vitta',
    phone: '+55 71 98761-2210',
    company: 'Vitta Educacao',
    sector: 'Onboarding',
    status: 'Finalizada',
    tagIds: ['tag-implantacao', 'tag-treinamento'],
    attendant: 'Sofia Mendes',
    waitingSince: 'Encerrada',
    lastMessage: 'Treinamento confirmado para sexta, obrigado.',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    summary: 'Treinamento da equipe confirmado e agenda compartilhada.',
    notes: 'Cliente pediu gravacao da sessao para repasse interno.',
    channel: 'WhatsApp Business',
    messages: [
      {
        id: 'msg-13',
        direction: 'outgoing',
        content: 'Fechei a agenda com o time de implantacao para sexta as 10h.',
        sender: 'Sofia Mendes',
        time: '17:02',
      },
      {
        id: 'msg-14',
        direction: 'incoming',
        content: 'Treinamento confirmado para sexta, obrigado.',
        sender: 'Equipe Vitta',
        time: '17:05',
      },
    ],
    history: [
      {
        id: 'hist-7',
        title: 'Transferencia concluida',
        description: 'Atendimento transferido do Comercial para Onboarding.',
        time: '16:11',
      },
      {
        id: 'hist-8',
        title: 'Conversa finalizada',
        description: 'Encerramento realizado apos confirmacao da agenda.',
        time: '17:06',
      },
    ],
  },
]

type WorkspaceStore = {
  tags: WorkspaceTag[]
  contacts: WorkspaceContact[]
  conversations: WorkspaceConversation[]
  createTag: (input: Pick<WorkspaceTag, 'name' | 'color' | 'description'>) => void
  updateTag: (
    tagId: string,
    input: Pick<WorkspaceTag, 'name' | 'color' | 'description'>,
  ) => void
  deleteTag: (tagId: string) => void
  updateContact: (
    contactId: string,
    updater: (contact: WorkspaceContact) => WorkspaceContact,
  ) => void
  updateConversation: (
    conversationId: string,
    updater: (conversation: WorkspaceConversation) => WorkspaceConversation,
  ) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      tags: initialTags,
      contacts: initialContacts,
      conversations: initialConversations,
      createTag(input) {
        set((state) => ({
          tags: sortTags([
            ...state.tags,
            {
              id: crypto.randomUUID(),
              name: input.name.trim(),
              color: input.color,
              description: input.description.trim(),
              createdAt: new Date().toISOString(),
            },
          ]),
        }))
      },
      updateTag(tagId, input) {
        set((state) => ({
          tags: sortTags(
            state.tags.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    name: input.name.trim(),
                    color: input.color,
                    description: input.description.trim(),
                  }
                : tag,
            ),
          ),
        }))
      },
      deleteTag(tagId) {
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== tagId),
          contacts: state.contacts.map((contact) => ({
            ...contact,
            tagIds: contact.tagIds.filter((currentTagId) => currentTagId !== tagId),
          })),
          conversations: state.conversations.map((conversation) => ({
            ...conversation,
            tagIds: conversation.tagIds.filter(
              (currentTagId) => currentTagId !== tagId,
            ),
          })),
        }))
      },
      updateContact(contactId, updater) {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === contactId ? updater(contact) : contact,
          ),
        }))
      },
      updateConversation(conversationId, updater) {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? updater(conversation)
              : conversation,
          ),
        }))
      },
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      partialize: (state) => ({
        tags: state.tags,
        contacts: state.contacts,
        conversations: state.conversations,
      }),
    },
  ),
)
