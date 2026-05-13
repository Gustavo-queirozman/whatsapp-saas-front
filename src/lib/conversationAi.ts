import type { WorkspaceConversation } from '../types/workspace'

export type ConversationIntentResult = {
  label: string
  confidence: 'Alta' | 'Media' | 'Baixa'
  description: string
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const truncate = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trimEnd()}...`

const toSentenceFragment = (value: string, maxLength: number) =>
  truncate(value.trim().replace(/[.!?]+$/g, ''), maxLength)

const getLatestIncomingMessage = (conversation: WorkspaceConversation) =>
  [...conversation.messages].reverse().find((message) => message.direction === 'incoming')

const getLastMessagesExcerpt = (conversation: WorkspaceConversation) =>
  conversation.messages
    .filter((message) => message.direction !== 'system')
    .slice(-4)
    .map((message) => {
      const senderLabel = message.direction === 'incoming' ? conversation.contactName : message.sender
      return `${senderLabel}: ${truncate(message.content, 88)}`
    })
    .join(' ')

const getFirstName = (fullName: string) => fullName.trim().split(' ')[0] || 'cliente'

const countKeywordMatches = (content: string, keywords: string[]) =>
  keywords.reduce((score, keyword) => score + (content.includes(keyword) ? 1 : 0), 0)

const detectIntentRule = (content: string) => {
  const rules = [
    {
      label: 'Suporte tecnico',
      keywords: ['erro', 'falha', 'travou', 'nao funciona', 'instavel', 'bug', 'api', 'sistema'],
      description: 'Cliente relata falha operacional ou precisa de apoio tecnico.',
    },
    {
      label: 'Financeiro',
      keywords: ['boleto', 'fatura', 'pagamento', 'financeiro', 'cobranca', 'nota fiscal'],
      description: 'Demanda relacionada a cobranca, pagamento ou documentos financeiros.',
    },
    {
      label: 'Comercial',
      keywords: ['plano', 'proposta', 'contrato', 'orcamento', 'upgrade', 'licenca'],
      description: 'Conversa com foco em proposta, contratacao ou expansao comercial.',
    },
    {
      label: 'Cancelamento',
      keywords: ['cancelar', 'encerrar', 'rescisao', 'desistir', 'parar'],
      description: 'Contato sinaliza risco de churn ou pedido de encerramento.',
    },
    {
      label: 'Agendamento',
      keywords: ['agenda', 'reuniao', 'horario', 'marcar', 'agendar', 'demo'],
      description: 'Cliente quer alinhar horario, demonstracao ou reuniao.',
    },
    {
      label: 'Urgencia operacional',
      keywords: ['urgente', 'prioridade', 'parado', 'critico', 'hoje', 'agora'],
      description: 'Demanda com indicio de alta urgencia e necessidade de resposta rapida.',
    },
  ]

  const rankedRules = rules
    .map((rule) => ({
      ...rule,
      score: countKeywordMatches(content, rule.keywords),
    }))
    .filter((rule) => rule.score > 0)
    .sort((left, right) => right.score - left.score)

  return rankedRules[0] ?? null
}

export const detectConversationIntent = (
  conversation: WorkspaceConversation,
): ConversationIntentResult => {
  const combinedContent = normalizeText(
    conversation.messages
      .filter((message) => message.direction !== 'system')
      .map((message) => message.content)
      .join(' '),
  )

  const detectedRule = detectIntentRule(combinedContent)

  if (!detectedRule) {
    return {
      label: 'Atendimento geral',
      confidence: 'Baixa',
      description: 'Nao houve sinal forte de tema especifico nas ultimas mensagens.',
    }
  }

  return {
    label: detectedRule.label,
    confidence:
      detectedRule.score >= 3 ? 'Alta' : detectedRule.score === 2 ? 'Media' : 'Baixa',
    description: detectedRule.description,
  }
}

export const summarizeConversation = (conversation: WorkspaceConversation) => {
  const latestIncomingMessage = getLatestIncomingMessage(conversation)
  const recentExcerpt = getLastMessagesExcerpt(conversation)
  const statusLine =
    conversation.status === 'Finalizada'
      ? 'A conversa ja foi encerrada.'
      : conversation.attendant
        ? `Atendimento em andamento com ${conversation.attendant}.`
        : 'A conversa ainda aguarda responsavel definido.'

  if (!latestIncomingMessage) {
    return `${conversation.summary} ${statusLine}`.trim()
  }

  return [
    conversation.summary,
    `Ultimo ponto do cliente: ${toSentenceFragment(latestIncomingMessage.content, 110)}.`,
    statusLine,
    `Recorte recente: ${recentExcerpt}`,
  ].join(' ')
}

export const suggestConversationReply = (
  conversation: WorkspaceConversation,
  intent = detectConversationIntent(conversation),
) => {
  const latestIncomingMessage = getLatestIncomingMessage(conversation)
  const firstName = getFirstName(conversation.contactName)
  const context = latestIncomingMessage
    ? `Recebi sua mensagem sobre ${toSentenceFragment(latestIncomingMessage.content, 78).toLowerCase()}.`
    : 'Recebi sua solicitacao e ja estou olhando o contexto completo.'

  const intentReplies: Record<string, string> = {
    'Suporte tecnico':
      'Vou validar o que aconteceu por aqui e te retorno com a causa ou com o proximo passo objetivo.',
    Financeiro:
      'Vou conferir os dados financeiros envolvidos para te orientar com a informacao correta.',
    Comercial:
      'Posso organizar os proximos passos e te indicar a melhor alternativa para este cenario.',
    Cancelamento:
      'Vou revisar sua solicitacao com prioridade para te passar o procedimento mais rapido.',
    Agendamento:
      'Vou verificar a melhor janela para avancarmos e te proponho um horario na sequencia.',
    'Urgencia operacional':
      'Vou tratar isso como prioridade agora para reduzir o impacto e te atualizar rapidamente.',
    'Atendimento geral':
      'Ja estou analisando a solicitacao para te responder da forma mais objetiva possivel.',
  }

  const body =
    intentReplies[intent.label] ?? intentReplies['Atendimento geral']

  return [
    `Oi, ${firstName}. ${context}`,
    body,
    'Fico acompanhando por aqui e te atualizo em seguida.',
  ].join(' ')
}

export const simulateAiRequest = <T>(
  producer: () => T,
  delayInMs = 1100,
) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(producer()), delayInMs)
  })
