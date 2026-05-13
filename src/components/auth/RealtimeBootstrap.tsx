import { useEffect, useEffectEvent } from 'react'
import { buildRealtimeUrl, parseRealtimeEvents } from '../../lib/realtime'
import { useAuthStore } from '../../store/authStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

const createSocketErrorMessage = (url: string) =>
  `Falha ao conectar no websocket configurado em ${url}.`

export function RealtimeBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const setRealtimeState = useWorkspaceStore((state) => state.setRealtimeState)
  const applyRealtimeEvent = useWorkspaceStore((state) => state.applyRealtimeEvent)

  const handleSocketMessage = useEffectEvent((raw: string) => {
    const events = parseRealtimeEvents(raw)

    for (const event of events) {
      applyRealtimeEvent(event)
    }
  })

  useEffect(() => {
    if (!isAuthenticated || !token || !currentCompany?.id) {
      setRealtimeState({
        status: 'idle',
        retryCount: 0,
        lastError: null,
      })

      return
    }

    const socketUrl = buildRealtimeUrl({
      token,
      companyId: String(currentCompany.id),
    })

    if (!socketUrl) {
      setRealtimeState({
        status: 'error',
        lastError:
          'Defina VITE_WS_URL ou VITE_API_URL para habilitar o websocket.',
      })

      return
    }

    let socket: WebSocket | null = null
    let reconnectTimerId: number | null = null
    let disposed = false
    let reconnectAttempts = 0

    const clearReconnectTimer = () => {
      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId)
        reconnectTimerId = null
      }
    }

    const connect = () => {
      if (disposed) {
        return
      }

      setRealtimeState({
        status: 'connecting',
        retryCount: reconnectAttempts,
        lastError: null,
      })

      socket = new WebSocket(socketUrl)

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        setRealtimeState({
          status: 'connected',
          retryCount: 0,
          lastError: null,
          lastConnectedAt: new Date().toISOString(),
        })
      })

      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
          return
        }

        handleSocketMessage(event.data)
      })

      socket.addEventListener('error', () => {
        setRealtimeState({
          status: 'error',
          lastError: createSocketErrorMessage(socketUrl),
        })
      })

      socket.addEventListener('close', () => {
        if (disposed) {
          return
        }

        reconnectAttempts += 1

        setRealtimeState({
          status: 'disconnected',
          retryCount: reconnectAttempts,
          lastDisconnectedAt: new Date().toISOString(),
        })

        const reconnectDelayInMs = Math.min(1_000 * 2 ** (reconnectAttempts - 1), 15_000)

        clearReconnectTimer()
        reconnectTimerId = window.setTimeout(connect, reconnectDelayInMs)
      })
    }

    connect()

    return () => {
      disposed = true
      clearReconnectTimer()

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [
    applyRealtimeEvent,
    currentCompany?.id,
    handleSocketMessage,
    isAuthenticated,
    setRealtimeState,
    token,
  ])

  return null
}
