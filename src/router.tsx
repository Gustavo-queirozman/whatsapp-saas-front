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
import { CampaignsPage } from './pages/CampaignsPage'
import { ChatbotPage } from './pages/ChatbotPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { ContactsPage } from './pages/ContactsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'
import { QueuesPage } from './pages/QueuesPage'
import { SectorsPage } from './pages/SectorsPage'
import { SettingsPage } from './pages/SettingsPage'
import { WhatsAppPage } from './pages/WhatsAppPage'

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
                  { path: '/atendimento', element: <ConversationsPage /> },
                  { path: '/contatos', element: <ContactsPage /> },
                  { path: '/filas', element: <QueuesPage /> },
                  { path: '/setores', element: <SectorsPage /> },
                  { path: '/campanhas', element: <CampaignsPage /> },
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
                    element: <ChatbotPage />,
                  },
                  { path: '/configuracoes', element: <SettingsPage /> },
                  { path: '/whatsapp', element: <WhatsAppPage /> },
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
