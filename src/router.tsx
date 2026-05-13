import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthBootstrap } from './components/auth/AuthBootstrap'
import { CompanyRoute } from './components/auth/CompanyRoute'
import { GuestRoute } from './components/auth/GuestRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import {
  COMPANY_SELECTION_ROUTE,
  DASHBOARD_ROUTE,
  LOGIN_ROUTE,
} from './constants/auth'
import { AppLayout } from './layouts/AppLayout'
import { CompanySelectionPage } from './pages/CompanySelectionPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'
import { SettingsPage } from './pages/SettingsPage'

export const router = createBrowserRouter([
  {
    element: <AuthBootstrap />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: LOGIN_ROUTE, element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: COMPANY_SELECTION_ROUTE, element: <CompanySelectionPage /> },
          {
            element: <CompanyRoute />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { index: true, element: <Navigate to={DASHBOARD_ROUTE} replace /> },
                  { path: DASHBOARD_ROUTE, element: <DashboardPage /> },
                  {
                    path: '/atendimento',
                    element: (
                      <ModulePage
                        title="Atendimento centralizado"
                        eyebrow="Atendimento"
                        description="Organize filas, prioridades e conversas em um espaco unico para operadores e supervisores."
                        highlights={[
                          'Fila priorizada por SLA e tempo de espera.',
                          'Distribuicao rapida entre operadores e setores.',
                          'Historico de contexto para reduzir retrabalho.',
                        ]}
                        stats={[
                          {
                            label: 'Tickets abertos',
                            value: '42',
                            detail: '11 com resposta pendente no momento',
                          },
                          {
                            label: 'Tempo medio',
                            value: '4m12s',
                            detail: 'Queda de 18% no tempo de primeira resposta',
                          },
                          {
                            label: 'Satisfacao',
                            value: '94%',
                            detail: 'Baseado nos ultimos 7 dias',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    path: '/contatos',
                    element: (
                      <ModulePage
                        title="Base de contatos e segmentos"
                        eyebrow="Contatos"
                        description="Centralize clientes, leads e listas inteligentes para alimentar atendimento, campanhas e CRM."
                        highlights={[
                          'Etiquetas por origem, etapa e potencial de compra.',
                          'Importacao e higienizacao da base comercial.',
                          'Segmentos reaproveitaveis para campanhas futuras.',
                        ]}
                        stats={[
                          {
                            label: 'Contatos ativos',
                            value: '12.8k',
                            detail: '3 listas prontas para nova campanha',
                          },
                          {
                            label: 'Novos leads',
                            value: '286',
                            detail: 'Captados nas ultimas 24 horas',
                          },
                          {
                            label: 'Perfis completos',
                            value: '81%',
                            detail: 'Com nome, telefone e origem preenchidos',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    path: '/campanhas',
                    element: (
                      <ModulePage
                        title="Campanhas com monitoramento"
                        eyebrow="Campanhas"
                        description="Planeje disparos, acompanhe entrega e ajuste segmentacoes sem sair do shell principal."
                        highlights={[
                          'Calendario de disparos por publico e janela.',
                          'Monitoramento de entrega e resposta em tempo real.',
                          'Comparativo de performance entre campanhas.',
                        ]}
                        stats={[
                          {
                            label: 'Campanhas ativas',
                            value: '05',
                            detail: '2 agendadas para hoje a tarde',
                          },
                          {
                            label: 'Taxa de entrega',
                            value: '98.6%',
                            detail: 'Media consolidada dos ultimos envios',
                          },
                          {
                            label: 'Cliques',
                            value: '13.4%',
                            detail: 'Melhor indice do ultimo trimestre',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    path: '/crm',
                    element: (
                      <ModulePage
                        title="Pipeline comercial orientado a WhatsApp"
                        eyebrow="CRM"
                        description="Conecte conversas a oportunidades para acompanhar negociaoes, follow-ups e previsao de receita."
                        highlights={[
                          'Etapas alinhadas ao funil comercial da operacao.',
                          'Alertas para follow-up vencido e risco de perda.',
                          'Visao rapida de valor em aberto por carteira.',
                        ]}
                        stats={[
                          {
                            label: 'Oportunidades',
                            value: '84',
                            detail: '12 em fase final de negociacao',
                          },
                          {
                            label: 'Receita prevista',
                            value: 'R$ 312k',
                            detail: 'Baseada nas oportunidades abertas',
                          },
                          {
                            label: 'Follow-ups hoje',
                            value: '19',
                            detail: '7 prioritarios para o comercial',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    path: '/chatbot',
                    element: (
                      <ModulePage
                        title="Automacoes e fluxos do chatbot"
                        eyebrow="Chatbot"
                        description="Projete jornadas de entrada, qualificacao e encaminhamento para escalar a operacao sem perder contexto."
                        highlights={[
                          'Fluxos de boas-vindas, triagem e distribuicao.',
                          'Blocos reutilizaveis para vendas e suporte.',
                          'Escalonamento inteligente para atendimento humano.',
                        ]}
                        stats={[
                          {
                            label: 'Fluxos ativos',
                            value: '07',
                            detail: '3 com testes A/B em andamento',
                          },
                          {
                            label: 'Contencao',
                            value: '63%',
                            detail: 'Resolvidos sem transferencia humana',
                          },
                          {
                            label: 'Tempo de roteamento',
                            value: '16s',
                            detail: 'Media ate a definicao do proximo passo',
                          },
                        ]}
                      />
                    ),
                  },
                  { path: '/configuracoes', element: <SettingsPage /> },
                  {
                    path: '/whatsapp',
                    element: (
                      <ModulePage
                        title="Saude do canal e instancias WhatsApp"
                        eyebrow="WhatsApp"
                        description="Acompanhe conexoes, sessoes e estabilidade do canal para reduzir interrupcoes na operacao."
                        highlights={[
                          'Visibilidade de QR Code, conexao e reconexao.',
                          'Monitoramento de fila, throughput e erros.',
                          'Base pronta para ligar webhooks e alertas.',
                        ]}
                        stats={[
                          {
                            label: 'Instancias online',
                            value: '09',
                            detail: '1 com alerta leve de reconexao',
                          },
                          {
                            label: 'Mensagens por min',
                            value: '284',
                            detail: 'Pico registrado no ultimo intervalo',
                          },
                          {
                            label: 'Disponibilidade',
                            value: '99.2%',
                            detail: 'Ultimos 30 dias de operacao',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    path: '/conversations',
                    element: <Navigate to="/atendimento" replace />,
                  },
                  {
                    path: '/settings',
                    element: <Navigate to="/configuracoes" replace />,
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to={DASHBOARD_ROUTE} replace /> },
    ],
  },
])
