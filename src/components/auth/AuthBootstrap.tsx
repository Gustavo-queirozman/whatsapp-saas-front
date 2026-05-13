import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FullscreenLoader } from '../ui/FullscreenLoader'

export function AuthBootstrap() {
  const initialize = useAuthStore((state) => state.initialize)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (!initialized) {
    return <FullscreenLoader />
  }

  return <Outlet />
}
