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
import { ConversationsPage } from './pages/ConversationsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
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
                  { path: '/conversations', element: <ConversationsPage /> },
                  { path: '/settings', element: <SettingsPage /> },
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
