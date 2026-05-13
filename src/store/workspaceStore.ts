import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  WorkspaceAttendant,
  WorkspaceContact,
  WorkspaceConversation,
  WorkspaceSector,
  WorkspaceTag,
} from '../types/workspace'

const WORKSPACE_STORAGE_KEY = 'workspace-operations-storage'

const sortTags = (tags: WorkspaceTag[]) =>
  [...tags].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))

const sortSectors = (sectors: WorkspaceSector[]) =>
  [...sectors].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))

const createTimeLabel = (date = new Date()) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

const createEntryId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const isDefinedAttendant = (
  attendant: WorkspaceAttendant | undefined,
): attendant is WorkspaceAttendant => Boolean(attendant)

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

const initialAttendants: WorkspaceAttendant[] = [
  {
    id: 'att-marina',
    name: 'Marina Lopes',
    role: 'Supervisora online',
    email: 'marina@workspace.local',
    status: 'Online',
  },
  {
    id: 'att-joao',
    name: 'Joao Pedro',
    role: 'Closer comercial',
    email: 'joao@workspace.local',
    status: 'Online',
  },
  {
    id: 'att-sofia',
    name: 'Sofia Mendes',
    role: 'Especialista de onboarding',
    email: 'sofia@workspace.local',
    status: 'Online',
  },
  {
    id: 'att-bianca',
    name: 'Bianca Cruz',
    role: 'Operacao financeira',
    email: 'bianca@workspace.local',
    status: 'Online',
  },
  {
    id: 'att-rafael',
    name: 'Rafael Dias',
    role: 'Analista de suporte',
    email: 'rafael@workspace.local',
    status: 'Pausa',
  },
]

const initialSectors: WorkspaceSector[] = sortSectors([
  {
    id: 'sector-comercial',
    name: 'Comercial',
    color: '#2563eb',
    description: 'Qualificacao, proposta, fechamento e follow-up de leads.',
    slaMinutes: 15,
    attendantIds: ['att-joao', 'att-marina'],
    createdAt: '2026-05-13T08:30:00.000Z',
  },
  {
    id: 'sector-financeiro',
    name: 'Financeiro',
    color: '#f59e0b',
    description: 'Pagamentos, cobranca, renovacao e tratativas de boleto.',
    slaMinutes: 10,
    attendantIds: ['att-bianca', 'att-marina'],
    createdAt: '2026-05-13T08:32:00.000Z',
  },
  {
    id: 'sector-onboarding',
    name: 'Onboarding',
    color: '#059669',
    description: 'Implantacao, agenda de treinamento e handoff pos-venda.',
    slaMinutes: 25,
    attendantIds: ['att-sofia'],
    createdAt: '2026-05-13T08:35:00.000Z',
  },
  {
    id: 'sector-suporte',
    name: 'Suporte',
    color: '#7c3aed',
    description: 'Incidentes, orientacoes tecnicas e acompanhamento de integracao.',
    slaMinutes: 12,
    attendantIds: ['att-marina', 'att-rafael'],
    createdAt: '2026-05-13T08:37:00.000Z',
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
    sectorId: 'sector-financeiro',
    status: 'Aguardando',
    tagIds: ['tag-vip', 'tag-boleto'],
    attendant: null,
    queuedAt: '2026-05-13T12:57:00.000Z',
    lastAssignedAt: null,
    closedAt: null,
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
    sectorId: 'sector-comercial',
    status: 'Em atendimento',
    tagIds: ['tag-lead-quente', 'tag-proposta'],
    attendant: 'Joao Pedro',
    queuedAt: '2026-05-13T12:48:00.000Z',
    lastAssignedAt: '2026-05-13T12:51:00.000Z',
    closedAt: null,
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
    sectorId: 'sector-suporte',
    status: 'Em atendimento',
    tagIds: ['tag-prioridade-alta', 'tag-integracao'],
    attendant: 'Marina Lopes',
    queuedAt: '2026-05-13T12:58:00.000Z',
    lastAssignedAt: '2026-05-13T13:01:00.000Z',
    closedAt: null,
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
    sectorId: 'sector-onboarding',
    status: 'Finalizada',
    tagIds: ['tag-implantacao', 'tag-treinamento'],
    attendant: 'Sofia Mendes',
    queuedAt: '2026-05-12T18:02:00.000Z',
    lastAssignedAt: '2026-05-12T18:11:00.000Z',
    closedAt: '2026-05-12T20:06:00.000Z',
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

const assignConversationInternal = ({
  conversation,
  attendantName,
  title,
  description,
  now,
}: {
  conversation: WorkspaceConversation
  attendantName: string
  title: string
  description: string
  now: Date
}) => ({
  ...conversation,
  attendant: attendantName,
  status: 'Em atendimento' as const,
  lastAssignedAt: now.toISOString(),
  closedAt: null,
  history: [
    {
      id: createEntryId('hist'),
      title,
      description,
      time: createTimeLabel(now),
    },
    ...conversation.history,
  ],
})

type WorkspaceStore = {
  tags: WorkspaceTag[]
  attendants: WorkspaceAttendant[]
  sectors: WorkspaceSector[]
  contacts: WorkspaceContact[]
  conversations: WorkspaceConversation[]
  createTag: (input: Pick<WorkspaceTag, 'name' | 'color' | 'description'>) => void
  updateTag: (
    tagId: string,
    input: Pick<WorkspaceTag, 'name' | 'color' | 'description'>,
  ) => void
  deleteTag: (tagId: string) => void
  createSector: (
    input: Pick<WorkspaceSector, 'name' | 'color' | 'description' | 'slaMinutes'>,
  ) => void
  updateSector: (
    sectorId: string,
    input: Pick<WorkspaceSector, 'name' | 'color' | 'description' | 'slaMinutes'>,
  ) => void
  deleteSector: (sectorId: string) => void
  toggleSectorAttendant: (sectorId: string, attendantId: string) => void
  assignConversation: (conversationId: string, attendantName: string) => void
  autoDistributeSectorQueue: (sectorId: string) => void
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
      attendants: initialAttendants,
      sectors: initialSectors,
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
      createSector(input) {
        set((state) => ({
          sectors: sortSectors([
            ...state.sectors,
            {
              id: crypto.randomUUID(),
              name: input.name.trim(),
              color: input.color,
              description: input.description.trim(),
              slaMinutes: input.slaMinutes,
              attendantIds: [],
              createdAt: new Date().toISOString(),
            },
          ]),
        }))
      },
      updateSector(sectorId, input) {
        set((state) => ({
          sectors: sortSectors(
            state.sectors.map((sector) =>
              sector.id === sectorId
                ? {
                    ...sector,
                    name: input.name.trim(),
                    color: input.color,
                    description: input.description.trim(),
                    slaMinutes: input.slaMinutes,
                  }
                : sector,
            ),
          ),
        }))
      },
      deleteSector(sectorId) {
        set((state) => {
          if (state.sectors.length <= 1) {
            return state
          }

          const fallbackSector = state.sectors.find((sector) => sector.id !== sectorId)

          if (!fallbackSector) {
            return state
          }

          return {
            sectors: state.sectors.filter((sector) => sector.id !== sectorId),
            conversations: state.conversations.map((conversation) =>
              conversation.sectorId === sectorId
                ? {
                    ...conversation,
                    sectorId: fallbackSector.id,
                    history: [
                      {
                        id: createEntryId('hist'),
                        title: 'Setor removido',
                        description: `Conversa movida para ${fallbackSector.name} apos remocao do setor anterior.`,
                        time: createTimeLabel(),
                      },
                      ...conversation.history,
                    ],
                  }
                : conversation,
            ),
          }
        })
      },
      toggleSectorAttendant(sectorId, attendantId) {
        set((state) => ({
          sectors: state.sectors.map((sector) =>
            sector.id === sectorId
              ? {
                  ...sector,
                  attendantIds: sector.attendantIds.includes(attendantId)
                    ? sector.attendantIds.filter((currentId) => currentId !== attendantId)
                    : [...sector.attendantIds, attendantId],
                }
              : sector,
          ),
        }))
      },
      assignConversation(conversationId, attendantName) {
        set((state) => {
          const now = new Date()

          return {
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId &&
              conversation.status !== 'Finalizada'
                ? assignConversationInternal({
                    conversation,
                    attendantName,
                    title: 'Atendimento assumido',
                    description: `${attendantName} assumiu a conversa manualmente.`,
                    now,
                  })
                : conversation,
            ),
          }
        })
      },
      autoDistributeSectorQueue(sectorId) {
        set((state) => {
          const sector = state.sectors.find((item) => item.id === sectorId)

          if (!sector) {
            return state
          }

          const availableAttendants = sector.attendantIds
            .map((attendantId) =>
              state.attendants.find((attendant) => attendant.id === attendantId),
            )
            .filter(isDefinedAttendant)
            .filter((attendant) => attendant.status === 'Online')

          if (!availableAttendants.length) {
            return state
          }

          const waitingConversationIds = state.conversations
            .filter(
              (conversation) =>
                conversation.sectorId === sectorId && conversation.status === 'Aguardando',
            )
            .sort(
              (first, second) =>
                new Date(first.queuedAt).getTime() - new Date(second.queuedAt).getTime(),
            )
            .map((conversation) => conversation.id)

          if (!waitingConversationIds.length) {
            return state
          }

          const loads = new Map(
            availableAttendants.map((attendant) => [
              attendant.name,
              state.conversations.filter(
                (conversation) =>
                  conversation.sectorId === sectorId &&
                  conversation.status === 'Em atendimento' &&
                  conversation.attendant === attendant.name,
              ).length,
            ]),
          )

          const assignments = new Map<string, string>()

          for (const conversationId of waitingConversationIds) {
            const selectedAttendant = [...availableAttendants].sort((first, second) => {
              const firstLoad = loads.get(first.name) ?? 0
              const secondLoad = loads.get(second.name) ?? 0

              if (firstLoad === secondLoad) {
                return first.name.localeCompare(second.name, 'pt-BR')
              }

              return firstLoad - secondLoad
            })[0]

            assignments.set(conversationId, selectedAttendant.name)
            loads.set(selectedAttendant.name, (loads.get(selectedAttendant.name) ?? 0) + 1)
          }

          const now = new Date()

          return {
            conversations: state.conversations.map((conversation) => {
              const attendantName = assignments.get(conversation.id)

              if (!attendantName) {
                return conversation
              }

              return assignConversationInternal({
                conversation,
                attendantName,
                title: 'Distribuicao automatica',
                description: `Conversa distribuida automaticamente para ${attendantName}.`,
                now,
              })
            }),
          }
        })
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
        attendants: state.attendants,
        sectors: state.sectors,
        contacts: state.contacts,
        conversations: state.conversations,
      }),
    },
  ),
)
