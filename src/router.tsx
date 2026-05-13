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
import { CrmPage } from './pages/CrmPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
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
                  { path: '/crm', element: <CrmPage /> },
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
