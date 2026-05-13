import { Navigate, Outlet } from 'react-router-dom'
import { COMPANY_SELECTION_ROUTE } from '../../constants/auth'
import { getAuthenticatedRoute, useAuthStore } from '../../store/authStore'

export function CompanyRoute() {
  const companies = useAuthStore((state) => state.companies)
  const currentCompany = useAuthStore((state) => state.currentCompany)

  const destination = getAuthenticatedRoute({ companies, currentCompany })

  if (destination === COMPANY_SELECTION_ROUTE) {
    return <Navigate to={COMPANY_SELECTION_ROUTE} replace />
  }

  return <Outlet />
}
